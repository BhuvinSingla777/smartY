import {
  ParsedSheet,
  excelSerialToIsoDate,
  mapPodHeader,
  normalizePercentage,
  parseFlexibleDate,
  uniquifyHeaders,
} from '@/lib/shared';

type Matrix = (string | number | boolean | Date | null | undefined)[][];

function cellText(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return parseFlexibleDate(value) ?? '';
  return String(value).replace(/\s+/g, ' ').trim();
}

function isPodNameLabel(value: unknown): boolean {
  return /pod\s*name/i.test(cellText(value));
}

function findHeaderRowIndex(matrix: Matrix): number {
  const limit = Math.min(matrix.length, 12);
  for (let i = 0; i < limit; i++) {
    if ((matrix[i] ?? []).some((cell) => isPodNameLabel(cell))) return i;
  }
  for (let i = 0; i < limit; i++) {
    const filled = (matrix[i] ?? []).filter((c) => cellText(c) !== '');
    if (filled.length >= 2) return i;
  }
  return 0;
}

function extractDateLabel(value: unknown): string | null {
  const text = cellText(value);
  if (!text) return null;
  const embedded = text.match(/(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})/);
  if (embedded) return parseFlexibleDate(embedded[1]);
  return parseFlexibleDate(text);
}

function isDateTitleRow(row: unknown[]): boolean {
  const joined = row.map((c) => cellText(c)).join(' ');
  return (
    /completion percentage/i.test(joined) &&
    /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/.test(joined)
  );
}

function isCompletionHeader(header: string): boolean {
  const field = mapPodHeader(header.split('—')[0] ?? header);
  return (
    field === 'feCompletion' ||
    field === 'beCompletion' ||
    field === 'integrationCompletion'
  );
}

function coerceCell(value: unknown, header: string): unknown {
  if (value === null || value === undefined || value === '') return null;

  if (typeof value === 'number' && Number.isFinite(value)) {
    if (/date/i.test(header) && value > 20000 && value < 80000) {
      return excelSerialToIsoDate(value);
    }
    if (isCompletionHeader(header) && value >= 0 && value <= 1) {
      return Math.round(value * 10000) / 100;
    }
    return value;
  }

  if (value instanceof Date) {
    return parseFlexibleDate(value);
  }

  const text = cellText(value);
  if (!text) return null;
  if (/date/i.test(header)) {
    return parseFlexibleDate(text) ?? text;
  }
  if (isCompletionHeader(header)) {
    return normalizePercentage(text) ?? text;
  }
  return text;
}

function buildDailyLayout(titleRow: unknown[], metricRow: unknown[]) {
  const width = Math.max(titleRow.length, metricRow.length);
  let lastDate: string | null = null;
  const filledDates: Array<string | null> = [];
  for (let i = 0; i < width; i++) {
    const extracted = extractDateLabel(titleRow[i]);
    if (extracted) lastDate = extracted;
    filledDates.push(lastDate);
  }

  const headers: string[] = [];
  const colIndexes: number[] = [];
  for (let i = 0; i < width; i++) {
    const metric = cellText(metricRow[i]);
    if (!metric) continue;
    if (isPodNameLabel(metric)) {
      headers.push('POD Name');
      colIndexes.push(i);
      continue;
    }
    const date = filledDates[i];
    headers.push(date ? `${metric} — ${date}` : metric);
    colIndexes.push(i);
  }

  return { headers: uniquifyHeaders(headers), colIndexes };
}

function buildInfoLayout(metricRow: unknown[]) {
  const headers: string[] = [];
  const colIndexes: number[] = [];
  for (let i = 0; i < metricRow.length; i++) {
    const label = cellText(metricRow[i]);
    if (!label) continue;
    headers.push(label);
    colIndexes.push(i);
  }
  return { headers: uniquifyHeaders(headers), colIndexes };
}

/**
 * PODS.xlsx layout:
 * Info: row 1 title ("Completion Percentage"), row 2 headers, then one row per POD.
 * Daily Update: row 1 date groups, row 2 FE/BE/Integration, then one row per POD.
 */
export function matrixToParsedSheet(name: string, matrix: Matrix): ParsedSheet | null {
  if (!matrix.length) return null;
  const headerRowIndex = findHeaderRowIndex(matrix);
  const metricRow = matrix[headerRowIndex] ?? [];
  const titleRow = headerRowIndex > 0 ? (matrix[headerRowIndex - 1] ?? []) : [];
  const daily = isDateTitleRow(titleRow);
  const { headers, colIndexes } = daily
    ? buildDailyLayout(titleRow, metricRow)
    : buildInfoLayout(metricRow);

  if (headers.length === 0) return null;

  const rows: Record<string, unknown>[] = [];
  for (let r = headerRowIndex + 1; r < matrix.length; r++) {
    const raw = matrix[r] ?? [];
    const obj: Record<string, unknown> = {};
    let hasValue = false;
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i];
      const value = coerceCell(raw[colIndexes[i]], header);
      obj[header] = value;
      if (value !== null && value !== undefined && String(value).trim() !== '') {
        hasValue = true;
      }
    }
    if (hasValue) rows.push(obj);
  }

  return { name, headers, rows };
}

export function isPodsWorkbook(sheetNames: string[]): boolean {
  const names = sheetNames.map((n) => n.trim().toLowerCase());
  return names.includes('info') && names.some((n) => n.includes('daily'));
}
