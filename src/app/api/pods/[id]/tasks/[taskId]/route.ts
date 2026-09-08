import { NextRequest } from 'next/server';
import { handleApi } from '@/lib/http';
import { podTasksService } from '@/lib/services/pod-tasks.service';
import { POD_TASK_STATUSES, type PodTaskStatus } from '@/lib/transforms/md-tasks';
import { ApiError } from '@/lib/errors';

export const runtime = 'nodejs';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> },
) {
  const { id, taskId } = await params;
  return handleApi(async () => {
    const body = await request.json();
    const status = String(body.status ?? '').toUpperCase() as PodTaskStatus;
    if (!POD_TASK_STATUSES.includes(status)) {
      throw new ApiError(400, 'Status must be TODO, IN_PROGRESS, or DONE');
    }
    return podTasksService.move(id, taskId, {
      status,
      sortOrder: typeof body.sortOrder === 'number' ? body.sortOrder : undefined,
    });
  });
}
