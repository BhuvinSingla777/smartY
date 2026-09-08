import { isAggregateMemberName, overallCompletion, parsePodBranch } from '@/lib/shared';
import { prisma } from '@/lib/prisma';

export class DashboardService {
  async summary() {
    const [membersRaw, pods] = await Promise.all([
      prisma.bdgMember.findMany(),
      prisma.pod.findMany(),
    ]);

    const members = membersRaw.filter((m) => !isAggregateMemberName(m.memberName));

    let totalInbound = 0;
    let totalOutbound = 0;
    for (const m of members) {
      totalInbound += m.totalInbound ?? 0;
      totalOutbound += m.totalOutbound ?? 0;
    }

    const normalizeStatus = (s: string | null | undefined) =>
      (s ?? '').trim().toLowerCase();

    const podsInProgress = pods.filter((p) =>
      /progress|wip|ongoing/i.test(normalizeStatus(p.status)),
    ).length;
    const podsCompleted = pods.filter((p) =>
      /complete|done|closed/i.test(normalizeStatus(p.status)),
    ).length;

    const avg = (vals: Array<number | null | undefined>) => {
      const n = vals.filter((v): v is number => typeof v === 'number');
      if (!n.length) return 0;
      return Math.round((n.reduce((a, b) => a + b, 0) / n.length) * 100) / 100;
    };

    const overalls = pods.map((p) =>
      overallCompletion(p.feCompletion, p.beCompletion, p.integrationCompletion),
    );

    const byBranchMap = new Map<
      string,
      { totalPods: number; podsInProgress: number; podsCompleted: number; overalls: number[] }
    >();
    for (const key of ['sdm', 'sdd', 'sdn']) {
      byBranchMap.set(key, {
        totalPods: 0,
        podsInProgress: 0,
        podsCompleted: 0,
        overalls: [],
      });
    }
    for (const p of pods) {
      const key = parsePodBranch(p.branch) ?? 'unassigned';
      if (!byBranchMap.has(key)) {
        byBranchMap.set(key, {
          totalPods: 0,
          podsInProgress: 0,
          podsCompleted: 0,
          overalls: [],
        });
      }
      const bucket = byBranchMap.get(key)!;
      bucket.totalPods += 1;
      if (/progress|wip|ongoing/i.test(normalizeStatus(p.status))) {
        bucket.podsInProgress += 1;
      }
      if (/complete|done|closed/i.test(normalizeStatus(p.status))) {
        bucket.podsCompleted += 1;
      }
      const overall = overallCompletion(
        p.feCompletion,
        p.beCompletion,
        p.integrationCompletion,
      );
      if (typeof overall === 'number') bucket.overalls.push(overall);
    }

    const byBranch = ['sdm', 'sdd', 'sdn', 'unassigned']
      .filter((key) => byBranchMap.has(key) && (key !== 'unassigned' || (byBranchMap.get(key)?.totalPods ?? 0) > 0))
      .map((branch) => {
        const bucket = byBranchMap.get(branch)!;
        return {
          branch,
          totalPods: bucket.totalPods,
          podsInProgress: bucket.podsInProgress,
          podsCompleted: bucket.podsCompleted,
          avgPodCompletion: avg(bucket.overalls),
        };
      });

    return {
      totalBdgMembers: members.length,
      totalInboundLeads: totalInbound,
      totalOutboundLeads: totalOutbound,
      totalLeads: totalInbound + totalOutbound,
      totalPods: pods.length,
      podsInProgress,
      podsCompleted,
      avgPodCompletion: avg(overalls),
      avgFeCompletion: avg(pods.map((p) => p.feCompletion)),
      avgBeCompletion: avg(pods.map((p) => p.beCompletion)),
      avgIntegrationCompletion: avg(pods.map((p) => p.integrationCompletion)),
      byBranch,
    };
  }
}

export const dashboardService = new DashboardService();
