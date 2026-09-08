import { NextRequest } from 'next/server';
import { handleApi } from '@/lib/http';
import { parsePodsQuery } from '@/lib/query';
import { podsService } from '@/lib/services/pods.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return handleApi(() => podsService.byBranch(parsePodsQuery(request)));
}
