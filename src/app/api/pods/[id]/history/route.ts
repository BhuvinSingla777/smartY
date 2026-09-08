import { NextRequest } from 'next/server';
import { handleApi } from '@/lib/http';
import { podsService } from '@/lib/services/pods.service';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { searchParams } = request.nextUrl;
  return handleApi(() =>
    podsService.history(id, {
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      range: (searchParams.get('range') as 'all' | 'daily' | 'weekly' | 'custom') || undefined,
    }),
  );
}
