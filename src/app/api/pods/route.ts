import { NextRequest } from 'next/server';
import { handleApi } from '@/lib/http';
import { parsePodsQuery } from '@/lib/query';
import { podsService } from '@/lib/services/pods.service';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  return handleApi(() => podsService.findAll(parsePodsQuery(request)));
}

export async function POST(request: NextRequest) {
  return handleApi(async () => {
    const body = await request.json();
    return podsService.create(body);
  });
}
