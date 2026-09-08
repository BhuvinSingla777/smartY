export const POD_BRANCHES = ['sdm', 'sdd', 'sdn'] as const;

export type PodBranch = (typeof POD_BRANCHES)[number];

export function isPodBranch(value: string): value is PodBranch {
  return (POD_BRANCHES as readonly string[]).includes(value);
}

export function parsePodBranch(value: unknown): PodBranch | null {
  if (value === null || value === undefined || value === '') return null;
  const text = String(value).trim().toLowerCase();
  if (!text) return null;
  if (isPodBranch(text)) return text;
  const match = text.match(/\b(sdm|sdd|sdn)\b/);
  return match ? (match[1] as PodBranch) : null;
}

export function inferPodBranch(row: Record<string, unknown>): PodBranch | null {
  for (const value of Object.values(row)) {
    const parsed = parsePodBranch(value);
    if (parsed) return parsed;
  }
  return null;
}

export function resolvePodBranch(
  row: Record<string, unknown>,
  explicit?: unknown,
  fallback?: unknown,
): PodBranch | null {
  return (
    parsePodBranch(explicit) ?? inferPodBranch(row) ?? parsePodBranch(fallback)
  );
}

export function formatPodBranch(branch: string | null | undefined): string {
  if (!branch) return 'Unassigned';
  return branch.toUpperCase();
}
