import { Suspense } from 'react';
import DashboardPage from '@/components/dashboard/DashboardPage';
import { LoadingState } from '@/components/common/Common';

export default function Page() {
  return (
    <Suspense fallback={<LoadingState />}>
      <DashboardPage />
    </Suspense>
  );
}
