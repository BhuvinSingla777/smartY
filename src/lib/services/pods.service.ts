import { Prisma } from '@prisma/client';
import { normalizeKey, normalizePercentage, overallCompletion, parsePodBranch } from '@/lib/shared';
import type { ParsedSheet } from '@/lib/shared';
import { prisma } from '@/lib/prisma';
import { ApiError } from '@/lib/errors';
import { extractDailyFromSheet, extractPodsFromSheet, pickDailySheet, stampBranchOnSheet } from '@/lib/transforms/sheet-extract';
import { taskStatusWeight } from '@/lib/transforms/md-tasks';

export interface PodsListQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  statuses?: string;
  ids?: string;
  developer?: string;
  branch?: string;
  startDateFrom?: string;
  startDateTo?: string;
  completionMin?: number;
  completionMax?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  limit?: number;
}

export interface PodUpsertDto {
  name: string;
  description?: string | null;
  status?: string | null;
  startDate?: string | null;
  developers?: string | null;
  machineOwner?: string | null;
  machineAlignedToProject?: string | null;
  branch?: string | null;
  feCompletion?: number | null;
  beCompletion?: number | null;
  integrationCompletion?: number | null;
  extraFields?: Record<string, unknown> | null;
}

export class PodsService {
  private baseWhere(query: PodsListQuery): Prisma.PodWhereInput {
    const where: Prisma.PodWhereInput = {};

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { developers: { contains: query.search, mode: 'insensitive' } },
        { machineOwner: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.status) {
      where.status = { equals: query.status, mode: 'insensitive' };
    }
    if (query.statuses) {
      const list = query.statuses.split(',').map((s) => s.trim()).filter(Boolean);
      if (list.length) {
        where.OR = list.map((s) => ({
          status: { equals: s, mode: 'insensitive' as const },
        }));
      }
    }
    if (query.ids) {
      const ids = query.ids.split(',').map((s) => s.trim()).filter(Boolean);
      if (ids.length) where.id = { in: ids };
    }
    if (query.developer) {
      where.developers = { contains: query.developer, mode: 'insensitive' };
    }
    if (query.branch) {
      const branch = parsePodBranch(query.branch);
      if (query.branch === 'unassigned') {
        where.branch = null;
      } else if (branch) {
        where.branch = branch;
      }
    }
    if (query.startDateFrom || query.startDateTo) {
      where.startDate = {};
      if (query.startDateFrom) {
        where.startDate.gte = new Date(query.startDateFrom);
      }
      if (query.startDateTo) {
        where.startDate.lte = new Date(query.startDateTo);
      }
    }
    return where;
  }

  async findAll(query: PodsListQuery) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where = this.baseWhere(query);

    const [raw, totalAll] = await Promise.all([
      prisma.pod.findMany({ where, orderBy: { updatedAt: 'desc' } }),
      prisma.pod.count({ where }),
    ]);

    const taskStats = await this.loadTaskStats(raw.map((p) => p.id));
    let enriched = raw.map((p) => this.enrich(p, taskStats.get(p.id)));

    if (query.completionMin !== undefined) {
      enriched = enriched.filter(
        (p) => (p.overallCompletion ?? 0) >= query.completionMin!,
      );
    }
    if (query.completionMax !== undefined) {
      enriched = enriched.filter(
        (p) => (p.overallCompletion ?? 0) <= query.completionMax!,
      );
    }

    const sortBy = query.sortBy ?? 'updatedAt';
    const sortDir = query.sortDir ?? 'desc';
    enriched.sort((a, b) => {
      const av = (a as Record<string, unknown>)[sortBy];
      const bv = (b as Record<string, unknown>)[sortBy];
      if (av === bv) return 0;
      if (av === null || av === undefined) return 1;
      if (bv === null || bv === undefined) return -1;
      const cmp = av < bv ? -1 : 1;
      return sortDir === 'asc' ? cmp : -cmp;
    });

