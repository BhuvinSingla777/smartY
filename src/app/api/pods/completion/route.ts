import { NextRequest } from 'next/server';
import { handleApi, numParam } from '@/lib/http';
import { parsePodsQuery } from '@/lib/query';
import { podsService } from '@/lib/services/pods.service';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const limit = numParam(request.nextUrl.searchParams.get('limit'), 20) ?? 20;
  return handleApi(() => podsService.completion(limit, parsePodsQuery(request)));
}
