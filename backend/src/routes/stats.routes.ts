import type { FastifyPluginAsync } from 'fastify';
import { getGroupByField, getSummary } from '../controllers/stats.controller.js';

export const statsRoutes: FastifyPluginAsync = async (app) => {
  app.get(
    '/stats/summary',
    {
      schema: {
        tags: ['Stats'],
        summary: 'Retorna estatísticas gerais dos dados carregados',
        description: 'Calcula métricas como contagem, soma e média para campos numéricos dos dados armazenados.',
        response: {
          200: {
            type: 'object',
            properties: {
              totalRows: { type: 'integer' },
              numericFields: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    field: { type: 'string' },
                    count: { type: 'integer' },
                    sum: { type: 'number' },
                    average: { type: 'number' },
                  },
                  required: ['field', 'count', 'sum', 'average'],
                },
              },
            },
            required: ['totalRows', 'numericFields'],
          },
        },
      },
    },
    getSummary,
  );

  app.get(
    '/stats/group-by/:field',
    {
      schema: {
        tags: ['Stats'],
        summary: 'Agrupa os dados por um campo dinâmico e retorna contagem por grupo',
        description: 'Gera uma lista de valores distintos para o campo informado e conta quantos registros existem em cada grupo.',
        params: {
          type: 'object',
          properties: {
            field: {
              type: 'string',
              description: 'Nome do campo pelo qual os dados devem ser agrupados',
            },
          },
          required: ['field'],
        },
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                total: { type: 'integer' },
              },
              additionalProperties: true,
            },
          },
        },
      },
    },
    getGroupByField,
  );
};
