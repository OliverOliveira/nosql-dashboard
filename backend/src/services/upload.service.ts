import type { MultipartFile } from '@fastify/multipart';
import { extname } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { Firestore } from 'firebase-admin/firestore';
import { dataNormalizerService } from './data-normalizer.service.js';
import { fileParserService } from './file-parser.service.js';
import { firestoreService } from './firestore.service.js';
import { isFileTooLargeError, UploadError } from '../utils/upload-error.js';

const allowedMimeTypesByExtension = {
  '.csv': new Set(['text/csv', 'application/csv', 'application/vnd.ms-excel']),
  '.xlsx': new Set([
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ]),
} as const;

type AllowedExtension = keyof typeof allowedMimeTypesByExtension;

export interface UploadResult {
  filename: string;
  mimetype: string;
  status: 'uploaded';
}

interface PipelineFile {
  firestore: Firestore;
  buffer: Buffer;
  filename: string;
  mimetype: string;
  originalFilename: string;
}

export const uploadService = {
  async handleUpload(
    file: MultipartFile | undefined,
    firestore: Firestore,
  ): Promise<UploadResult> {
    if (!file) {
      throw new UploadError('Arquivo nao enviado.', 400, 'UPLOAD_FILE_REQUIRED');
    }

    const extension = getAllowedExtension(file.filename);
    validateMimeType(extension, file.mimetype);

    const filename = `${randomUUID()}${extension}`;
    const buffer = await readFileBuffer(file);

    await sendToProcessingPipeline({
      firestore,
      buffer,
      filename,
      mimetype: file.mimetype,
      originalFilename: file.filename,
    });

    return {
      filename,
      mimetype: file.mimetype,
      status: 'uploaded',
    };
  },
};

function getAllowedExtension(filename: string): AllowedExtension {
  const extension = extname(filename).toLowerCase();

  if (extension !== '.csv' && extension !== '.xlsx') {
    throw new UploadError(
      'Tipo de arquivo invalido. Envie um arquivo .csv ou .xlsx.',
      415,
      'UPLOAD_INVALID_EXTENSION',
    );
  }

  return extension;
}

function validateMimeType(extension: AllowedExtension, mimetype: string): void {
  if (!allowedMimeTypesByExtension[extension].has(mimetype)) {
    throw new UploadError(
      'MIME type invalido para o arquivo enviado.',
      415,
      'UPLOAD_INVALID_MIME_TYPE',
    );
  }
}

async function readFileBuffer(file: MultipartFile): Promise<Buffer> {
  try {
    return await file.toBuffer();
  } catch (error) {
    if (isFileTooLargeError(error)) {
      throw new UploadError(
        'Tamanho do arquivo excedido. O limite e 10MB.',
        413,
        'UPLOAD_FILE_TOO_LARGE',
      );
    }

    throw new UploadError(
      'Upload interrompido ou arquivo incompleto.',
      400,
      'UPLOAD_INTERRUPTED',
    );
  }
}

async function sendToProcessingPipeline(file: PipelineFile): Promise<void> {
  let normalizedRows;

  try {
    const parsedFile = await fileParserService.parseBuffer(file.buffer, {
      filename: file.filename,
    });
    normalizedRows = dataNormalizerService.normalizeRows(parsedFile.rows);
  } catch {
    throw new UploadError(
      'Nao foi possivel processar o arquivo enviado.',
      422,
      'UPLOAD_PARSE_FAILED',
    );
  }

  try {
    const upload = await firestoreService.createUpload(file.firestore, {
      filename: file.originalFilename,
      rowsCount: normalizedRows.length,
    });
    await firestoreService.saveDatasetRows(
      file.firestore,
      normalizedRows,
      upload.id,
    );
  } catch {
    throw new UploadError(
      'Nao foi possivel salvar os dados no Firestore.',
      500,
      'UPLOAD_FIRESTORE_WRITE_FAILED',
    );
  }
}
