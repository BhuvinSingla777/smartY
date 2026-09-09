import {
  ParsedSheet,
  mapPodHeader,
  normalizeKey,
  normalizePercentage,
  parseFlexibleDate,
  resolvePodBranch,
  serializeCell,
  uniquifyHeaders,
  emptyDomainCompletions,
  finalizeDomainCompletions,
  parseDomainMetricHeader,
  type PodBranch,
  type PodField,
  type PodDomainCompletions,
} from '@/lib/shared';

export type SheetPodDto = {
  name: string;
  description?: string | null;
  status?: string | null;
  startDate?: string | null;
  developers?: string | null;
  machineOwner?: string | null;
  machineAlignedToProject?: string | null;
  branch?: PodBranch | null;
  feCompletion?: number | null;
  beCompletion?: number | null;
  integrationCompletion?: number | null;
  domainCompletions?: PodDomainCompletions | null;
  extraFields?: Record<string, unknown> | null;
};

export type SheetPodCandidate = {
  rowIndex: number;
  name: string;
  dto: SheetPodDto;
  extraFields: Record<string, unknown>;
  issues: string[];
};

export function pickPodSheetIndex(sheets: ParsedSheet[]): number {
  if (sheets.length === 0) return 0;
  const info = sheets.findIndex((s) => /^info$/i.test(s.name.trim()));
  if (info >= 0) return info;
  const byName = sheets.findIndex((s) => /info/i.test(s.name) && !/daily/i.test(s.name));
  if (byName >= 0) return byName;
  const withPodName = sheets.findIndex((s) =>
    s.headers.some((h) => mapPodHeader(h) === 'podName'),
  );
  if (withPodName >= 0) return withPodName;
  return 0;
}

export function pickDailySheet(sheets: ParsedSheet[]): ParsedSheet | null {
  return (
    sheets.find((s) => /daily/i.test(s.name)) ??
    sheets.find((s) =>
      s.headers.some((h) => /—\s*\d{4}-\d{2}-\d{2}/.test(h) || /completion percentage/i.test(h)),
    ) ??
    null
  );
}

export function detectPodNameHeader(headers: string[]): string | null {
  const mapped = headers.find((h) => mapPodHeader(h) === 'podName');
  if (mapped) return mapped;
  const named = headers.find((h) => {
    const key = h.trim().toLowerCase();
    return key === 'name' || key === 'pod' || key.includes('pod name');
  });
  return named ?? headers[0] ?? null;
}

export function sheetRowToPod(
  row: Record<string, unknown>,
  headers: string[],
  rowIndex = 0,
): SheetPodCandidate | null {
  const uniqueHeaders = headers.length ? headers : Object.keys(row);
  const nameHeader = detectPodNameHeader(uniqueHeaders);
  const mapped: Partial<Record<PodField, unknown>> = {};
  const extraFields: Record<string, unknown> = {};
  const domainBucket = emptyDomainCompletions();

  for (const header of uniqueHeaders) {
    const value = serializeCell(row[header]);
    if (value === null || value === '/' || value === '-' || value === '—') continue;
    const parsed = parseDomainMetricHeader(header);
    if (
      parsed.domain &&
      (parsed.field === 'feCompletion' ||
        parsed.field === 'beCompletion' ||
        parsed.field === 'integrationCompletion')
    ) {
      const pct = toPercent(value);
      if (parsed.field === 'feCompletion') domainBucket[parsed.domain].fe = pct;
      if (parsed.field === 'beCompletion') domainBucket[parsed.domain].be = pct;
      if (parsed.field === 'integrationCompletion') {
        domainBucket[parsed.domain].integration = pct;
      }
      continue;
    }
    const field = parsed.field;
    if (field && mapped[field] === undefined) {
      mapped[field] = value;
    } else if (header !== nameHeader) {
      extraFields[header] = value;
    }
  }

  const name = String(mapped.podName ?? (nameHeader ? row[nameHeader] : '') ?? '')
    .trim();
  if (!name) return null;

  const issues: string[] = [];
  const startDate = mapped.startDate
    ? parseFlexibleDate(mapped.startDate)
    : null;
  if (mapped.startDate && !startDate) {
    issues.push(`Invalid start date: ${String(mapped.startDate)}`);
  }

  const dto: SheetPodDto = {
    name,
    description: mapped.description != null ? String(mapped.description) : null,
    status: mapped.status != null ? String(mapped.status) : null,
    startDate,
    developers: mapped.developers != null ? String(mapped.developers) : null,
    machineOwner: mapped.machineOwner != null ? String(mapped.machineOwner) : null,
    machineAlignedToProject:
      mapped.machineAlignedToProject != null
        ? String(mapped.machineAlignedToProject)
        : null,
    branch: resolvePodBranch(row, mapped.branch),
    feCompletion: toPercent(mapped.feCompletion),
    beCompletion: toPercent(mapped.beCompletion),
    integrationCompletion: toPercent(mapped.integrationCompletion),
    domainCompletions: finalizeDomainCompletions(domainBucket),
    extraFields: Object.keys(extraFields).length ? extraFields : null,
  };

  return {
    rowIndex,
    name,
    dto,
    extraFields,
    issues,
  };
}

