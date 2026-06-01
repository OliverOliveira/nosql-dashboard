import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import type { FastifyInstance } from 'fastify';

export async function registerSwagger(app: FastifyInstance): Promise<void> {
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'CSV Analytics API',
        version: '1.0.0',
        description: 'API para upload, processamento e análise de arquivos CSV/Excel',
      },
      tags: [
        { name: 'Upload', description: 'Endpoints para envio e processamento de arquivos' },
        { name: 'Stats', description: 'Endpoints de estatísticas e agregações dos dados' },
        { name: 'Health', description: 'Endpoints de verificação de saúde da API' },
      ],
    },
  });

  await app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
    },
  });
}
