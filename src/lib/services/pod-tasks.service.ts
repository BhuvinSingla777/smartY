import { prisma } from '@/lib/prisma';
import { ApiError } from '@/lib/errors';
import type { UploadedFile } from '@/lib/http';
import {
  isMarkdownFilename,
  parseMarkdownTasks,
  podStatusFromTasks,
  taskOverallCompletion,
  POD_TASK_STATUSES,
  type PodTaskStatus,
} from '@/lib/transforms/md-tasks';

const TASK_ORDER = [{ sortOrder: 'asc' as const }, { number: 'asc' as const }];

export interface TaskMoveDto {
  status: PodTaskStatus;
  sortOrder?: number;
}

export class PodTasksService {
  async list(podId: string) {
    await this.requirePod(podId);
    const tasks = await prisma.podTask.findMany({
      where: { podId },
      orderBy: TASK_ORDER,
    });
    return this.withSummary(podId, tasks);
  }

  async importFromFile(podId: string, file: UploadedFile) {
    if (!isMarkdownFilename(file.originalname)) {
      throw new ApiError(400, 'Upload a Markdown file (.md) with numbered tasks');
    }
    const markdown = file.buffer.toString('utf8');
    return this.importFromMarkdown(podId, markdown, file.originalname);
  }

  async importFromMarkdown(podId: string, markdown: string, sourceFile?: string) {
    await this.requirePod(podId);
    const parsed = parseMarkdownTasks(markdown);
    if (parsed.length === 0) {
      throw new ApiError(
        400,
        'No numbered tasks found. Use a list like:\n1. First task\n2. Second task',
      );
    }

    const existing = await prisma.podTask.findMany({ where: { podId } });
    const byNumber = new Map(existing.map((t) => [t.number, t]));
    const keepNumbers = new Set(parsed.map((t) => t.number));

    const saved = await prisma.$transaction(async (tx) => {
      await tx.podTask.deleteMany({
        where: { podId, number: { notIn: [...keepNumbers] } },
      });

      const rows = [];
      for (const item of parsed) {
        const prev = byNumber.get(item.number);
        const status = item.status !== 'TODO' ? item.status : (prev?.status ?? 'TODO');
        const sortOrder = prev?.status === status ? prev.sortOrder : item.number;
        const row = await tx.podTask.upsert({
          where: { podId_number: { podId, number: item.number } },
          update: {
            title: item.title,
            description: item.description,
            section: item.section,
            status,
            sortOrder,
            sourceFile: sourceFile ?? null,
          },
          create: {
            podId,
            number: item.number,
            title: item.title,
            description: item.description,
            section: item.section,
            status,
            sortOrder: item.number,
            sourceFile: sourceFile ?? null,
          },
        });
        rows.push(row);
      }
      return rows.sort((a, b) => a.sortOrder - b.sortOrder || a.number - b.number);
    }, { maxWait: 15_000, timeout: 60_000 });

    await this.syncPodStatus(podId, saved);
    return this.withSummary(podId, saved);
  }

  async move(podId: string, taskId: string, dto: TaskMoveDto) {
    await this.requirePod(podId);
    if (!POD_TASK_STATUSES.includes(dto.status)) {
      throw new ApiError(400, 'Status must be TODO, IN_PROGRESS, or DONE');
    }

    const task = await prisma.podTask.findFirst({ where: { id: taskId, podId } });
    if (!task) throw new ApiError(404, 'Task not found');

    const column = await prisma.podTask.findMany({
      where: { podId, status: dto.status, id: { not: taskId } },
      orderBy: TASK_ORDER,
    });
    const sortOrder =
      dto.sortOrder !== undefined
        ? dto.sortOrder
        : column.length
          ? Math.max(...column.map((t) => t.sortOrder)) + 1
          : 0;

    await prisma.podTask.update({
      where: { id: taskId },
      data: { status: dto.status, sortOrder },
    });

    const tasks = await prisma.podTask.findMany({
      where: { podId },
      orderBy: TASK_ORDER,
    });
    await this.syncPodStatus(podId, tasks);
    return this.withSummary(podId, tasks);
  }

  async clear(podId: string) {
    await this.requirePod(podId);
    await prisma.podTask.deleteMany({ where: { podId } });
    return this.withSummary(podId, []);
  }

  private async requirePod(podId: string) {
    const pod = await prisma.pod.findUnique({ where: { id: podId } });
    if (!pod) throw new ApiError(404, 'POD not found');
    return pod;
  }

  private async syncPodStatus(podId: string, tasks: Array<{ status: string }>) {
    const status = podStatusFromTasks(tasks);
    if (!status) return;
    await prisma.pod.update({
      where: { id: podId },
      data: { status },
    });
  }

  private async withSummary(podId: string, tasks: Array<{ status: string }>) {
    const pod = await prisma.pod.findUnique({ where: { id: podId } });
    return {
      tasks,
      taskCount: tasks.length,
      overallCompletion: taskOverallCompletion(tasks),
      status: pod?.status ?? null,
    };
  }
}

export const podTasksService = new PodTasksService();
