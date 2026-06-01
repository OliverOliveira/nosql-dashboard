import { randomUUID } from 'node:crypto';
import type { Firestore } from 'firebase-admin/firestore';
import type { NormalizedRow } from './data-normalizer.service.js';

const FIRESTORE_BATCH_LIMIT = 500;

export interface UploadMetadata {
  filename: string;
  rowsCount: number;
}

export const firestoreService = {
  async createUpload(
    firestore: Firestore,
    metadata: UploadMetadata,
  ): Promise<{ id: string }> {
    const uploadsRef = firestore.collection('uploads').doc();
    const id = uploadsRef.id;

    await uploadsRef.set({
      id,
      filename: metadata.filename,
      rowsCount: metadata.rowsCount,
      uploadedAt: new Date(),
    });

    return { id };
  },

  async saveDatasetRows(
    firestore: Firestore,
    rows: NormalizedRow[],
    uploadId: string,
  ): Promise<void> {
    if (rows.length === 0) {
      return;
    }

    for (let index = 0; index < rows.length; index += FIRESTORE_BATCH_LIMIT) {
      const chunk = rows.slice(index, index + FIRESTORE_BATCH_LIMIT);
      const batch = firestore.batch();

      for (const row of chunk) {
        const docRef = firestore.collection('datasets').doc(randomUUID());
        batch.set(docRef, {
          uploadId,
          ...row,
          createdAt: new Date(),
        });
      }

      await batch.commit();
    }
  },
};
