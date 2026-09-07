import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Grid,
  Typography,
  Stack,
} from '@mui/material';
import { dashboardApi } from '../../services/endpoints';
import {
  EmptyState,
  ErrorState,
  KpiCard,
  LoadingState,
  PageHeader,
} from '../../components/Common';

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
}

const links = [
  { title: 'BDG Dashboard', to: '/bdg', desc: 'Add and manage member leads by region' },
  { title: 'PODS Dashboard', to: '/pods', desc: 'Add PODs and track completion progress' },
];

export default function DashboardPage() {
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

  return (
    <Box>
      <PageHeader
        title="Overview"
        subtitle="High-level BDG and PODS metrics from PostgreSQL"
      />
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard label="Total BDG Members" value={data.totalBdgMembers} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard label="Inbound Leads" value={data.totalInboundLeads} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard label="Outbound Leads" value={data.totalOutboundLeads} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard label="Total Leads" value={data.totalLeads} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard label="Total PODs" value={data.totalPods} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard label="PODs In Progress" value={data.podsInProgress} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard label="Completed PODs" value={data.podsCompleted} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard
            label="Avg POD Completion"
            value={`${data.avgPodCompletion}%`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <KpiCard label="Average FE Completion" value={`${data.avgFeCompletion}%`} />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <KpiCard label="Average BE Completion" value={`${data.avgBeCompletion}%`} />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <KpiCard
            label="Average FE + BE Integration"
            value={`${data.avgIntegrationCompletion}%`}
          />
        </Grid>
      </Grid>

      <Typography variant="h6" sx={{ mb: 1.5 }}>
        Navigate
      </Typography>
      <Grid container spacing={2}>
        {links.map((link, index) => {
          const accents = ['#0052CC', '#FFAB00', '#36B37E', '#6554C0'];
          const accent = accents[index % accents.length];
          return (
            <Grid item xs={12} sm={6} md={6} key={link.to}>
              <Card
                sx={{
                  height: '100%',
                  transition: 'box-shadow 0.2s, transform 0.2s',
                  '&:hover': {
                    boxShadow: '0 8px 16px -4px rgba(9, 30, 66, 0.16)',
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <CardActionArea component={RouterLink} to={link.to} sx={{ height: '100%' }}>
                  <CardContent>
                    <Stack spacing={1}>
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: accent,
                        }}
                      />
                      <Typography variant="subtitle1" fontWeight={700}>
                        {link.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {link.desc}
                      </Typography>
                    </Stack>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}
