import multipart from '@fastify/multipart';
import type { FastifyInstance } from 'fastify';

export const maxUploadSizeInBytes = 10 * 1024 * 1024;

export async function registerMultipart(app: FastifyInstance): Promise<void> {
  await app.register(multipart, {
    throwFileSizeLimit: true,
    limits: {
      fileSize: maxUploadSizeInBytes,
      files: 1,
      parts: 1,
    },
  });
}
