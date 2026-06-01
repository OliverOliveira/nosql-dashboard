import type { FastifyReply, FastifyRequest } from 'fastify';
import { uploadService } from '../services/upload.service.js';
import { isFileTooLargeError, UploadError } from '../utils/upload-error.js';

export async function uploadFile(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    const file = await request.file();
    const result = await uploadService.handleUpload(file, request.server.firestore);

    reply.status(201).send(result);
  } catch (error) {
    throw normalizeUploadError(error);
  }
}

function normalizeUploadError(error: unknown): Error {
  if (error instanceof UploadError) {
    return error;
  }

  if (isFileTooLargeError(error)) {
    return new UploadError(
      'Tamanho do arquivo excedido. O limite e 10MB.',
      413,
      'UPLOAD_FILE_TOO_LARGE',
    );
  }

  if (
    error instanceof Error &&
    'code' in error &&
    error.code === 'FST_INVALID_MULTIPART_CONTENT_TYPE'
  ) {
    return new UploadError(
      'Requisicao deve usar multipart/form-data.',
      400,
      'UPLOAD_INVALID_CONTENT_TYPE',
    );
  }

  return new UploadError(
    'Upload interrompido ou arquivo incompleto.',
    400,
    'UPLOAD_INTERRUPTED',
  );
}
