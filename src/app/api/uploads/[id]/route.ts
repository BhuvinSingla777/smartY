import { NextRequest } from 'next/server';
import { handleApi } from '@/lib/http';
import { uploadsService } from '@/lib/services/uploads.service';

export const runtime = 'nodejs';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return handleApi(() => uploadsService.findOne(id));
}
