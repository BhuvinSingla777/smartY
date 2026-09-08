import { handleApi, parseSingleFile } from '@/lib/http';
import { podTasksService } from '@/lib/services/pod-tasks.service';

export const runtime = 'nodejs';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return handleApi(() => podTasksService.list(id));
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return handleApi(async () => {
    const file = await parseSingleFile(request);
    return podTasksService.importFromFile(id, file);
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return handleApi(() => podTasksService.clear(id));
}
