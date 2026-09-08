import { NextRequest } from 'next/server';
import { ReportModule } from '@prisma/client';
import { handleApi } from '@/lib/http';
import { queriesService } from '@/lib/services/queries.service';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const moduleParam = request.nextUrl.searchParams.get('module');
  const reportModule =
    moduleParam === 'BDG' || moduleParam === 'PODS' ? (moduleParam as ReportModule) : undefined;
  return handleApi(() => queriesService.findAll(reportModule));
}

export async function POST(request: NextRequest) {
  return handleApi(async () => {
    const body = await request.json();
    return queriesService.create(body);
  });
}
