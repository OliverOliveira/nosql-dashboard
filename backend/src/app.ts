import { registerFirestore } from './plugins/firestore.js';
import Fastify, { type FastifyError, type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { registerMultipart } from './plugins/multipart.js';
import { registerSwagger } from './plugins/swagger.js';
import { healthRoutes } from './routes/health.routes.js';
import { statsRoutes } from './routes/stats.routes.js';
import { uploadRoutes } from './routes/upload.routes.js';

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL ?? 'info',
    },
  });

  await app.register(cors, {
    origin: true,
    credentials: true,
  });

  await registerSwagger(app);
  await app.register(registerFirestore);
  await registerMultipart(app);

  await app.register(healthRoutes);
  await app.register(statsRoutes);
  await app.register(uploadRoutes);

  app.setNotFoundHandler((request, reply) => {
    reply.status(404).send({
      error: 'Not Found',
      message: `Route ${request.method} ${request.url} not found`,
    });
  });

  app.setErrorHandler((error: FastifyError, request, reply) => {
    request.log.error(error);

    reply.status(error.statusCode ?? 500).send({
      error: error.name,
      message: error.message,
      code: error.code,
    });
  });

  return app;
}
