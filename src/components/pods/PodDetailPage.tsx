'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import NextLink from 'next/link';
import {
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  LinearProgress,
  Link,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { podsApi } from '@/lib/endpoints';
import {
  ErrorState,
  LoadingState,
  PageHeader,
  EmptyState,
} from '@/components/common/Common';
import { formatPodBranch } from '@/lib/shared';
import PodTaskBoard, { type PodTask } from '@/components/pods/PodTaskBoard';

const emptyDaily = {
  date: new Date().toISOString().slice(0, 10),
  feCompletion: 0,
  beCompletion: 0,
  integrationCompletion: 0,
};

export default function PodDetailPage() {
<<<<<<< HEAD:src/components/pods/PodDetailPage.tsx
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : undefined;
=======
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { id } = useParams<{ id: string }>();
>>>>>>> 97be95e123299086db26dee4524914b5379ba179:apps/web/src/pages/pods/PodDetailPage.tsx
  const [pod, setPod] = useState<Record<string, unknown> | null>(null);
  const [history, setHistory] = useState<Array<Record<string, unknown>>>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDailyId, setEditDailyId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyDaily);
  const [busy, setBusy] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    podsApi
      .history(id)
      .then((res) => {
        setPod(res.pod);
        setHistory(res.history ?? []);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id, reloadKey]);

  if (loading) return <LoadingState />;
  if (error && !pod) return <ErrorState message={error} />;
  if (!pod) return <EmptyState title="POD not found" />;

  const chart = history.map((h) => ({
    date: String(h.date).slice(0, 10),
    FE: h.feCompletion,
    BE: h.beCompletion,
    Integration: h.integrationCompletion,
  }));

  const openCreate = () => {
    setEditDailyId(null);
    setForm({
      ...emptyDaily,
      date: new Date().toISOString().slice(0, 10),
      feCompletion: Number(pod.feCompletion ?? 0),
      beCompletion: Number(pod.beCompletion ?? 0),
      integrationCompletion: Number(pod.integrationCompletion ?? 0),
    });
    setDialogOpen(true);
  };

  const openEdit = (row: Record<string, unknown>) => {
    setEditDailyId(String(row.id));
    setForm({
      date: String(row.date).slice(0, 10),
      feCompletion: Number(row.feCompletion ?? 0),
      beCompletion: Number(row.beCompletion ?? 0),
      integrationCompletion: Number(row.integrationCompletion ?? 0),
    });
    setDialogOpen(true);
  };

  const saveDaily = async () => {
    if (!id) return;
    setBusy(true);
    setError('');
    try {
      if (editDailyId) {
        await podsApi.updateDaily(id, editDailyId, form);
      } else {
        await podsApi.upsertDaily(id, form);
      }
      setDialogOpen(false);
      setReloadKey((k) => k + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setBusy(false);
    }
  };

  const deleteDaily = async (dailyId: string, date: string) => {
    if (!id) return;
    if (!window.confirm(`Delete daily update for ${date}?`)) return;
    try {
      await podsApi.removeDaily(id, dailyId);
      setReloadKey((k) => k + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed');
    }
  };

  const ProgressRow = ({
    label,
    value,
  }: {
    label: string;
    value: number | null | undefined;
  }) => (
    <Box sx={{ mb: 2 }}>
      <Stack direction="row" justifyContent="space-between">
        <Typography variant="body2">{label}</Typography>
        <Typography variant="body2" fontWeight={600}>
          {value ?? 0}%
        </Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={Number(value ?? 0)}
        sx={{ height: 10, borderRadius: 1, mt: 0.5 }}
      />
    </Box>
  );

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link component={NextLink} href="/pods" underline="hover">
          PODS
        </Link>
        <Typography color="text.primary">{String(pod.name)}</Typography>
      </Breadcrumbs>
      <PageHeader
        title={String(pod.name)}
        subtitle={String(pod.description ?? '')}
        action={
          <Button variant="contained" onClick={openCreate} fullWidth={isMobile}>
            Add Daily Update
          </Button>
        }
      />

      {error ? <ErrorState message={error} /> : null}

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <PodTaskBoard
            key={id}
            podId={String(pod.id ?? id)}
            initialTasks={(Array.isArray(pod.tasks) ? pod.tasks : []) as PodTask[]}
            onStats={({ overallCompletion, status }) => {
              setPod((current) =>
                current
                  ? {
                      ...current,
                      overallCompletion,
                      ...(status ? { status } : {}),
                    }
                  : current,
              );
            }}
          />
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        <Grid item xs={12} md={5}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Overview
              </Typography>
              {[
                ['Status', pod.status],
                ['Start Date', pod.startDate ? String(pod.startDate).slice(0, 10) : '—'],
                ['Developer', pod.developers],
                ['Machine Owner', pod.machineOwner],
                ['Machine', pod.machineAlignedToProject],
                ['Branch', formatPodBranch(pod.branch as string | null)],
              ].map(([label, value]) => (
                <Stack
                  key={String(label)}
                  direction="row"
                  justifyContent="space-between"
                  gap={2}
                  sx={{ py: 0.75, borderBottom: '1px solid rgba(0,0,0,0.06)' }}
                >
                  <Typography color="text.secondary" sx={{ flexShrink: 0 }}>
                    {String(label)}
                  </Typography>
                  <Typography
                    fontWeight={500}
                    sx={{ minWidth: 0, textAlign: 'right', wordBreak: 'break-word' }}
                  >
                    {String(value ?? '—')}
                  </Typography>
                </Stack>
              ))}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={7}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Current Completion
              </Typography>
              <ProgressRow label="Frontend" value={pod.feCompletion as number} />
              <ProgressRow label="Backend" value={pod.beCompletion as number} />
              <ProgressRow
                label="Integration"
                value={pod.integrationCompletion as number}
              />
              <Typography variant="body2" color="text.secondary">
                Overall: {String(pod.overallCompletion ?? 0)}%
                {Number(pod.taskCount ?? 0) > 0 ? ' (from tasks)' : ''}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        {pod.extraFields &&
        typeof pod.extraFields === 'object' &&
        Object.keys(pod.extraFields as object).length > 0 ? (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Extracted sheet columns
                </Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Column</TableCell>
                      <TableCell>Value</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(pod.extraFields as Record<string, unknown>).map(
                      ([key, value]) => (
                        <TableRow key={key}>
                          <TableCell sx={{ fontWeight: 600 }}>{key}</TableCell>
                          <TableCell>{value == null || value === '' ? '—' : String(value)}</TableCell>
                        </TableRow>
                      ),
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </Grid>
        ) : null}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Historical Progress
              </Typography>
              {chart.length === 0 ? (
                <EmptyState
                  title="No daily updates yet"
                  description="Add a daily update to track progress over time."
                />
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={chart}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="FE" stroke="#0052CC" strokeWidth={2} />
                    <Line type="monotone" dataKey="BE" stroke="#FFAB00" strokeWidth={2} />
                    <Line
                      type="monotone"
                      dataKey="Integration"
                      stroke="#36B37E"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Daily Update Table
              </Typography>
              <TableContainer sx={{ overflowX: 'auto', width: '100%' }}>
              <Table size="small" sx={{ minWidth: 480 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell align="right">FE</TableCell>
                    <TableCell align="right">BE</TableCell>
                    <TableCell align="right">Integration</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {history.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5}>
                        <EmptyState title="No rows yet" />
                      </TableCell>
                    </TableRow>
                  ) : (
                    history.map((h) => (
                      <TableRow key={String(h.id)}>
                        <TableCell>{String(h.date).slice(0, 10)}</TableCell>
                        <TableCell align="right">
                          {String(h.feCompletion ?? '—')}
                        </TableCell>
                        <TableCell align="right">
                          {String(h.beCompletion ?? '—')}
                        </TableCell>
                        <TableCell align="right">
                          {String(h.integrationCompletion ?? '—')}
                        </TableCell>
                        <TableCell align="right">
                          <IconButton size="small" onClick={() => openEdit(h)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() =>
                              deleteDaily(String(h.id), String(h.date).slice(0, 10))
                            }
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>
          {editDailyId ? 'Update Daily Entry' : 'Add Daily Update'}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="Date"
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="FE Completion %"
              type="number"
              value={form.feCompletion}
              onChange={(e) =>
                setForm((f) => ({ ...f, feCompletion: Number(e.target.value) }))
              }
              fullWidth
              size="small"
              inputProps={{ min: 0, max: 100 }}
            />
            <TextField
              label="BE Completion %"
              type="number"
              value={form.beCompletion}
              onChange={(e) =>
                setForm((f) => ({ ...f, beCompletion: Number(e.target.value) }))
              }
              fullWidth
              size="small"
              inputProps={{ min: 0, max: 100 }}
            />
            <TextField
              label="Integration Completion %"
              type="number"
              value={form.integrationCompletion}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  integrationCompletion: Number(e.target.value),
                }))
              }
              fullWidth
              size="small"
              inputProps={{ min: 0, max: 100 }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={busy || !form.date} onClick={saveDaily}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
