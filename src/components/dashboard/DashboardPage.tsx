'use client';

import { useEffect, useState } from 'react';
import NextLink from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material';
import BdgPage from '@/components/bdg/BdgPage';
import PodsPage from '@/components/pods/PodsPage';
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
} from '@/components/common/Common';
import ReportSourceSelect, {
  parseReportSource,
  type ReportSource,
} from '@/components/reports/ReportSourceSelect';
import { dashboardApi } from '@/lib/endpoints';
import { formatPodBranch } from '@/lib/shared';

interface Summary {
  totalBdgMembers: number;
  totalInboundLeads: number;
  totalOutboundLeads: number;
  totalLeads: number;
  totalPods: number;
  podsInProgress: number;
  podsCompleted: number;
  avgPodCompletion: number;
  avgFeCompletion: number;
  avgBeCompletion: number;
  avgIntegrationCompletion: number;
  byBranch?: Array<{
    branch: string;
    totalPods: number;
    podsInProgress: number;
    podsCompleted: number;
    avgPodCompletion: number;
  }>;
}

function ProgressRow({ label, value }: { label: string; value: number }) {
  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.75 }}>
        <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{label}</Typography>
        <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{value}%</Typography>
      </Stack>
      <LinearProgress variant="determinate" value={Math.min(100, Math.max(0, value))} />
    </Box>
  );
}

function DashboardOverview() {
  const [data, setData] = useState<Summary | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi
      .summary()
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!data) return <EmptyState title="No dashboard data" />;

  const inboundShare = data.totalLeads
    ? Math.round((data.totalInboundLeads / data.totalLeads) * 100)
    : 0;

  return (
    <Stack spacing={3}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', bgcolor: '#F7FCFD' }}>
            <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
              <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: '0.08em' }}>
                BDG
              </Typography>
              <Typography variant="h5" sx={{ mb: 0.5 }}>
                Lead snapshot
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 3, fontSize: 14 }}>
                {data.totalBdgMembers} members generating pipeline
              </Typography>
              <Typography variant="h3" fontWeight={800} sx={{ mb: 0.5, letterSpacing: '-0.03em' }}>
                {data.totalLeads}
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 2.5 }}>
                total leads
              </Typography>
              <LinearProgress variant="determinate" value={inboundShare} sx={{ mb: 1.5 }} />
              <Stack direction="row" justifyContent="space-between">
                <Typography sx={{ fontSize: 13 }}>
                  Inbound <b>{data.totalInboundLeads}</b> ({inboundShare}%)
                </Typography>
                <Typography sx={{ fontSize: 13 }}>
                  Outbound <b>{data.totalOutboundLeads}</b>
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', bgcolor: '#F7FCFD' }}>
            <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
              <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: '0.08em' }}>
                PODS
              </Typography>
              <Typography variant="h5" sx={{ mb: 0.5 }}>
                Delivery snapshot
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 3, fontSize: 14 }}>
                Work in motion across all branches
              </Typography>
              <Typography variant="h3" fontWeight={800} sx={{ mb: 0.5, letterSpacing: '-0.03em' }}>
                {data.totalPods}
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 2 }}>
                total PODs
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mb: 2.5 }} flexWrap="wrap" useFlexGap>
                <Chip label={`${data.podsInProgress} in progress`} color="info" variant="outlined" />
                <Chip label={`${data.podsCompleted} completed`} variant="outlined" />
              </Stack>
              <ProgressRow label="Average completion" value={data.avgPodCompletion} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
          <Typography variant="h6" sx={{ mb: 0.5 }}>
            Build completion
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3, fontSize: 14 }}>
            Average frontend, backend, and integration progress
          </Typography>
          <Stack spacing={2.5}>
            <ProgressRow label="Frontend" value={data.avgFeCompletion} />
            <ProgressRow label="Backend" value={data.avgBeCompletion} />
            <ProgressRow label="FE + BE integration" value={data.avgIntegrationCompletion} />
          </Stack>
        </CardContent>
      </Card>

      {data.byBranch && data.byBranch.length > 0 ? (
        <Card>
          <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
            <Typography variant="h6" sx={{ mb: 0.5 }}>
              PODs by branch
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3, fontSize: 14 }}>
              Open a branch to filter the PODS board
            </Typography>
            <Grid container spacing={2}>
              {data.byBranch.map((row) => (
                <Grid item xs={12} sm={6} md={3} key={row.branch}>
                  <Box
                    component={NextLink}
                    href={`/pods?branch=${encodeURIComponent(row.branch)}`}
                    sx={{
                      display: 'block',
                      p: 2,
                      borderRadius: 2,
                      bgcolor: '#F3FCFD',
                      border: '1px solid',
                      borderColor: 'divider',
                      textDecoration: 'none',
                      color: 'inherit',
                      height: '100%',
                      '&:hover': { borderColor: 'primary.light', bgcolor: '#E6F7FA' },
                    }}
                  >
                    <Typography variant="overline" color="text.secondary">
                      {formatPodBranch(row.branch)}
                    </Typography>
                    <Typography variant="h4" sx={{ my: 0.5 }}>
                      {row.totalPods}
                    </Typography>
                    <Typography color="text.secondary" sx={{ fontSize: 13, mb: 1.5 }}>
                      {row.podsInProgress} in progress
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(100, Math.max(0, row.avgPodCompletion))}
                    />
                    <Typography color="text.secondary" sx={{ fontSize: 12, mt: 0.75 }}>
                      {row.avgPodCompletion}% avg complete
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      ) : null}
    </Stack>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const source = parseReportSource(searchParams.get('source'));

  const setSource = (next: ReportSource) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next === 'dashboard') params.delete('source');
    else params.set('source', next);
    const qs = params.toString();
    router.replace(qs ? `/dashboard?${qs}` : '/dashboard', { scroll: false });
  };

  const subtitle =
    source === 'bdg'
      ? 'BDG member leads and regional performance'
      : source === 'pods'
        ? 'PODS completion, status, and branch performance'
        : 'A calm snapshot of BDG leads and PODS delivery';

  return (
    <Box>
      <PageHeader title="Dashboard" subtitle={subtitle} />
      <ReportSourceSelect value={source} onChange={setSource} />
      {source === 'bdg' ? (
        <BdgPage hideChrome />
      ) : source === 'pods' ? (
        <PodsPage reportsOnly />
      ) : (
        <DashboardOverview />
      )}
    </Box>
  );
}
