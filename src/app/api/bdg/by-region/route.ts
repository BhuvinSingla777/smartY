import { NextRequest } from 'next/server';
import { handleApi } from '@/lib/http';
import { bdgService } from '@/lib/services/bdg.service';
import { parseBdgQuery } from '@/lib/query';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  return handleApi(() => bdgService.byRegion(parseBdgQuery(request)));
}
