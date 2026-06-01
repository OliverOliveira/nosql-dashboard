import 'fastify';
import type { Firestore } from 'firebase-admin/firestore';

declare module 'fastify' {
  interface FastifyInstance {
    firestore: Firestore;
  }
}
