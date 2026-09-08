import { NextRequest } from 'next/server';
import { handleApi } from '@/lib/http';
import { importsService } from '@/lib/services/imports.service';

export const runtime = 'nodejs';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return handleApi(() => importsService.findOne(id));
}
