export const POD_TASK_STATUSES = ['TODO', 'IN_PROGRESS', 'DONE'] as const;
export type PodTaskStatus = (typeof POD_TASK_STATUSES)[number];

export interface ParsedMdTask {
  number: number;
  title: string;
  description: string | null;
  section: string | null;
  status: PodTaskStatus;
}

const NUMBERED =
  /^\s*(?:#{1,6}\s*)?(\d+)[.)]\s+(?:\[[ xX]\]\s*)?(.*)$/;
const CHECKBOX = /^\s*[-*+]\s+\[([ xX])\]\s+(.*)$/;
const HEADING = /^\s{0,3}#{1,6}\s+(.*)$/;
const BLANK = /^\s*$/;

function statusFromCheckbox(mark: string | undefined): PodTaskStatus | undefined {
  if (!mark) return undefined;
  return /x/i.test(mark) ? 'DONE' : 'TODO';
}

function splitTitleAndStatus(raw: string): { title: string; status?: PodTaskStatus } {
  let title = raw.trim();
  let status: PodTaskStatus | undefined;

  const leadingBox = title.match(/^\[([ xX])\]\s*(.*)$/);
  if (leadingBox) {
    status = statusFromCheckbox(leadingBox[1]);
    title = leadingBox[2].trim();
  }

  const trailing = title.match(
    /^(.*?)\s*(?:\(|\[|[-—–:]\s*)(done|complete[d]?|finished|in\s*progress|wip|todo|not\s*done|not\s*started)(?:\)|\])?\s*$/i,
  );
  if (trailing) {
    title = trailing[1].trim();
    const token = trailing[2].toLowerCase();
    if (/done|complete|finished/.test(token)) status = 'DONE';
    else if (/progress|wip/.test(token)) status = 'IN_PROGRESS';
    else status = 'TODO';
  }

  return { title: title.replace(/\s+/g, ' ').trim(), status };
}

function isTaskStart(line: string) {
  return NUMBERED.test(line) || CHECKBOX.test(line);
}

/** Parse numbered (and checkbox) markdown lists into POD tasks. */
export function parseMarkdownTasks(markdown: string): ParsedMdTask[] {
  const text = markdown.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
  const lines = text.split('\n');
  const tasks: ParsedMdTask[] = [];
  let section: string | null = null;
  let current: ParsedMdTask | null = null;
  const usedNumbers = new Set<number>();

  const pushCurrent = () => {
    if (!current) return;
    current.description = current.description?.trim() || null;
    if (current.title) tasks.push(current);
    current = null;
  };

  const nextNumber = (preferred?: number) => {
    if (preferred && preferred > 0 && !usedNumbers.has(preferred)) {
      usedNumbers.add(preferred);
      return preferred;
    }
    let n = preferred && preferred > 0 ? preferred : tasks.length + 1;
    while (usedNumbers.has(n)) n += 1;
    usedNumbers.add(n);
    return n;
  };

  for (const line of lines) {
    const heading = line.match(HEADING);
    if (heading && !isTaskStart(line)) {
      pushCurrent();
      section = heading[1].trim() || null;
      continue;
    }

    const numbered = line.match(NUMBERED);
    if (numbered) {
      pushCurrent();
      const checkbox = line.match(/^\s*(?:#{1,6}\s*)?\d+[.)]\s+\[([ xX])\]\s+/);
      const parsed = splitTitleAndStatus(numbered[2] ?? '');
      current = {
        number: nextNumber(Number(numbered[1])),
        title: parsed.title,
        description: null,
        section,
        status: statusFromCheckbox(checkbox?.[1]) ?? parsed.status ?? 'TODO',
      };
      continue;
    }

    const box = line.match(CHECKBOX);
    if (box) {
      pushCurrent();
      const parsed = splitTitleAndStatus(box[2] ?? '');
      current = {
        number: nextNumber(),
        title: parsed.title,
        description: null,
        section,
        status: statusFromCheckbox(box[1]) ?? parsed.status ?? 'TODO',
      };
      continue;
    }

    if (current && !BLANK.test(line)) {
      const extra = line.replace(/^\s{2,}/, '').trim();
      if (extra) {
        current.description = current.description ? `${current.description}\n${extra}` : extra;
      }
    }
  }

  pushCurrent();
  return tasks.filter((t) => t.title);
}

export function taskStatusWeight(status: string): number {
  const key = status.trim().toUpperCase();
  if (key === 'DONE') return 1;
  if (key === 'IN_PROGRESS') return 0.5;
  return 0;
}

export function taskOverallCompletion(
  tasks: Array<{ status: string }>,
): number | null {
  if (!tasks.length) return null;
  const weighted = tasks.reduce((sum, t) => sum + taskStatusWeight(t.status), 0);
  return Math.round((weighted / tasks.length) * 10000) / 100;
}

export function podStatusFromTasks(
  tasks: Array<{ status: string }>,
): string | null {
  if (!tasks.length) return null;
  const done = tasks.filter((t) => t.status.toUpperCase() === 'DONE').length;
  if (done === tasks.length) return 'Completed';
  const active = tasks.filter((t) => t.status.toUpperCase() !== 'TODO').length;
  if (active > 0) return 'In Progress';
  return 'Not Started';
}

export function isMarkdownFilename(name: string) {
  return /\.(md|markdown|txt)$/i.test(name.trim());
}
