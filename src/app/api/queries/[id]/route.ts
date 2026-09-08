import { NextRequest } from 'next/server';
import { handleApi } from '@/lib/http';
import { queriesService } from '@/lib/services/queries.service';

export const runtime = 'nodejs';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return handleApi(async () => {
    const body = await request.json();
    return queriesService.update(id, body);
  });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return handleApi(() => queriesService.remove(id));
}
