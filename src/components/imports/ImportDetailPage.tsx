'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import NextLink from 'next/link';
import { useParams } from 'next/navigation';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Link,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { importsApi } from '@/lib/endpoints';
import {
  EmptyState,
  ErrorState,
  KpiCard,
  LoadingState,
  PageHeader,
} from '@/components/common/Common';
import { POD_DOMAINS, domainOverall, formatPodBranch } from '@/lib/shared';

type Person = { name?: string; email?: string } | null;
type Sheet = { name?: string; headers?: string[]; rows?: Record<string, unknown>[] };
type PreviewRecord = {
  row?: number;
  action?: string;
  data?: Record<string, unknown>;
  issues?: Array<{ message?: string; severity?: string }>;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map((v) => String(v)).filter(Boolean) : [];
}

function formatWhen(value: unknown) {
  if (!value) return '—';
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString();
}

function formatCell(value: unknown) {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'number') {
    return Number.isInteger(value) ? String(value) : String(Math.round(value * 100) / 100);
  }
  return String(value);
}

function statusColor(status: string) {
  if (status === 'COMMITTED') return 'success' as const;
  if (status === 'FAILED') return 'error' as const;
  return 'default' as const;
}

export default function ImportDetailPage() {
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : undefined;
  const [job, setJob] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [sheetIndex, setSheetIndex] = useState(0);

  useEffect(() => {
    if (!id) return;
    importsApi
      .get(id)
      .then(setJob)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const upload = asRecord(job?.upload);
  const preview = asRecord(job?.previewPayload);
  const committedBy = (job?.committedBy as Person) ?? null;
  const uploadedBy = (upload?.uploadedBy as Person) ?? null;
  const sheets = useMemo<Sheet[]>(() => {
    const raw = preview?.sheets;
    return Array.isArray(raw) ? (raw as Sheet[]) : [];
  }, [preview]);
  const activeSheet = sheets[sheetIndex] ?? sheets[0] ?? null;
  const pods = Array.isArray(job?.pods) ? (job.pods as Array<Record<string, unknown>>) : [];
  const members = Array.isArray(job?.bdgMembers)
    ? (job.bdgMembers as Array<Record<string, unknown>>)
    : [];
  const createdNames = asStringArray(preview?.createdNames);
  const updatedNames = asStringArray(preview?.updatedNames);
  const skippedRows = Array.isArray(preview?.skippedRows)
    ? (preview.skippedRows as Array<Record<string, unknown>>)
    : [];
  const previewPods = Array.isArray(preview?.pods) ? (preview.pods as PreviewRecord[]) : [];
  const previewMembers = Array.isArray(preview?.records)
    ? (preview.records as PreviewRecord[])
    : [];
  const parseWarnings = asStringArray(preview?.parseWarnings);
  const errorDetails = asRecord(job?.errorDetails);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!job) return <EmptyState title="Import not found" />;

  const fileName = String(upload?.originalName ?? 'Import');
  const status = String(job.status ?? '—');
  const moduleName = String(job.module ?? '—');
  const summary = String(job.summary ?? `${moduleName} import ${status.toLowerCase()}`);
  const by = committedBy?.name ?? uploadedBy?.name ?? '—';

  return (
    <Box>
      <PageHeader
        title={fileName}
        subtitle={summary}
        action={
          <Button
            component={NextLink}
            href="/imports"
            startIcon={<ArrowBackIcon />}
            variant="outlined"
          >
            Back to History
          </Button>
        }
      />

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={6} sm={4} md={2}>
          <KpiCard label="Found" value={Number(job.recordsFound ?? 0)} />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <KpiCard label="Created" value={Number(job.recordsCreated ?? 0)} />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <KpiCard label="Updated" value={Number(job.recordsUpdated ?? 0)} />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <KpiCard label="Skipped" value={Number(job.recordsSkipped ?? 0)} />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <KpiCard label="Errors" value={Number(job.errorCount ?? 0)} />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <KpiCard label="Warnings" value={Number(job.warningCount ?? 0)} />
        </Grid>
      </Grid>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} flexWrap="wrap" useFlexGap>
            <Detail label="Module" value={moduleName} />
            <Detail
              label="Status"
              value={
                <Chip size="small" label={status} color={statusColor(status)} />
              }
            />
            <Detail label="File type" value={String(upload?.format ?? '—')} />
            <Detail label="Imported by" value={by} />
            <Detail label="Imported at" value={formatWhen(job.committedAt ?? job.createdAt)} />
          </Stack>
          {errorDetails?.message ? (
            <ErrorState message={String(errorDetails.message)} />
          ) : null}
          {parseWarnings.length > 0 ? (
            <Typography color="text.secondary" sx={{ mt: 2, fontSize: 13 }}>
              {parseWarnings.join(' ')}
            </Typography>
          ) : null}
        </CardContent>
      </Card>

      {pods.length > 0 ? (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              PODs in this import
            </Typography>
            <TableContainer sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>POD</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Branch</TableCell>
                    <TableCell align="right">Fast API %</TableCell>
                    <TableCell align="right">Node %</TableCell>
                    <TableCell align="right">.NET Core %</TableCell>
                    <TableCell align="right">FE %</TableCell>
                    <TableCell align="right">BE %</TableCell>
                    <TableCell align="right">Integration %</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pods.map((pod) => (
                    <TableRow key={String(pod.id)} hover>
                      <TableCell>
                        <Link component={NextLink} href={`/pods/${pod.id}`}>
                          {String(pod.name)}
                        </Link>
                      </TableCell>
                      <TableCell>{String(pod.status ?? '—')}</TableCell>
                      <TableCell>{formatPodBranch(pod.branch as string | null)}</TableCell>
                      {POD_DOMAINS.map((domain) => (
                        <TableCell key={domain.id} align="right">
                          {formatCell(domainOverall(pod.domainCompletions, domain.id))}
                        </TableCell>
                      ))}
                      <TableCell align="right">{formatCell(pod.feCompletion)}</TableCell>
                      <TableCell align="right">{formatCell(pod.beCompletion)}</TableCell>
                      <TableCell align="right">{formatCell(pod.integrationCompletion)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      ) : null}

      {members.length > 0 ? (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              BDG members in this import
            </Typography>
            <TableContainer sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Member</TableCell>
                    <TableCell align="right">Inbound</TableCell>
                    <TableCell align="right">Outbound</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={String(member.id)} hover>
                      <TableCell>{String(member.memberName)}</TableCell>
                      <TableCell align="right">{formatCell(member.totalInbound)}</TableCell>
                      <TableCell align="right">{formatCell(member.totalOutbound)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      ) : null}

      {createdNames.length || updatedNames.length || skippedRows.length ? (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Changes
            </Typography>
            <NameList label="Created" names={createdNames} />
            <NameList label="Updated" names={updatedNames} />
            {skippedRows.length > 0 ? (
              <Box sx={{ mt: 1.5 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  Skipped
                </Typography>
                {skippedRows.map((row, index) => (
                  <Typography key={`${row.name}-${index}`} sx={{ fontSize: 13 }}>
                    {String(row.name || 'Untitled')}: {String(row.reason || 'Skipped')}
                  </Typography>
                ))}
              </Box>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {previewPods.length > 0 ? (
        <RecordTable title="POD rows" records={previewPods} nameKey="podName" />
      ) : null}
      {previewMembers.length > 0 ? (
        <RecordTable title="BDG rows" records={previewMembers} nameKey="memberName" />
      ) : null}

      {activeSheet ? (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Extracted sheets
            </Typography>
            {sheets.length > 1 ? (
              <Tabs
                value={Math.min(sheetIndex, sheets.length - 1)}
                onChange={(_, value) => setSheetIndex(value)}
                variant="scrollable"
                sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
              >
                {sheets.map((sheet, index) => (
                  <Tab
                    key={`${sheet.name}-${index}`}
                    label={`${sheet.name || `Sheet ${index + 1}`} (${sheet.rows?.length ?? 0})`}
                  />
                ))}
              </Tabs>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {activeSheet.name || 'Sheet'} · {activeSheet.headers?.length ?? 0} columns ·{' '}
                {activeSheet.rows?.length ?? 0} rows
              </Typography>
            )}
            <SheetTable sheet={activeSheet} />
          </CardContent>
        </Card>
      ) : null}

      {!pods.length &&
      !members.length &&
      !createdNames.length &&
      !updatedNames.length &&
      !previewPods.length &&
      !previewMembers.length &&
      !activeSheet ? (
        <Card>
          <CardContent>
            <Typography color="text.secondary">
              No row snapshot was saved with this import. The counts above are the record of
              what was committed.
            </Typography>
            <Button
              component={NextLink}
              href={moduleName === 'BDG' ? '/bdg' : '/pods'}
              sx={{ mt: 2 }}
            >
              Open {moduleName === 'BDG' ? 'BDG' : 'PODS'}
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </Box>
  );
}

function Detail({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Box sx={{ minWidth: 140 }}>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.02em' }}
      >
        {label}
      </Typography>
      {typeof value === 'string' ? (
        <Typography sx={{ fontWeight: 600 }}>{value}</Typography>
      ) : (
        <Box sx={{ mt: 0.25 }}>{value}</Box>
      )}
    </Box>
  );
}

function NameList({ label, names }: { label: string; names: string[] }) {
  if (!names.length) return null;
  return (
    <Box sx={{ mb: 1.5 }}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.75 }}>
        {label}
      </Typography>
      <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
        {names.map((name) => (
          <Chip key={name} size="small" label={name} />
        ))}
      </Stack>
    </Box>
  );
}

function RecordTable({
  title,
  records,
  nameKey,
}: {
  title: string;
  records: PreviewRecord[];
  nameKey: string;
}) {
  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Row</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Notes</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {records.map((record, index) => (
                <TableRow key={`${record.row}-${index}`} hover>
                  <TableCell>{record.row ?? index + 1}</TableCell>
                  <TableCell>{formatCell(record.data?.[nameKey])}</TableCell>
                  <TableCell sx={{ textTransform: 'capitalize' }}>
                    {record.action ?? '—'}
                  </TableCell>
                  <TableCell>
                    {record.issues?.length
                      ? record.issues.map((issue) => issue.message).filter(Boolean).join('; ')
                      : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
}

function SheetTable({ sheet }: { sheet: Sheet }) {
  const headers = sheet.headers ?? [];
  const rows = sheet.rows ?? [];
  return (
    <TableContainer
      sx={{
        maxHeight: 480,
        overflow: 'auto',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
      }}
    >
      <Table size="small" stickyHeader sx={{ minWidth: Math.max(640, headers.length * 120) }}>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 700, width: 48 }}>#</TableCell>
            {headers.map((header) => (
              <TableCell key={header} sx={{ fontWeight: 700 }}>
                {header}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={index} hover>
              <TableCell>{index + 1}</TableCell>
              {headers.map((header) => (
                <TableCell key={header}>{formatCell(row[header])}</TableCell>
              ))}
            </TableRow>
          ))}
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={headers.length + 1}>This sheet has no data rows.</TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
