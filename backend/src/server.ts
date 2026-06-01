import 'dotenv/config';
import { buildApp } from './app.js';
import { env } from './utils/env.js';

const app = await buildApp();

try {
  await app.listen({
    host: env.host,
    port: env.port,
  });
  console.log(`Server is running at http://${env.host}:${env.port}`);
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
