import type { FastifyPluginAsync } from 'fastify';
import { uploadFile } from '../controllers/upload.controller.js';

export const uploadRoutes: FastifyPluginAsync = async (app) => {
  app.post(
    '/upload',
    {
      schema: {
        tags: ['Upload'],
        summary: 'Recebe um arquivo CSV ou Excel para processamento',
        description: 'Envia um arquivo CSV ou XLSX para extração, normalização e armazenamento no Firestore.',
        consumes: ['multipart/form-data'],
        response: {
          201: {
            type: 'object',
            properties: {
              filename: { type: 'string' },
              mimetype: { type: 'string' },
              status: { type: 'string', enum: ['uploaded'] },
            },
            required: ['filename', 'mimetype', 'status'],
          },
          400: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
              code: { type: 'string' },
            },
          },
          413: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
              code: { type: 'string' },
            },
          },
          415: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
              code: { type: 'string' },
            },
          },
        },
      },
    },
    uploadFile,
  );
};
