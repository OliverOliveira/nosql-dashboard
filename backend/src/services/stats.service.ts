import type { Firestore } from 'firebase-admin/firestore';

const METADATA_FIELDS = new Set(['uploadId', 'createdAt']);
const VALID_FIELD_NAME = /^[a-zA-Z0-9_]+$/;

export interface NumericFieldSummary {
  field: string;
  count: number;
  sum: number;
  average: number;
}

export interface SummaryResult {
  totalRows: number;
  numericFields: NumericFieldSummary[];
}

export interface GroupByResultItem {
  total: number;
  [key: string]: string | number | boolean | null;
}

export const statsService = {
  async getSummary(firestore: Firestore): Promise<SummaryResult> {
    const snapshot = await firestore.collection('datasets').get();
    const numericFields = new Map<string, { sum: number; count: number }>();

    for (const doc of snapshot.docs) {
      const data = doc.data();

      for (const [field, rawValue] of Object.entries(data)) {
        if (METADATA_FIELDS.has(field)) {
          continue;
        }

        if (typeof rawValue !== 'number' || Number.isNaN(rawValue)) {
          continue;
        }

        const fieldStats = numericFields.get(field);

        if (fieldStats) {
          fieldStats.sum += rawValue;
          fieldStats.count += 1;
        } else {
          numericFields.set(field, { sum: rawValue, count: 1 });
        }
      }
    }

    return {
      totalRows: snapshot.size,
      numericFields: Array.from(numericFields.entries())
        .map(([field, stats]) => ({
          field,
          sum: stats.sum,
          count: stats.count,
          average: stats.count === 0 ? 0 : stats.sum / stats.count,
        }))
        .sort((a, b) => a.field.localeCompare(b.field)),
    };
  },

  async getGroupByField(
    firestore: Firestore,
    field: string,
  ): Promise<GroupByResultItem[]> {
    this.validateFieldName(field);

    const groupQuery = firestore
      .collection('datasets')
      .where(field, '!=', null);

    const snapshot = await groupQuery.get();

    if (snapshot.empty) {
      throw this.createInvalidFieldError(field);
    }

    const groups = new Map<string, { value: string | number | boolean | null; total: number }>();

    for (const doc of snapshot.docs) {
      const value = doc.get(field);

      if (value === undefined) {
        continue;
      }

      const bucketKey = `${typeof value}:${String(value)}`;
      const existing = groups.get(bucketKey);

      if (existing) {
        existing.total += 1;
      } else {
        groups.set(bucketKey, {
          value,
          total: 1,
        });
      }
    }

    if (groups.size === 0) {
      throw this.createInvalidFieldError(field);
    }

    return Array.from(groups.values())
      .map((group) => ({
        [field]: group.value,
        total: group.total,
      }))
      .sort((first, second) => second.total - first.total);
  },

  validateFieldName(field: string): void {
    if (!field || !VALID_FIELD_NAME.test(field)) {
      throw this.createInvalidFieldError(field);
    }
  },

  createInvalidFieldError(field: string): Error {
    const error = new Error(
      `O campo de agrupamento '${field}' não é válido ou não existe nos dados.`,
    );
    Object.assign(error, {
      statusCode: 400,
      code: 'INVALID_STATS_FIELD',
    });

    return error;
  },
};