    const total = enriched.length;
    const data = enriched.slice((page - 1) * pageSize, page * pageSize);

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
      matchedBeforeCompletionFilter: totalAll,
    };
  }

  async findOne(id: string) {
    const pod = await prisma.pod.findUnique({
      where: { id },
      include: {
        dailyUpdates: { orderBy: { date: 'asc' } },
        tasks: { orderBy: [{ sortOrder: 'asc' }, { number: 'asc' }] },
      },
    });
    if (!pod) throw new ApiError(404, 'POD not found');
    return this.enrich(pod, this.statsFromTasks(pod.tasks));
  }

  async create(dto: PodUpsertDto) {
    this.assertValidPod(dto);
    const normalized = normalizeKey(dto.name);
    const existing = await prisma.pod.findUnique({
      where: { normalizedName: normalized },
    });
    if (existing) {
      throw new ApiError(400, `POD already exists: "${dto.name}". Use update instead.`);
    }
    const created = await prisma.pod.create({
      data: this.toPrismaData(dto, normalized),
    });
    return this.enrich(created);
  }

  async upsertFromSheet(
    sheet: ParsedSheet,
    selectedIndexes?: number[],
    sheets?: ParsedSheet[],
    defaultBranch?: string | null,
  ) {
    const workbook = sheets && sheets.length > 0 ? sheets : [sheet];
    const stamped = stampBranchOnSheet(sheet, defaultBranch);
    const candidates = extractPodsFromSheet(stamped, selectedIndexes, defaultBranch);
    if (candidates.length === 0) {
      throw new ApiError(
        400,
        'No POD rows found. The Info sheet needs a POD Name column and at least one data row.',
      );
    }

    const created = [];
    const updated = [];
    const skipped: Array<{ rowIndex: number; name: string; reason: string }> = [];
    const keptNames = new Set<string>();

    for (const candidate of candidates) {
      if (!candidate.name.trim()) {
        skipped.push({
          rowIndex: candidate.rowIndex,
          name: candidate.name,
          reason: 'POD name is missing',
        });
        continue;
      }
      try {
        this.assertValidPod(candidate.dto);
      } catch (err) {
        skipped.push({
          rowIndex: candidate.rowIndex,
          name: candidate.name,
          reason: err instanceof Error ? err.message : 'Invalid row',
        });
        continue;
      }

      const normalized = normalizeKey(candidate.name);
      const existing = await prisma.pod.findUnique({
        where: { normalizedName: normalized },
      });
      const data = this.toPrismaData(candidate.dto, normalized);
      if (existing && !data.branch) {
        data.branch = parsePodBranch(existing.branch);
      }

      if (existing) {
        const next = await prisma.pod.update({
          where: { id: existing.id },
          data,
        });
        updated.push(this.enrich(next));
      } else {
        const next = await prisma.pod.create({ data });
        created.push(this.enrich(next));
      }
      keptNames.add(normalized);
    }

    const dailySheet = pickDailySheet(workbook);
    let dailyUpserts = 0;
    if (dailySheet && keptNames.size > 0) {
      const dailyRecords = extractDailyFromSheet(dailySheet).filter((record) =>
        keptNames.has(normalizeKey(record.podName)),
      );
      for (const record of dailyRecords) {
        const pod = await prisma.pod.findUnique({
          where: { normalizedName: normalizeKey(record.podName) },
        });
        if (!pod) continue;
        const date = new Date(record.date);
        await prisma.podDailyUpdate.upsert({
          where: { podId_date: { podId: pod.id, date } },
          update: {
            feCompletion: record.feCompletion,
            beCompletion: record.beCompletion,
            integrationCompletion: record.integrationCompletion,
          },
          create: {
            podId: pod.id,
            date,
            feCompletion: record.feCompletion,
            beCompletion: record.beCompletion,
            integrationCompletion: record.integrationCompletion,
          },
        });
        dailyUpserts += 1;
      }
    }

    return {
      created,
      updated,
      skipped,
      createdCount: created.length,
      updatedCount: updated.length,
      skippedCount: skipped.length,
      dailyUpserts,
      summary: `${created.length} POD${created.length === 1 ? '' : 's'} created, ${updated.length} updated${
        dailyUpserts ? `, ${dailyUpserts} daily updates saved` : ''
      }`,
    };
  }

  async update(id: string, dto: PodUpsertDto) {
    const existing = await prisma.pod.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, 'POD not found');
    this.assertValidPod(dto);
    const normalized = normalizeKey(dto.name);
    if (normalized !== existing.normalizedName) {
      const clash = await prisma.pod.findUnique({
        where: { normalizedName: normalized },
      });
      if (clash && clash.id !== id) {
        throw new ApiError(400, `Another POD already uses the name "${dto.name}"`);
      }
    }
    const updated = await prisma.pod.update({
      where: { id },
      data: {
        ...this.toPrismaData(dto, normalized),
        normalizedName: normalized,
      },
    });
    return this.enrich(updated);
  }

  async remove(id: string) {
    const existing = await prisma.pod.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, 'POD not found');
    await prisma.pod.delete({ where: { id } });
    return { id, deleted: true };
  }

  async summary(query: PodsListQuery = {}) {
    const pods = await prisma.pod.findMany({
      where: this.baseWhere(query),
    });
    const enriched = await this.enrichMany(pods);
    const totalPods = enriched.length;

    const normalizeStatus = (s: string | null | undefined) =>
      (s ?? 'unknown').trim().toLowerCase();

    const inProgress = enriched.filter((p) =>
      /progress|wip|ongoing/i.test(normalizeStatus(p.status)),
    ).length;
    const completed = enriched.filter((p) =>
      /complete|done|closed/i.test(normalizeStatus(p.status)),
    ).length;
    const notStarted = enriched.filter((p) =>
      /not\s*start|pending|new|todo/i.test(normalizeStatus(p.status)),
    ).length;

    const avg = (pick: (p: (typeof enriched)[0]) => number | null) => {
      const vals = enriched
        .map(pick)
        .filter((v): v is number => typeof v === 'number');
      if (!vals.length) return 0;
      return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100;
    };

    return {
      totalPods,
      inProgress,
      completed,
      notStarted,
      avgFeCompletion: avg((p) => p.feCompletion),
      avgBeCompletion: avg((p) => p.beCompletion),
      avgIntegrationCompletion: avg((p) => p.integrationCompletion),
      overallAverageCompletion: avg((p) => p.overallCompletion),
      byBranch: this.groupByBranch(enriched),
    };
  }

  async byBranch(query: PodsListQuery = {}) {
    const pods = await prisma.pod.findMany({
      where: this.baseWhere({ ...query, branch: undefined }),
    });
    return this.groupByBranch(await this.enrichMany(pods));
  }

  async statusDistribution(query: PodsListQuery = {}) {
    const pods = await prisma.pod.findMany({
      where: this.baseWhere(query),
      select: { status: true },
    });
    const map = new Map<string, number>();
    for (const p of pods) {
      const key = (p.status ?? 'Unknown').trim() || 'Unknown';
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return [...map.entries()].map(([status, count]) => ({ status, count }));
  }

  async completion(limit = 20, query: PodsListQuery = {}) {
    const pods = await prisma.pod.findMany({
      where: this.baseWhere(query),
    });
    return (await this.enrichMany(pods))
      .sort((a, b) => (b.overallCompletion ?? 0) - (a.overallCompletion ?? 0))
      .slice(0, limit)
      .map((p) => ({
        id: p.id,
        name: p.name,
        feCompletion: p.feCompletion,
        beCompletion: p.beCompletion,
        integrationCompletion: p.integrationCompletion,
        overallCompletion: p.overallCompletion,
        status: p.status,
      }));
  }

  async history(
    id: string,
    opts?: {
      dateFrom?: string;
      dateTo?: string;
      range?: 'all' | 'daily' | 'weekly' | 'custom';
    },
  ) {
    const pod = await prisma.pod.findUnique({
      where: { id },
      include: {
        dailyUpdates: { orderBy: { date: 'asc' } },
        tasks: { orderBy: [{ sortOrder: 'asc' }, { number: 'asc' }] },
      },
    });
    if (!pod) throw new ApiError(404, 'POD not found');

    let history = pod.dailyUpdates;
    const range = opts?.range ?? 'all';
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (range === 'daily') {
      history = history.filter(
        (h) => h.date.toISOString().slice(0, 10) === today.toISOString().slice(0, 10),
      );
    } else if (range === 'weekly') {
      const from = new Date(today);
      from.setDate(from.getDate() - 6);
      history = history.filter((h) => h.date >= from && h.date <= today);
    } else if (range === 'custom' || opts?.dateFrom || opts?.dateTo) {
      if (opts?.dateFrom) {
        const from = new Date(opts.dateFrom);
        history = history.filter((h) => h.date >= from);
      }
      if (opts?.dateTo) {
        const to = new Date(opts.dateTo);
        history = history.filter((h) => h.date <= to);
      }
    }

    return {
      pod: this.enrich(pod, this.statsFromTasks(pod.tasks)),
      history,
    };
  }

  async exportAll(query: PodsListQuery) {
    const result = await this.findAll({ ...query, page: 1, pageSize: 10000 });
    return result.data;
  }

  private assertValidPod(dto: PodUpsertDto) {
    if (!dto.name?.trim()) {
      throw new ApiError(400, 'POD Name is required');
    }
    for (const [label, value] of [
      ['FE', dto.feCompletion],
      ['BE', dto.beCompletion],
      ['Integration', dto.integrationCompletion],
    ] as const) {
      if (value === null || value === undefined) continue;
      const n = normalizePercentage(value);
      if (n === null || n < 0 || n > 100) {
        throw new ApiError(400, `Invalid completion percentage for ${label}`);
      }
    }
  }

  private toPrismaData(dto: PodUpsertDto, normalized: string) {
    return {
      name: dto.name.trim(),
      normalizedName: normalized,
      description: dto.description ?? null,
      status: dto.status ?? null,
      startDate: dto.startDate ? new Date(dto.startDate) : null,
      developers: dto.developers ?? null,
      machineOwner: dto.machineOwner ?? null,
      machineAlignedToProject: dto.machineAlignedToProject ?? null,
      branch: parsePodBranch(dto.branch) ?? null,
      feCompletion:
        dto.feCompletion === null || dto.feCompletion === undefined
          ? null
          : normalizePercentage(dto.feCompletion),
      beCompletion:
        dto.beCompletion === null || dto.beCompletion === undefined
          ? null
          : normalizePercentage(dto.beCompletion),
      integrationCompletion:
        dto.integrationCompletion === null || dto.integrationCompletion === undefined
          ? null
          : normalizePercentage(dto.integrationCompletion),
      extraFields:
        dto.extraFields === undefined
          ? undefined
          : dto.extraFields && Object.keys(dto.extraFields).length > 0
            ? (dto.extraFields as Prisma.InputJsonValue)
            : Prisma.JsonNull,
    };
  }

  private async enrichMany<
    T extends {
      id: string;
      feCompletion: number | null;
      beCompletion: number | null;
      integrationCompletion: number | null;
    },
  >(pods: T[]) {
    const stats = await this.loadTaskStats(pods.map((p) => p.id));
    return pods.map((p) => this.enrich(p, stats.get(p.id)));
  }

  private statsFromTasks(tasks: Array<{ status: string }>) {
    return tasks.reduce(
      (acc, t) => {
        acc.total += 1;
        acc.weighted += taskStatusWeight(t.status);
        return acc;
      },
      { total: 0, weighted: 0 },
    );
  }

  private async loadTaskStats(podIds: string[]) {
    const map = new Map<string, { total: number; weighted: number }>();
    if (!podIds.length) return map;
    const grouped = await prisma.podTask.groupBy({
      by: ['podId', 'status'],
      where: { podId: { in: podIds } },
      _count: { _all: true },
    });
    for (const row of grouped) {
      const cur = map.get(row.podId) ?? { total: 0, weighted: 0 };
      cur.total += row._count._all;
      cur.weighted += taskStatusWeight(row.status) * row._count._all;
      map.set(row.podId, cur);
    }
    return map;
  }

  private enrich<
    T extends {
      feCompletion: number | null;
      beCompletion: number | null;
      integrationCompletion: number | null;
    },
  >(pod: T, taskStats?: { total: number; weighted: number }) {
    const sheetOverall = overallCompletion(
      pod.feCompletion,
      pod.beCompletion,
      pod.integrationCompletion,
    );
    const taskOverall =
      taskStats && taskStats.total > 0
        ? Math.round((taskStats.weighted / taskStats.total) * 10000) / 100
        : null;
    return {
      ...pod,
      taskCount: taskStats?.total ?? 0,
      taskCompletion: taskOverall,
      overallCompletion: taskOverall ?? sheetOverall,
    };
  }

  private groupByBranch<
    T extends {
      branch?: string | null;
      status: string | null;
      feCompletion: number | null;
      beCompletion: number | null;
      integrationCompletion: number | null;
      overallCompletion: number | null;
    },
  >(pods: T[]) {
    const buckets = new Map<string, T[]>();
    for (const pod of pods) {
      const key = parsePodBranch(pod.branch) ?? 'unassigned';
      const list = buckets.get(key) ?? [];
      list.push(pod);
      buckets.set(key, list);
    }

    const avg = (items: T[], pick: (p: T) => number | null) => {
      const vals = items.map(pick).filter((v): v is number => typeof v === 'number');
      if (!vals.length) return 0;
      return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100;
    };

    const order = ['sdm', 'sdd', 'sdn', 'unassigned'];
    return order
      .filter((key) => buckets.has(key) || key !== 'unassigned')
      .map((branch) => {
        const items = buckets.get(branch) ?? [];
        return {
          branch,
          totalPods: items.length,
          inProgress: items.filter((p) =>
            /progress|wip|ongoing/i.test((p.status ?? '').trim()),
          ).length,
          completed: items.filter((p) =>
            /complete|done|closed/i.test((p.status ?? '').trim()),
          ).length,
          avgFeCompletion: avg(items, (p) => p.feCompletion),
          avgBeCompletion: avg(items, (p) => p.beCompletion),
          avgIntegrationCompletion: avg(items, (p) => p.integrationCompletion),
          overallAverageCompletion: avg(items, (p) => p.overallCompletion),
        };
      });
  }
}

export const podsService = new PodsService();
