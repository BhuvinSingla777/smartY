import { NextRequest } from 'next/server';
import { handleApi, numParam, parseMultipartFile } from '@/lib/http';
import { uploadsService } from '@/lib/services/uploads.service';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const page = numParam(request.nextUrl.searchParams.get('page'), 1) ?? 1;
  const pageSize = numParam(request.nextUrl.searchParams.get('pageSize'), 20) ?? 20;
  return handleApi(() => uploadsService.findAll(page, pageSize));
}

export async function POST(request: NextRequest) {
  return handleApi(async () => {
    const { file, reportModule } = await parseMultipartFile(request);
    return uploadsService.create(file, reportModule);
  });
}
