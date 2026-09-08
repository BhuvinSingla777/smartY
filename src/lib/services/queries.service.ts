import { Prisma, ReportModule } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ApiError } from '@/lib/errors';

export type SavedQueryInput = {
  name?: string;
  module?: ReportModule;
  search?: string;
  status?: string;
  payload?: Record<string, unknown> | null;
};

export class QueriesService {
  async findAll(module?: ReportModule) {
    return prisma.savedQuery.findMany({
      where: module ? { module } : undefined,
      orderBy: { updatedAt: 'desc' },
    });
  }

  async create(input: SavedQueryInput) {
    const name = String(input.name ?? '').trim();
    if (!name) throw new ApiError(400, 'Query name is required');

    return prisma.savedQuery.create({
      data: {
        name,
        module: input.module === 'BDG' ? ReportModule.BDG : ReportModule.PODS,
        search: String(input.search ?? '').trim(),
        status: String(input.status ?? '').trim(),
        payload:
          input.payload === undefined
            ? ({
                search: String(input.search ?? '').trim(),
                status: String(input.status ?? '').trim(),
              } as Prisma.InputJsonValue)
            : input.payload === null
              ? Prisma.JsonNull
              : (input.payload as Prisma.InputJsonValue),
      },
    });
  }

  async update(id: string, input: SavedQueryInput) {
    const existing = await prisma.savedQuery.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, 'Saved query not found');

    return prisma.savedQuery.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: String(input.name).trim() } : {}),
        ...(input.search !== undefined ? { search: String(input.search).trim() } : {}),
        ...(input.status !== undefined ? { status: String(input.status).trim() } : {}),
        ...(input.payload !== undefined
          ? {
              payload:
                input.payload === null
                  ? Prisma.JsonNull
                  : (input.payload as Prisma.InputJsonValue),
            }
          : {}),
      },
    });
  }

  async remove(id: string) {
    const existing = await prisma.savedQuery.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, 'Saved query not found');
    await prisma.savedQuery.delete({ where: { id } });
    return { id, deleted: true };
  }
}

export const queriesService = new QueriesService();
