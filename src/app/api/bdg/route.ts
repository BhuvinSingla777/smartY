import { NextRequest } from 'next/server';
import { handleApi } from '@/lib/http';
import { parseBdgQuery } from '@/lib/query';
import { bdgService } from '@/lib/services/bdg.service';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  return handleApi(() => bdgService.findAll(parseBdgQuery(request)));
}

export async function POST(request: NextRequest) {
  return handleApi(async () => {
    const body = await request.json();
    return bdgService.create(body);
  });
}