export function stampBranchOnSheet(
  sheet: ParsedSheet,
  fallback?: string | null,
): ParsedSheet {
  const existingHeader =
    sheet.headers.find((header) => mapPodHeader(header) === 'branch') ?? null;
  const headers = existingHeader ? sheet.headers : [...sheet.headers, 'Branch'];
  const header = existingHeader ?? 'Branch';
  const rows = sheet.rows.map((row) => {
    const explicit = existingHeader ? row[existingHeader] : row.Branch;
    const branch = resolvePodBranch(row, explicit, fallback);
    return { ...row, [header]: branch };
  });
  return { ...sheet, headers, rows };
}

export function extractPodsFromSheet(
  sheet: ParsedSheet,
  selectedIndexes?: number[],
  fallbackBranch?: string | null,
): SheetPodCandidate[] {
  const headers = uniquifyHeaders(sheet.headers);
  const rows = sheet.rows;
  const indexes =
    selectedIndexes && selectedIndexes.length > 0
      ? selectedIndexes
      : rows.map((_, i) => i);

  const seen = new Set<string>();
  const candidates: SheetPodCandidate[] = [];
  const stamped = stampBranchOnSheet(
    { ...sheet, headers, rows },
    fallbackBranch,
  );

  for (const index of indexes) {
    const row = stamped.rows[index];
    if (!row) continue;
    const candidate = sheetRowToPod(row, stamped.headers, index);
    if (!candidate) continue;
    const key = normalizeKey(candidate.name);
    if (seen.has(key)) {
      candidate.issues.push(`Duplicate POD in selection: "${candidate.name}"`);
    }
    seen.add(key);
    candidates.push(candidate);
  }

  return candidates;
}

function toPercent(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  return normalizePercentage(value);
}

export type SheetDailyRecord = {
  podName: string;
  date: string;
  feCompletion: number | null;
  beCompletion: number | null;
  integrationCompletion: number | null;
};

export function extractDailyFromSheet(sheet: ParsedSheet): SheetDailyRecord[] {
  const nameHeader = detectPodNameHeader(sheet.headers);
  if (!nameHeader) return [];

  const blocks = new Map<
    string,
    { fe?: string; be?: string; integration?: string }
  >();

  for (const header of sheet.headers) {
    const match = header.match(/^(.*?)\s+[—-]\s+(\d{4}-\d{2}-\d{2})$/);
    if (!match) continue;
    const field = mapPodHeader(match[1]);
    const date = match[2];
    const block = blocks.get(date) ?? {};
    if (field === 'feCompletion') block.fe = header;
    if (field === 'beCompletion') block.be = header;
    if (field === 'integrationCompletion') block.integration = header;
    blocks.set(date, block);
  }

  if (blocks.size === 0) return [];

  const records: SheetDailyRecord[] = [];
  for (const row of sheet.rows) {
    const podName = String(serializeCell(row[nameHeader]) ?? '').trim();
    if (!podName) continue;
    for (const [date, block] of blocks) {
      const fe = toPercent(block.fe ? row[block.fe] : null);
      const be = toPercent(block.be ? row[block.be] : null);
      const integration = toPercent(block.integration ? row[block.integration] : null);
      if (fe === null && be === null && integration === null) continue;
      records.push({
        podName,
        date,
        feCompletion: fe,
        beCompletion: be,
        integrationCompletion: integration,
      });
    }
  }
  return records;
}
