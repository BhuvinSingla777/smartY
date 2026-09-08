'use client';

import { useEffect, useState } from 'react';
import NextLink from 'next/link';
import {
  Box,
  Card,
  CardContent,
  Chip,
  Link,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
} from '@mui/material';
import { importsApi } from '@/lib/endpoints';
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
} from '@/components/common/Common';

export default function ImportsPage() {
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    importsApi
      .list(page + 1)
      .then((res) => {
        setRows(res.data);
        setTotal(res.total);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [page]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  return (
    <Box>
      <PageHeader
        title="Releases"
        subtitle="Track previewed and committed imports"
      />
      <Card>
        <CardContent>
          {rows.length === 0 ? (
            <EmptyState title="No imports yet" description="Upload a report to create an import job." />
          ) : (
            <>
              <TableContainer sx={{ overflowX: 'auto', width: '100%' }}>
                <Table size="small" sx={{ minWidth: 900 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>File Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Module</TableCell>
                    <TableCell align="right">Records Found</TableCell>
                    <TableCell align="right">Created</TableCell>
                    <TableCell align="right">Updated</TableCell>
                    <TableCell align="right">Errors</TableCell>
                    <TableCell>Uploaded By</TableCell>
                    <TableCell>Uploaded At</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row) => {
                    const upload = row.upload as Record<string, unknown> | undefined;
                    const committedBy = row.committedBy as
                      | Record<string, unknown>
                      | undefined
                      | null;
                    return (
                      <TableRow key={String(row.id)} hover>
                        <TableCell>
                          <Link component={NextLink} href={`/imports/${row.id}`}>
                            {String(upload?.originalName ?? '—')}
                          </Link>
                        </TableCell>
                        <TableCell>{String(upload?.format ?? '—')}</TableCell>
                        <TableCell>{String(row.module)}</TableCell>
                        <TableCell align="right">{String(row.recordsFound)}</TableCell>
                        <TableCell align="right">{String(row.recordsCreated)}</TableCell>
                        <TableCell align="right">{String(row.recordsUpdated)}</TableCell>
                        <TableCell align="right">{String(row.errorCount)}</TableCell>
                        <TableCell>
                          {String(
                            committedBy?.name ??
                              (upload?.uploadedBy as { name?: string } | undefined)?.name ??
                              '—',
                          )}
                        </TableCell>
                        <TableCell>
                          {row.createdAt
                            ? new Date(String(row.createdAt)).toLocaleString()
                            : '—'}
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={String(row.status)}
                            color={
                              row.status === 'COMMITTED'
                                ? 'success'
                                : row.status === 'FAILED'
                                  ? 'error'
                                  : 'default'
                            }
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              </TableContainer>
              <TablePagination
                component="div"
                count={total}
                page={page}
                onPageChange={(_, p) => setPage(p)}
                rowsPerPage={20}
                rowsPerPageOptions={[20]}
              />
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
