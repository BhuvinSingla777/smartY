'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import NextLink from 'next/link';
import {
  Box,
  Breadcrumbs,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  Link,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
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

export default function PodDetailPage() {
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : undefined;
  const [pod, setPod] = useState<Record<string, unknown> | null>(null);
  const [history, setHistory] = useState<Array<Record<string, unknown>>>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

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
  }, [id]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!pod) return <EmptyState title="POD not found" />;

  const chart = history.map((h) => ({
    date: String(h.date).slice(0, 10),
    FE: h.feCompletion,
    BE: h.beCompletion,
    Integration: h.integrationCompletion,
  }));

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
      <PageHeader title={String(pod.name)} subtitle={String(pod.description ?? '')} />

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
                  sx={{ py: 0.75, borderBottom: '1px solid rgba(0,0,0,0.06)' }}
                >
                  <Typography color="text.secondary">{String(label)}</Typography>
                  <Typography fontWeight={500}>{String(value ?? '—')}</Typography>
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
                <EmptyState title="No daily updates yet" />
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
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell align="right">FE</TableCell>
                    <TableCell align="right">BE</TableCell>
                    <TableCell align="right">Integration</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {history.map((h) => (
                    <TableRow key={String(h.id)}>
                      <TableCell>{String(h.date).slice(0, 10)}</TableCell>
                      <TableCell align="right">{String(h.feCompletion ?? '—')}</TableCell>
                      <TableCell align="right">{String(h.beCompletion ?? '—')}</TableCell>
                      <TableCell align="right">
                        {String(h.integrationCompletion ?? '—')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
