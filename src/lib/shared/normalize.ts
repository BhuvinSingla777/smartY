/** Normalize names for unique-key comparison */
export function normalizeKey(value: string): string {
  return value
    .normalize('NFKC')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/** True for aggregate/summary rows that must never be stored as BDG members */
export function isAggregateMemberName(value: string): boolean {
  const key = normalizeKey(value);
  if (!key) return false;
  return (
    key === 'total' ||
    key === 'totals' ||
    key === 'grand total' ||
    key === 'grand totals' ||
    key === 'sum' ||
    key === 'overall' ||
    key === 'all' ||
    key.startsWith('total ') ||
    key.endsWith(' total')
  );
}

/** Normalize header labels for flexible column mapping */
export function normalizeHeader(value: string): string {
  return value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[%()]/g, ' ')
    .replace(/[_\-/\\]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Convert completion values to 0–100 scale.
 * Accepts: 85, "85%", 0.85, "0.85"
 */
export function normalizePercentage(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim().replace(/[~≈∼]/g, '');
    if (!trimmed) return null;
    const hasPercent = trimmed.includes('%');
    const numeric = Number(trimmed.replace(/%/g, '').replace(/,/g, '').trim());
    if (Number.isNaN(numeric)) return null;
    if (hasPercent) return clampPercent(numeric);
    if (numeric >= 0 && numeric <= 1) return clampPercent(numeric * 100);
    return clampPercent(numeric);
  }

  if (typeof value === 'number') {
    if (Number.isNaN(value)) return null;
    if (value >= 0 && value <= 1) return clampPercent(value * 100);
    return clampPercent(value);
  }

  return null;
}

function clampPercent(n: number): number {
  if (n < 0) return 0;
  if (n > 100) return 100;
  return Math.round(n * 100) / 100;
}

export function parseNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === 'string') {
    const cleaned = value.replace(/,/g, '').trim();
    if (!cleaned) return null;
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/** Excel serial date → ISO date string (UTC midnight) */
export function excelSerialToIsoDate(serial: number): string {
  const utcDays = Math.floor(serial - 25569);
  const date = new Date(utcDays * 86400 * 1000);
  return date.toISOString().slice(0, 10);
}

const MONTH_INDEX: Record<string, number> = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
};

function isoDate(year: number, month: number, day: number): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function parseFlexibleDate(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null;

  if (typeof value === 'number' && value > 20000 && value < 80000) {
    return excelSerialToIsoDate(value);
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const serial = value.getTime() / 86400000 + 25569;
    return excelSerialToIsoDate(serial);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;

    const dmy = trimmed.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
    if (dmy) {
      return isoDate(Number(dmy[3]), Number(dmy[2]), Number(dmy[1]));
    }

    const dMonY = trimmed.match(/^(\d{1,2})[\/\-.\s]+([A-Za-z]{3,9})[\/\-.\s]+(\d{4})$/);
    if (dMonY) {
      const month = MONTH_INDEX[dMonY[2].toLowerCase()];
      if (month) return isoDate(Number(dMonY[3]), month, Number(dMonY[1]));
    }

    const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
    }
  }

  return null;
}

/** Make duplicate column titles unique so every sheet column is preserved. */
export function uniquifyHeaders(headers: string[]): string[] {
  const seen = new Map<string, number>();
  return headers.map((raw, idx) => {
    const base = String(raw ?? '').trim() || `Column_${idx + 1}`;
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    return count === 0 ? base : `${base} (${count + 1})`;
  });
}

export function serializeCell(
  value: unknown,
): string | number | boolean | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  const text = String(value).trim();
  return text === '' ? null : text;
}

export function serializeSheetRows(
  headers: string[],
  rows: Record<string, unknown>[],
): Record<string, unknown>[] {
  return rows.map((row) => {
    const next: Record<string, unknown> = {};
    for (const header of headers) {
      next[header] = serializeCell(row[header]);
    }
    return next;
  });
}

export function overallCompletion(
  fe: number | null | undefined,
  be: number | null | undefined,
  integration: number | null | undefined,
): number | null {
  const values = [fe, be, integration].filter(
    (v): v is number => typeof v === 'number' && !Number.isNaN(v),
  );
  if (values.length === 0) return null;
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100;
}
