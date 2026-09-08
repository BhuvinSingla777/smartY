import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function withQuery(raw: string, extra: Record<string, string>) {
  const [base, existing] = raw.split('?');
  const params = new URLSearchParams(existing ?? '');
  for (const [key, value] of Object.entries(extra)) {
    if (!params.has(key)) params.set(key, value);
  }
  const query = params.toString();
  return query ? `${base}?${query}` : base;
}

function withoutParams(raw: string, keys: string[]) {
  const [base, existing] = raw.split('?');
  const params = new URLSearchParams(existing ?? '');
  for (const key of keys) params.delete(key);
  const query = params.toString();
  return query ? `${base}?${query}` : base;
}

function toSessionPooler(raw: string) {
  return withoutParams(
    raw.replace(/pooler\.supabase\.com:6543/i, 'pooler.supabase.com:5432'),
    ['pgbouncer', 'connection_limit'],
  );
}

/** Accept a bare Supabase pooler URL and fill Prisma / pgbouncer / schema params. */
export function resolveDatabaseUrls(databaseUrl: string, directUrl?: string) {
  const trimmed = databaseUrl.trim();
  const db = withQuery(trimmed, {
    schema: 'bdg_pods',
    sslmode: 'require',
    ...(trimmed.includes(':6543')
      ? { pgbouncer: 'true', connection_limit: '1' }
      : {}),
  });
  const direct = withQuery(directUrl?.trim() || toSessionPooler(db), {
    schema: 'bdg_pods',
    sslmode: 'require',
  });
  return { databaseUrl: db, directUrl: direct };
}

function readEnv(name: string) {
  return (process.env[name] ?? '').trim();
}

function rawDatabaseUrl() {
  return (
    readEnv('DATABASE_URL') ||
    readEnv('POSTGRES_PRISMA_URL') ||
    readEnv('POSTGRES_URL') ||
    readEnv('DATABASE_URI')
  );
}

function rawDirectUrl() {
  return readEnv('DIRECT_URL') || readEnv('POSTGRES_URL_NON_POOLING');
}

function ensureDatabaseEnv() {
  const raw = rawDatabaseUrl();
  if (!raw) {
    throw new Error(
      'DATABASE_URL is missing or empty. Add the Supabase pooler URL in Vercel → Settings → Environment Variables (Production and Preview), then redeploy.',
    );
  }
  const resolved = resolveDatabaseUrls(raw, rawDirectUrl());
  process.env.DATABASE_URL = resolved.databaseUrl;
  process.env.DIRECT_URL = resolved.directUrl;
  return resolved.databaseUrl;
}

function createPrismaClient() {
  const url = ensureDatabaseEnv();
  return new PrismaClient({
    datasources: { db: { url } },
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
}

function getPrisma() {
  return (globalForPrisma.prisma ??= createPrismaClient());
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrisma();
    const value = Reflect.get(client, prop, client);
    return typeof value === 'function' ? value.bind(client) : value;
  },
});
