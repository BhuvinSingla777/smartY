import { NextRequest } from 'next/server';
import { handleApi } from '@/lib/http';
import { bdgService } from '@/lib/services/bdg.service';

export const runtime = 'nodejs';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return handleApi(() => bdgService.findOne(id));
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return handleApi(async () => {
    const body = await request.json();
    return bdgService.update(id, body);
  });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return handleApi(() => bdgService.remove(id));
}
