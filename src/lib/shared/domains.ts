import { overallCompletion, normalizeHeader } from './normalize';
import { mapPodHeader, type PodField } from './column-map';

export const POD_DOMAIN_IDS = ['fastApi', 'node', 'dotnet'] as const;

export type PodDomainId = (typeof POD_DOMAIN_IDS)[number];

export type DomainCompletion = {
  fe: number | null;
  be: number | null;
  integration: number | null;
  overall: number | null;
};

export type PodDomainCompletions = Record<PodDomainId, DomainCompletion>;

export const POD_DOMAINS: Array<{
  id: PodDomainId;
  label: string;
  aliases: string[];
}> = [
  {
    id: 'fastApi',
    label: 'Fast API',
    aliases: ['fast api', 'fastapi', 'fast-api'],
  },
  {
    id: 'node',
    label: 'Node',
    aliases: ['node', 'nodejs', 'node.js', 'node js'],
  },
  {
    id: 'dotnet',
    label: '.NET Core',
    aliases: ['.net core', 'dotnet', 'dot net', 'net core', '.net', 'dotnet core'],
  },
];

const DOMAIN_LOOKUP = new Map<string, PodDomainId>();
for (const domain of POD_DOMAINS) {
  DOMAIN_LOOKUP.set(normalizeHeader(domain.label), domain.id);
  for (const alias of domain.aliases) {
    DOMAIN_LOOKUP.set(normalizeHeader(alias), domain.id);
  }
}

export function emptyDomainCompletion(): DomainCompletion {
  return { fe: null, be: null, integration: null, overall: null };
}

export function emptyDomainCompletions(): PodDomainCompletions {
  return {
    fastApi: emptyDomainCompletion(),
    node: emptyDomainCompletion(),
    dotnet: emptyDomainCompletion(),
  };
}

export function parsePodDomain(value: unknown): PodDomainId | null {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  if (!text) return null;
  return DOMAIN_LOOKUP.get(normalizeHeader(text)) ?? null;
}

export function extractDomainFromTitle(value: unknown): PodDomainId | null {
  if (value === null || value === undefined) return null;
  const text = String(value).replace(/\s+/g, ' ').trim();
  if (!text) return null;
  const paren = text.match(/completion\s*percentage\s*\((.+)\)/i);
  if (paren) return parsePodDomain(paren[1]);
  return parsePodDomain(text);
}

export function domainLabel(id: PodDomainId): string {
  return POD_DOMAINS.find((d) => d.id === id)?.label ?? id;
}

/** Split headers like "FE — Fast API" or "BE - Node" into metric + domain. */
export function parseDomainMetricHeader(header: string): {
  field: PodField | null;
  domain: PodDomainId | null;
  plainHeader: string;
} {
  const raw = String(header ?? '').trim();
  const parts = raw.split(/\s*[—–-]\s+/);
  if (parts.length >= 2) {
    const metric = parts[0]?.trim() ?? '';
    const domainPart = parts.slice(1).join(' - ').trim();
    const domain = parsePodDomain(domainPart);
    const field = mapPodHeader(metric);
    if (domain && field) {
      return { field, domain, plainHeader: metric };
    }
  }
  return {
    field: mapPodHeader(raw),
    domain: null,
    plainHeader: raw,
  };
}

export function withDomainOverall(metrics: DomainCompletion): DomainCompletion {
  return {
    ...metrics,
    overall: overallCompletion(metrics.fe, metrics.be, metrics.integration),
  };
}

export function finalizeDomainCompletions(
  input: Partial<Record<PodDomainId, Partial<DomainCompletion>>> | null | undefined,
): PodDomainCompletions | null {
  if (!input) return null;
  const result = emptyDomainCompletions();
  let hasAny = false;
  for (const id of POD_DOMAIN_IDS) {
    const row = input[id];
    if (!row) continue;
    const next = withDomainOverall({
      fe: row.fe ?? null,
      be: row.be ?? null,
      integration: row.integration ?? null,
      overall: row.overall ?? null,
    });
    result[id] = next;
    if (next.fe != null || next.be != null || next.integration != null) {
      hasAny = true;
    }
  }
  return hasAny ? result : null;
}

export function readDomainCompletions(value: unknown): PodDomainCompletions | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;
  const partial: Partial<Record<PodDomainId, Partial<DomainCompletion>>> = {};
  for (const id of POD_DOMAIN_IDS) {
    const row = raw[id];
    if (!row || typeof row !== 'object') continue;
    const metrics = row as Record<string, unknown>;
    partial[id] = {
      fe: typeof metrics.fe === 'number' ? metrics.fe : null,
      be: typeof metrics.be === 'number' ? metrics.be : null,
      integration: typeof metrics.integration === 'number' ? metrics.integration : null,
      overall: typeof metrics.overall === 'number' ? metrics.overall : null,
    };
  }
  return finalizeDomainCompletions(partial);
}

export function domainOverall(value: unknown, id: PodDomainId): number | null {
  const parsed = readDomainCompletions(value);
  return parsed?.[id]?.overall ?? null;
}
