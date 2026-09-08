import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function databaseUrl() {
  return process.env.DATABASE_URL?.trim() ?? '';
}

function createPrismaClient() {
  const url = databaseUrl();
  if (!url) {
    throw new Error(
      'DATABASE_URL is missing or empty. Add the Supabase transaction pooler URL in Vercel → Settings → Environment Variables (Production and Preview), then redeploy.',
    );
  }
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
