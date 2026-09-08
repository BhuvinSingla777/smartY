'use client';

import { useMemo, useRef, useState } from 'react';
import {
  Box,
  Button,
  Card,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { podsApi } from '@/lib/endpoints';
import { EmptyState, ErrorState } from '@/components/common/Common';

export type PodTaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

export interface PodTask {
  id: string;
  number: number;
  title: string;
  description?: string | null;
  section?: string | null;
  status: string;
  sortOrder: number;
}

const COLUMNS: Array<{ id: PodTaskStatus; title: string; dot: string }> = [
  { id: 'TODO', title: 'Not done', dot: '#4C9AFF' },
  { id: 'IN_PROGRESS', title: 'In progress', dot: '#FFAB00' },
  { id: 'DONE', title: 'Done', dot: '#36B37E' },
];

function truncateWords(text: string, maxWords = 6) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return text.trim();
  return `${words.slice(0, maxWords).join(' ')}...`;
}

function overallFrom(tasks: PodTask[]) {
  if (!tasks.length) return null;
  const weight = (status: string) => {
    const key = status.toUpperCase();
    if (key === 'DONE') return 1;
    if (key === 'IN_PROGRESS') return 0.5;
    return 0;
  };
  return Math.round(
    (tasks.reduce((sum, t) => sum + weight(t.status), 0) / tasks.length) * 10000,
  ) / 100;
}

export default function PodTaskBoard({
  podId,
  initialTasks,
  onStats,
}: {
  podId: string;
  initialTasks: PodTask[];
  onStats?: (stats: {
    overallCompletion: number | null;
    taskCount: number;
    status?: string | null;
  }) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [tasks, setTasks] = useState<PodTask[]>(initialTasks);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overStatus, setOverStatus] = useState<PodTaskStatus | null>(null);

  const overall = overallFrom(tasks);
  const grouped = useMemo(
    () =>
      COLUMNS.map((column) => ({
        ...column,
        items: tasks
          .filter((t) => t.status.toUpperCase() === column.id)
          .sort((a, b) => a.sortOrder - b.sortOrder || a.number - b.number),
      })),
    [tasks],
  );

  const applyResult = (res: {
    tasks: PodTask[];
    overallCompletion: number | null;
    taskCount: number;
    status?: string | null;
  }) => {
    setTasks(res.tasks);
    onStats?.({
      overallCompletion: res.overallCompletion,
      taskCount: res.taskCount,
      status: res.status,
    });
  };

  const upload = async (file: File) => {
    setBusy(true);
    setError('');
    try {
      const res = await podsApi.importTasks(podId, file);
      applyResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const moveTask = async (taskId: string, status: PodTaskStatus) => {
    const current = tasks.find((t) => t.id === taskId);
    if (!current || current.status.toUpperCase() === status) return;
    const previous = tasks;
    setTasks((list) =>
      list.map((t) => (t.id === taskId ? { ...t, status } : t)),
    );
    try {
      const res = await podsApi.moveTask(podId, taskId, { status });
      applyResult(res);
    } catch (e) {
      setTasks(previous);
      setError(e instanceof Error ? e.message : 'Could not move task');
    }
  };

  const clear = async () => {
    if (!tasks.length) return;
    if (!window.confirm('Remove all tasks for this POD?')) return;
    setBusy(true);
    setError('');
    try {
      const res = await podsApi.clearTasks(podId);
      applyResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not clear tasks');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ sm: 'center' }}
        spacing={1.5}
        sx={{ mb: 1.5 }}
      >
        <Box>
          <Typography variant="h6" sx={{ mb: 0.25 }}>
            Tasks
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Upload a numbered Markdown file, then drag cards between columns.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <input
            ref={inputRef}
            type="file"
            hidden
            accept=".md,.markdown,.txt,text/markdown,text/plain"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void upload(file);
            }}
          />
          <Button
            variant="contained"
            startIcon={<CloudUploadIcon />}
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            Upload .md
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteOutlineIcon />}
            disabled={busy || tasks.length === 0}
            onClick={() => void clear()}
          >
            Clear
          </Button>
        </Stack>
      </Stack>

      {error ? <ErrorState message={error} /> : null}

      {tasks.length > 0 ? (
        <Box sx={{ mb: 2 }}>
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
            <Typography variant="body2" fontWeight={600}>
              Overall completion
            </Typography>
            <Typography variant="body2" fontWeight={700}>
              {overall ?? 0}%
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={overall ?? 0}
            sx={{ height: 8, mb: 0.75 }}
          />
          <Typography variant="caption" color="text.secondary">
            {grouped[2].items.length} done · {grouped[1].items.length} in progress ·{' '}
            {grouped[0].items.length} not done · In progress counts as 50%
          </Typography>
        </Box>
      ) : null}

      {tasks.length === 0 ? (
        <EmptyState
          title="No tasks yet"
          description="Upload a .md file with numbered tasks, for example: 1. Design login  2. Build API  3. QA sign-off"
        />
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(220px, 1fr))' },
            gap: 1.75,
            alignItems: 'start',
          }}
        >
          {grouped.map((column) => {
            const isOver = overStatus === column.id;
            return (
              <Box
                key={column.id}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  setOverStatus(column.id);
                }}
                onDragLeave={(e) => {
                  const next = e.relatedTarget as Node | null;
                  if (next && e.currentTarget.contains(next)) return;
                  setOverStatus((current) => (current === column.id ? null : current));
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const id = e.dataTransfer.getData('text/plain') || dragId;
                  setOverStatus(null);
                  setDragId(null);
                  if (id) void moveTask(id, column.id);
                }}
                sx={{
                  bgcolor: isOver ? '#E6FCFF' : '#EBECF0',
                  borderRadius: 2.5,
                  p: 1.25,
                  minHeight: 280,
                  outline: isOver ? '2px dashed #00A3BF' : 'none',
                  outlineOffset: -2,
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1} sx={{ px: 0.5, mb: 1.25 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: column.dot }} />
                  <Typography variant="subtitle2" fontWeight={700}>
                    {column.title} ({column.items.length})
                  </Typography>
                </Stack>
                {column.items.map((task) => (
                  <Card
                    key={task.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', task.id);
                      e.dataTransfer.effectAllowed = 'move';
                      setDragId(task.id);
                    }}
                    onDragEnd={() => {
                      setDragId(null);
                      setOverStatus(null);
                    }}
                    sx={{
                      p: 1.5,
                      mb: 1.25,
                      borderRadius: 2,
                      cursor: 'grab',
                      opacity: dragId === task.id ? 0.45 : 1,
                      boxShadow: '0 1px 3px rgba(9, 30, 66, 0.13)',
                      '&:active': { cursor: 'grabbing' },
                    }}
                  >
                    <Typography variant="caption" color="text.secondary" fontWeight={700}>
                      #{task.number}
                      {task.section ? ` · ${task.section}` : ''}
                    </Typography>
                    <Typography fontWeight={700} sx={{ fontSize: 14, lineHeight: 1.35, mt: 0.25 }}>
                      {task.title}
                    </Typography>
                    {task.description ? (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {truncateWords(task.description, 6)}
                      </Typography>
                    ) : null}
                  </Card>
                ))}
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
