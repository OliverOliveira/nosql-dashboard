export type NormalizedValue = string | number | boolean | null;
export type NormalizedRow = Record<string, NormalizedValue>;

const invalidStringValues = new Set([
  '',
  '-',
  '--',
  'n/a',
  'na',
  'null',
  'undefined',
  'sem dados',
  's/d',
]);

const canonicalColumnRules: Array<{
  column: string;
  patterns: RegExp[];
}> = [
  {
    column: 'provincia',
    patterns: [
      /^prov$/,
      /^province$/,
      /^provincia$/,
      /^provincia_nome$/,
      /^nome_provincia$/,
    ],
  },
  {
    column: 'pib',
    patterns: [
      /^pib$/,
      /^pib_.*$/,
      /^produto_interno_bruto$/,
      /^produto_interno_bruto_.*$/,
      /^gdp$/,
      /^gdp_.*$/,
    ],
  },
  {
    column: 'data',
    patterns: [/^data$/, /^date$/, /^dt$/, /^periodo$/, /^ano_mes$/],
  },
  {
    column: 'ano',
    patterns: [/^ano$/, /^year$/],
  },
  {
    column: 'populacao',
    patterns: [/^populacao$/, /^pop$/, /^population$/],
  },
];

export const dataNormalizerService = {
  normalizeRows(rows: Array<Record<string, unknown>>): NormalizedRow[] {
    return rows
      .map((row) => normalizeRow(row))
      .filter((row) => Object.keys(row).length > 0);
  },

  mapColumnName(columnName: string): string {
    const normalizedColumn = normalizeColumnName(columnName);
    const rule = canonicalColumnRules.find(({ patterns }) =>
      patterns.some((pattern) => pattern.test(normalizedColumn)),
    );

    return rule?.column ?? normalizedColumn;
  },

  normalizeColumnName(columnName: string): string {
    return normalizeColumnName(columnName);
  },

  normalizeValue(value: unknown): NormalizedValue | undefined {
    return normalizeValue(value);
  },
};

function normalizeRow(row: Record<string, unknown>): NormalizedRow {
  return Object.entries(row).reduce<NormalizedRow>((accumulator, [column, value]) => {
    const normalizedColumn = dataNormalizerService.mapColumnName(column);
    const normalizedValue = normalizeValue(value);

    if (normalizedValue === undefined) {
      return accumulator;
    }

    if (
      accumulator[normalizedColumn] === undefined ||
      accumulator[normalizedColumn] === null
    ) {
      accumulator[normalizedColumn] = normalizedValue;
    }

    return accumulator;
  }, {});
}

function normalizeColumnName(columnName: string): string {
  const normalized = columnName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\([^)]*\)/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');

  return normalized || 'column';
}

function normalizeValue(value: unknown): NormalizedValue | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : toIsoDate(value);
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  const text = String(value).trim();

  if (invalidStringValues.has(text.toLowerCase())) {
    return undefined;
  }

  const booleanValue = parseBoolean(text);

  if (booleanValue !== undefined) {
    return booleanValue;
  }

  const dateValue = parseDate(text);

  if (dateValue !== undefined) {
    return dateValue;
  }

  const numberValue = parseNumber(text);

  if (numberValue !== undefined) {
    return numberValue;
  }

  return text;
}

function parseBoolean(value: string): boolean | undefined {
  if (/^(true|sim|yes)$/i.test(value)) {
    return true;
  }

  if (/^(false|nao|no)$/i.test(value)) {
    return false;
  }

  return undefined;
}

function parseNumber(value: string): number | undefined {
  const sanitized = value
    .replace(/\s/g, '')
    .replace(/[^\d,.-]/g, '');

  if (!/^-?\d[\d,.-]*$/.test(sanitized)) {
    return undefined;
  }

  const decimalSeparator = getDecimalSeparator(sanitized);
  const normalized =
    decimalSeparator === ','
      ? sanitized.replace(/\./g, '').replace(',', '.')
      : sanitized.replace(/,/g, '');
  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : undefined;
}

function getDecimalSeparator(value: string): ',' | '.' {
  const commaIndex = value.lastIndexOf(',');
  const dotIndex = value.lastIndexOf('.');

  return commaIndex > dotIndex ? ',' : '.';
}

function parseDate(value: string): string | undefined {
  const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (isoMatch) {
    return buildIsoDate(Number(isoMatch[1]), Number(isoMatch[2]), Number(isoMatch[3]));
  }

  const slashMatch = value.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);

  if (slashMatch) {
    return buildIsoDate(Number(slashMatch[3]), Number(slashMatch[2]), Number(slashMatch[1]));
  }

  return undefined;
}

function buildIsoDate(year: number, month: number, day: number): string | undefined {
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return undefined;
  }

  return toIsoDate(date);
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
