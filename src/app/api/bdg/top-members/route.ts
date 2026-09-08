import { NextRequest } from 'next/server';
import { handleApi, numParam } from '@/lib/http';
import { bdgService } from '@/lib/services/bdg.service';
import { parseBdgQuery } from '@/lib/query';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const limit = numParam(request.nextUrl.searchParams.get('limit'), 10) ?? 10;
  return handleApi(() => bdgService.topMembers(limit, parseBdgQuery(request)));
}
