import { handleApi } from '@/lib/http';
import { bdgService } from '@/lib/services/bdg.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return handleApi(() => bdgService.summary());
}
