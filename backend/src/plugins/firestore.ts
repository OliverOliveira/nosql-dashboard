import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { readFile } from 'node:fs/promises';
import { env } from '../utils/env.js';

interface ServiceAccountConfig {
  projectId: string;
  clientEmail: string;
  privateKey: string;
}

interface ServiceAccountJson {
  project_id?: string;
  client_email?: string;
  private_key?: string;
  projectId?: string;
  clientEmail?: string;
  privateKey?: string;
}

async function loadServiceAccount(): Promise<ServiceAccountConfig> {
  if (env.firebaseServiceAccountPath) {
    const raw = await readFile(env.firebaseServiceAccountPath, 'utf8');
    const parsed = JSON.parse(raw) as ServiceAccountJson;
    const projectId = parsed.project_id ?? parsed.projectId ?? env.firebaseProjectId;
    const clientEmail = parsed.client_email ?? parsed.clientEmail ?? env.firebaseClientEmail;
    const privateKey = parsed.private_key ?? parsed.privateKey ?? env.firebasePrivateKey;

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error(
        'FIREBASE_SERVICE_ACCOUNT_PATH must point to a valid service account JSON file.',
      );
    }

    return {
      projectId,
      clientEmail,
      privateKey,
    };
  }

  if (!env.firebaseProjectId || !env.firebaseClientEmail || !env.firebasePrivateKey) {
    throw new Error(
      'Missing Firebase credentials. Set FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY.',
    );
  }

  return {
    projectId: env.firebaseProjectId,
    clientEmail: env.firebaseClientEmail,
    privateKey: env.firebasePrivateKey.replace(/\\n/g, '\n'),
  };
}

async function buildFirestore(): Promise<Firestore> {
  const existingApp = getApps()[0];

  if (existingApp) {
    return getFirestore(existingApp);
  }

  const credentials = await loadServiceAccount();
  const app = initializeApp({
    credential: cert(credentials),
    projectId: credentials.projectId,
  });

  return getFirestore(app);
}

async function firestorePlugin(app: FastifyInstance): Promise<void> {
  const firestore = await buildFirestore();

  app.decorate('firestore', firestore);
}

export const registerFirestore = fp(firestorePlugin, {
  name: 'firestore-plugin',
});
