import csvParser from 'csv-parser';
import { createReadStream } from 'node:fs';
import { extname } from 'node:path';
import { Readable } from 'node:stream';
import * as XLSX from 'xlsx';

export type SupportedFileType = 'csv' | 'xlsx';
export type ParsedRow = Record<string, string | number | boolean | null>;

type RawRow = Array<unknown>;

export interface ParseOptions {
  filename?: string;
}

export interface ParsedFile {
  rows: ParsedRow[];
  fileType: SupportedFileType;
  sheetName?: string;
}

export const fileParserService = {
  async parseFile(filePath: string): Promise<ParsedFile> {
    const fileType = this.detectFileType(filePath);

    if (fileType === 'csv') {
      return {
        rows: await parseCsvStream(createReadStream(filePath)),
        fileType,
      };
    }

    return parseExcelBuffer(await readStreamToBuffer(createReadStream(filePath)));
  },

  async parseBuffer(buffer: Buffer, options: ParseOptions = {}): Promise<ParsedFile> {
    const fileType = this.detectFileType(options.filename ?? '');

    if (fileType === 'csv') {
      return {
        rows: await parseCsvStream(Readable.from(buffer)),
        fileType,
      };
    }

    return parseExcelBuffer(buffer);
  },

  detectFileType(filename: string): SupportedFileType {
    const extension = extname(filename).toLowerCase();

    if (extension === '.csv') {
      return 'csv';
    }

    if (extension === '.xlsx') {
      return 'xlsx';
    }

    throw new Error('Unsupported file type. Expected .csv or .xlsx.');
  },

  normalizeHeaders(headers: unknown[]): string[] {
    const seen = new Map<string, number>();

    return headers.map((header, index) => {
      const baseHeader = normalizeHeader(header, index);
      const count = seen.get(baseHeader) ?? 0;

      seen.set(baseHeader, count + 1);

      return count === 0 ? baseHeader : `${baseHeader}_${count + 1}`;
    });
  },
};

function normalizeHeader(header: unknown, index: number): string {
  const normalized = String(header ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');

  return normalized || `column_${index + 1}`;
}

function parseCsvStream(stream: NodeJS.ReadableStream): Promise<ParsedRow[]> {
  return new Promise((resolve, reject) => {
    const rows: RawRow[] = [];

    stream
      .pipe(csvParser({ headers: false, skipComments: true }))
      .on('data', (row: Record<string, unknown>) => {
        const values = Object.keys(row)
          .sort((left, right) => Number(left) - Number(right))
          .map((key) => row[key]);

        rows.push(values);
      })
      .on('error', reject)
      .on('end', () => {
        resolve(convertRowsToJson(rows));
      });
  });
}

function parseExcelBuffer(buffer: Buffer): ParsedFile {
  const workbook = XLSX.read(buffer, {
    type: 'buffer',
    cellDates: true,
  });

  const sheets = workbook.SheetNames.map((sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    const rows = sheet
      ? (XLSX.utils.sheet_to_json(sheet, {
          header: 1,
          defval: null,
          blankrows: false,
          raw: false,
        }) as RawRow[])
      : [];

    return {
      sheetName,
      rows: convertRowsToJson(rows),
    };
  });

  const selectedSheet = sheets.reduce(
    (best, current) => (current.rows.length > best.rows.length ? current : best),
    { sheetName: undefined as string | undefined, rows: [] as ParsedRow[] },
  );

  return {
    rows: selectedSheet.rows,
    fileType: 'xlsx',
    sheetName: selectedSheet.sheetName,
  };
}

function convertRowsToJson(rows: RawRow[]): ParsedRow[] {
  const headerIndex = rows.findIndex((row) => !isEmptyRow(row));

  if (headerIndex === -1) {
    return [];
  }

  const headers = fileParserService.normalizeHeaders(rows[headerIndex] ?? []);

  return rows
    .slice(headerIndex + 1)
    .filter((row) => !isEmptyRow(row))
    .map((row) => rowToObject(headers, row));
}

function rowToObject(headers: string[], row: RawRow): ParsedRow {
  return headers.reduce<ParsedRow>((accumulator, header, index) => {
    accumulator[header] = normalizeValue(row[index]);
    return accumulator;
  }, {});
}

function normalizeValue(value: unknown): string | number | boolean | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  const text = String(value).trim();

  if (text === '') {
    return null;
  }

  const normalizedNumber = Number(text.replace(',', '.'));

  if (!Number.isNaN(normalizedNumber) && /^-?\d+(?:[,.]\d+)?$/.test(text)) {
    return normalizedNumber;
  }

  if (/^(true|false)$/i.test(text)) {
    return text.toLowerCase() === 'true';
  }

  return text;
}

function isEmptyRow(row: RawRow): boolean {
  return row.every((value) => value === null || value === undefined || String(value).trim() === '');
}

function readStreamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];

    stream
      .on('data', (chunk: Buffer | string) => {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      })
      .on('error', reject)
      .on('end', () => {
        resolve(Buffer.concat(chunks));
      });
  });
}
