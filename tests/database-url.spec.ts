import { resolveDatabaseUrls } from '../src/lib/prisma';

describe('resolveDatabaseUrls', () => {
  it('adds schema, ssl, and pgbouncer to a bare Supabase transaction pooler URL', () => {
    const raw =
      'postgresql://postgres.abc:secret@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres';
    const { databaseUrl, directUrl } = resolveDatabaseUrls(raw);
    expect(databaseUrl).toContain('schema=bdg_pods');
    expect(databaseUrl).toContain('sslmode=require');
    expect(databaseUrl).toContain('pgbouncer=true');
    expect(databaseUrl).toContain(':6543/');
    expect(directUrl).toContain(':5432/');
    expect(directUrl).toContain('schema=bdg_pods');
    expect(directUrl).not.toContain('pgbouncer=true');
  });
});
