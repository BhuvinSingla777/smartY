import { Suspense } from 'react';
import PodsPage from '@/components/pods/PodsPage';
import { LoadingState } from '@/components/common/Common';

export default function Page() {
  return (
    <Suspense fallback={<LoadingState />}>
      <PodsPage />
    </Suspense>
  );
}
