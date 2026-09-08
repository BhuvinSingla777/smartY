import { NextRequest } from 'next/server';
import { handleApi } from '@/lib/http';
import { parsePodsQuery } from '@/lib/query';
import { podsService } from '@/lib/services/pods.service';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  return handleApi(() => podsService.statusDistribution(parsePodsQuery(request)));
}
