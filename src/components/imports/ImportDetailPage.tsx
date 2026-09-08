'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Box, Card, CardContent, Typography } from '@mui/material';
import { importsApi } from '@/lib/endpoints';
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
} from '@/components/common/Common';

export default function ImportDetailPage() {
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : undefined;
  const [job, setJob] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    importsApi
      .get(id)
      .then(setJob)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!job) return <EmptyState title="Import not found" />;

  const upload = job.upload as Record<string, unknown> | undefined;
  const preview = job.previewPayload as Record<string, unknown> | null;

  return (
    <Box>
      <PageHeader
        title={`Import: ${String(upload?.originalName ?? id)}`}
        subtitle={String(job.summary ?? job.status)}
      />
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="body2">Module: {String(job.module)}</Typography>
          <Typography variant="body2">Status: {String(job.status)}</Typography>
          <Typography variant="body2">
            Created: {String(job.recordsCreated)} · Updated: {String(job.recordsUpdated)} ·
            Errors: {String(job.errorCount)}
          </Typography>
          <Typography variant="body2">
            At:{' '}
            {job.createdAt ? new Date(String(job.createdAt)).toLocaleString() : '—'}
          </Typography>
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Preview payload
          </Typography>
          <Box
            component="pre"
            sx={{
              overflow: 'auto',
              maxHeight: 480,
              bgcolor: '#0747A6',
              color: '#DEEBFF',
              p: 2,
              borderRadius: 1,
              fontSize: 12,
            }}
          >
            {JSON.stringify(preview, null, 2)}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
