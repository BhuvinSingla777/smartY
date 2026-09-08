import { handleApi } from '@/lib/http';
import { dashboardService } from '@/lib/services/dashboard.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return handleApi(() => dashboardService.summary());
}
