'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Box } from '@mui/material';
import BdgPage from '@/components/bdg/BdgPage';
import PodsPage from '@/components/pods/PodsPage';
import { PageHeader } from '@/components/common/Common';
import ReportSourceSelect, {
  parseReportSource,
  type ReportSource,
} from '@/components/reports/ReportSourceSelect';

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const source = parseReportSource(searchParams.get('source'));

  const setSource = (next: ReportSource) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next === 'pods') params.delete('source');
    else params.set('source', next);
    const qs = params.toString();
    router.replace(qs ? `/dashboard?${qs}` : '/dashboard', { scroll: false });
  };

  return (
    <Box>
      <PageHeader
        title="Reports"
        subtitle={
          source === 'bdg'
            ? 'BDG member leads and regional performance'
            : 'PODS completion, status, and branch performance'
        }
      />
      <ReportSourceSelect value={source} onChange={setSource} />
      {source === 'bdg' ? <BdgPage hideChrome /> : <PodsPage reportsOnly />}
    </Box>
  );
}
