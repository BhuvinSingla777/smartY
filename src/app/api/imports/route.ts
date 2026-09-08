import { NextRequest } from 'next/server';
import { handleApi, numParam } from '@/lib/http';
import { importsService } from '@/lib/services/imports.service';
import type { ReportModule } from '@prisma/client';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const page = numParam(request.nextUrl.searchParams.get('page'), 1) ?? 1;
  const pageSize = numParam(request.nextUrl.searchParams.get('pageSize'), 20) ?? 20;
  const reportModule = request.nextUrl.searchParams.get('module') as ReportModule | null;
  return handleApi(() =>
    importsService.findAll(page, pageSize, reportModule || undefined),
  );
}
