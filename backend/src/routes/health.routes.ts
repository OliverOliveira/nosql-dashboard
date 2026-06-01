import type { FastifyPluginAsync } from 'fastify';
import { getHealth } from '../controllers/health.controller.js';

export const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get(
    '/health',
    {
      schema: {
        tags: ['Health'],
        summary: 'Verifica se a API está online',
        description: 'Retorna o estado de funcionamento básico da aplicação.',
        response: {
          200: {
            type: 'object',
            properties: {
              status: { type: 'string', enum: ['ok'] },
            },
            required: ['status'],
          },
        },
      },
    },
    getHealth,
  );
};
