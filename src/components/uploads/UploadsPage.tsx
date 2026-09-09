'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import NextLink from 'next/link';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  InputLabel,
  Link,
  MenuItem,
  Select,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tooltip,
  Typography,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import MergeTypeIcon from '@mui/icons-material/MergeType';
import { importsApi, podsApi } from '@/lib/endpoints';
import { PageHeader, ErrorState } from '@/components/common/Common';
import { POD_BRANCHES, formatPodBranch, normalizeKey } from '@/lib/shared';
import { stampBranchOnSheet } from '@/lib/transforms/sheet-extract';

type ExtractedSheet = {
  name: string;
  headers: string[];
  rows: Record<string, unknown>[];
};

function formatCell(value: unknown) {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'number') {
    return Number.isInteger(value) ? String(value) : String(Math.round(value * 100) / 100);
  }
  return String(value);
}

function isNumericLike(value: unknown) {
  return typeof value === 'number';
}

function isDescriptionHeader(header: string) {
  return /description|desc|notes|comment|detail/i.test(header);
}

function columnWidth(header: string, numeric: boolean) {
  if (isDescriptionHeader(header)) return 320;
  if (/pod name|name/i.test(header)) return 160;
  if (numeric) return 88;
  if (/status|date|dev|owner|branch/i.test(header)) return 140;
  return 160;
}

function detectPodNameHeader(headers: string[]) {
  return (
    headers.find((h) => /pod\s*name/i.test(h)) ??
    headers.find((h) => /^name$/i.test(h.trim())) ??
    headers[0] ??
    null
  );
}

function pickInfoSheet(sheets: ExtractedSheet[], suggestedIndex: number) {
  return (
    sheets.find((s) => /^info$/i.test(s.name.trim())) ??
    sheets.find((s) => s.headers.some((h) => /pod name/i.test(h))) ??
    sheets[suggestedIndex] ??
    sheets[0] ??
    null
  );
}

export default function UploadsPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [merging, setMerging] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');
  const [sheets, setSheets] = useState<ExtractedSheet[]>([]);
  const [sheetIndex, setSheetIndex] = useState(0);
  const [parseWarnings, setParseWarnings] = useState<string[]>([]);
  const [defaultBranch, setDefaultBranch] = useState('');
  const [existingNames, setExistingNames] = useState<Set<string>>(new Set());
  const [saveResult, setSaveResult] = useState<{
    summary: string;
    created: Array<{ id: string; name: string }>;
    updated: Array<{ id: string; name: string }>;
  } | null>(null);

  const activeSheet = sheets[sheetIndex] ?? null;
  const columnCount = activeSheet?.headers.length ?? 0;
  const rowCount = activeSheet?.rows.length ?? 0;

  const infoSheet = useMemo(
    () => pickInfoSheet(sheets, sheetIndex),
    [sheets, sheetIndex],
  );

  const mergePlan = useMemo(() => {
    if (!infoSheet) {
      return { create: [] as string[], update: [] as string[], total: 0 };
    }
    const nameHeader = detectPodNameHeader(infoSheet.headers);
    if (!nameHeader) {
      return { create: [] as string[], update: [] as string[], total: 0 };
    }
    const create: string[] = [];
    const update: string[] = [];
    const seen = new Set<string>();
    for (const row of infoSheet.rows) {
      const name = String(row[nameHeader] ?? '').trim();
      if (!name) continue;
      const key = normalizeKey(name);
      if (seen.has(key)) continue;
      seen.add(key);
      if (existingNames.has(key)) update.push(name);
      else create.push(name);
    }
    return { create, update, total: create.length + update.length };
  }, [infoSheet, existingNames]);

  const refreshExistingNames = useCallback(async () => {
    try {
      const result = await podsApi.list({ page: 1, pageSize: 5000 });
      const names = new Set<string>(
        (result.data ?? []).map((pod: { name?: string }) =>
          normalizeKey(String(pod.name ?? '')),
        ),
      );
      setExistingNames(names);
    } catch {
      setExistingNames(new Set());
    }
  }, []);

  useEffect(() => {
    void refreshExistingNames();
  }, [refreshExistingNames]);

  const extractPreview = useCallback(
    async (nextFile: File) => {
      setBusy(true);
      setError('');
      setSaveResult(null);
      setStatus('Extracting columns…');
      try {
        const result = await importsApi.preview(nextFile, 'PODS');
        const extracted: ExtractedSheet[] = (result.sheets ?? result.preview?.sheets ?? []).map(
          (sheet: ExtractedSheet) => {
            const parsed = {
              name: sheet.name,
              headers: sheet.headers ?? [],
              rows: sheet.rows ?? [],
            };
            return /info/i.test(parsed.name) ||
              parsed.headers.some((h) => /pod name/i.test(h))
              ? stampBranchOnSheet(parsed, defaultBranch || null)
              : parsed;
          },
        );
        if (extracted.length === 0) {
          throw new Error('No columns or rows were found in the uploaded sheet.');
        }

        const suggested = Math.min(
          Number(result.suggestedSheetIndex ?? result.preview?.suggestedSheetIndex ?? 0),
          extracted.length - 1,
        );
        const info =
          pickInfoSheet(extracted, suggested);
        if (!info?.rows.length) {
          throw new Error('The Info sheet has no POD rows to review.');
        }

        setSheets(extracted);
        setSheetIndex(
          Math.max(
            0,
            extracted.findIndex((s) => s === info),
          ),
        );
        setFileName(result.fileName ?? nextFile.name);
        setParseWarnings(result.parseWarnings ?? result.preview?.parseWarnings ?? []);
        setStatus('');
        await refreshExistingNames();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed');
        setStatus('');
      } finally {
        setBusy(false);
      }
    },
    [defaultBranch, refreshExistingNames],
  );

  const mergeIntoPods = useCallback(async () => {
    if (!infoSheet?.rows.length) {
      setError('No Info sheet rows available to merge.');
      return;
    }
    setMerging(true);
    setError('');
    setSaveResult(null);
    setStatus('Merging into current PODS list…');
    try {
      const stamped = stampBranchOnSheet(infoSheet, defaultBranch || null);
      const saved = await podsApi.createFromSheet(
        {
          name: stamped.name,
          headers: stamped.headers,
          rows: stamped.rows,
        },
        undefined,
        sheets.map((sheet) =>
          /info/i.test(sheet.name) || sheet.headers.some((h) => /pod name/i.test(h))
            ? stampBranchOnSheet(sheet, defaultBranch || null)
            : sheet,
        ),
        defaultBranch || null,
        fileName || file?.name || null,
      );
      setSaveResult({
        summary: saved.summary,
        created: saved.created ?? [],
        updated: saved.updated ?? [],
      });
      setStatus('');
      await refreshExistingNames();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Merge failed');
      setStatus('');
    } finally {
      setMerging(false);
    }
  }, [
    infoSheet,
    defaultBranch,
    sheets,
    fileName,
    file,
    refreshExistingNames,
    router,
  ]);

  const applyFile = (next: File | null) => {
    setFile(next);
    if (next) {
      void extractPreview(next);
    } else {
      setSheets([]);
      setFileName('');
      setSaveResult(null);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const next = e.dataTransfer.files?.[0];
    if (next) applyFile(next);
  };

  const numericHeaders = useMemo(() => {
    if (!activeSheet) return new Set<string>();
    const set = new Set<string>();
    for (const header of activeSheet.headers) {
      const sample = activeSheet.rows.find((row) => isNumericLike(row[header]));
      if (sample) set.add(header);
    }
    return set;
  }, [activeSheet]);

  const nameHeader = activeSheet ? detectPodNameHeader(activeSheet.headers) : null;

  return (
    <Box>
      <PageHeader
        title="Import"
        subtitle="Upload a PODS workbook, review the table, then merge into your current PODS list."
      />

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack spacing={2}>
            <FormControl size="small" sx={{ maxWidth: 280 }}>
              <InputLabel id="default-branch-label">Default branch</InputLabel>
              <Select
                labelId="default-branch-label"
                label="Default branch"
                value={defaultBranch}
                onChange={(e) => setDefaultBranch(String(e.target.value))}
              >
                <MenuItem value="">Infer from sheet (sdm / sdd / sdn)</MenuItem>
                {POD_BRANCHES.map((branch) => (
                  <MenuItem key={branch} value={branch}>
                    {formatPodBranch(branch)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Box
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              sx={{
                border: '2px dashed',
                borderColor: dragOver ? 'primary.main' : 'divider',
                borderRadius: 2,
                p: 4,
                textAlign: 'center',
                bgcolor: dragOver ? 'rgba(0,82,204,0.06)' : 'background.paper',
              }}
            >
              <CloudUploadIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography gutterBottom>
                Drag and drop PODS.xlsx here, or choose a file
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Info + Daily Update. Review the extracted table first, then use Merge to
                update matching PODs (by name) and add new ones.
              </Typography>
              <Button variant="outlined" component="label" disabled={busy || merging}>
                Choose file
                <input
                  hidden
                  type="file"
                  accept=".csv,.xls,.xlsx,.doc,.docx,.pdf"
                  onChange={(e) => applyFile(e.target.files?.[0] ?? null)}
                />
              </Button>
              {file ? (
                <Typography sx={{ mt: 2 }} fontWeight={600}>
                  Selected: {file.name} ({Math.round(file.size / 1024)} KB)
                  {status ? ` — ${status}` : ''}
                </Typography>
              ) : null}
            </Box>

            {error ? <ErrorState message={error} /> : null}
          </Stack>
        </CardContent>
      </Card>

      {saveResult ? (
        <Alert severity="success" sx={{ mb: 3 }}>
          Merged into PODS: {saveResult.summary}.{' '}
          <Button size="small" onClick={() => router.push('/imports')}>
            Open History
          </Button>
          <Button size="small" onClick={() => router.push('/pods')}>
            Open PODS
          </Button>
          {saveResult.created.concat(saveResult.updated).slice(0, 10).map((pod) => (
            <Chip
              key={pod.id}
              component={NextLink}
              href={`/pods/${pod.id}`}
              clickable
              size="small"
              label={pod.name}
              sx={{ ml: 0.5, mt: 0.5 }}
            />
          ))}
        </Alert>
      ) : null}

      {sheets.length > 0 && activeSheet ? (
        <Card>
          <CardContent sx={{ overflow: 'hidden' }}>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={2}
              justifyContent="space-between"
              alignItems={{ xs: 'stretch', md: 'flex-start' }}
              sx={{ mb: 2 }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="h6">{fileName}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {columnCount} columns · {rowCount} rows on “{activeSheet.name}”
                  {saveResult ? ' · merged into database' : ' · preview only'}
                </Typography>
              </Box>
              <Stack spacing={1} sx={{ minWidth: { md: 320 } }}>
                <Alert severity="info" sx={{ py: 0.5 }}>
                  Merge plan: <strong>{mergePlan.update.length}</strong> update ·{' '}
                  <strong>{mergePlan.create.length}</strong> new
                </Alert>
                <Button
                  variant="contained"
                  startIcon={<MergeTypeIcon />}
                  disabled={busy || merging || mergePlan.total === 0 || Boolean(saveResult)}
                  onClick={() => void mergeIntoPods()}
                >
                  {merging ? 'Merging…' : 'Merge into current PODS list'}
                </Button>
                <Typography variant="caption" color="text.secondary">
                  Matches existing PODs by name, updates status and other sheet fields, and
                  adds any new PODs. Daily Update history is saved too.
                </Typography>
              </Stack>
            </Stack>

            {parseWarnings.length > 0 ? (
              <Alert severity="info" sx={{ mb: 2 }}>
                {parseWarnings.join(' ')}
              </Alert>
            ) : null}

            {sheets.length > 1 ? (
              <Tabs
                value={sheetIndex}
                onChange={(_, value) => setSheetIndex(value)}
                variant="scrollable"
                sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
              >
                {sheets.map((sheet, index) => (
                  <Tab
                    key={`${sheet.name}-${index}`}
                    label={`${sheet.name || `Sheet ${index + 1}`} (${sheet.rows.length})`}
                  />
                ))}
              </Tabs>
            ) : null}

            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
              {activeSheet.headers.map((header) => (
                <Chip key={header} size="small" label={header} variant="outlined" />
              ))}
            </Stack>

            <TableContainer
              sx={{
                maxHeight: 640,
                overflow: 'auto',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
              }}
            >
              <Table
                size="small"
                stickyHeader
                sx={{
                  minWidth: Math.max(960, activeSheet.headers.length * 140 + 100),
                  tableLayout: 'fixed',
                }}
              >
                <TableHead>
                  <TableRow>
                    <TableCell
                      sx={{
                        bgcolor: '#FAFBFC',
                        fontWeight: 700,
                        width: 48,
                        minWidth: 48,
                      }}
                    >
                      #
                    </TableCell>
                    {/info/i.test(activeSheet.name) || nameHeader ? (
                      <TableCell
                        sx={{
                          bgcolor: '#FAFBFC',
                          fontWeight: 700,
                          width: 88,
                          minWidth: 88,
                        }}
                      >
                        Action
                      </TableCell>
                    ) : null}
                    {activeSheet.headers.map((header) => {
                      const numeric = numericHeaders.has(header);
                      const width = columnWidth(header, numeric);
                      return (
                        <TableCell
                          key={header}
                          align={numeric ? 'right' : 'left'}
                          sx={{
                            bgcolor: '#FAFBFC',
                            fontWeight: 700,
                            width,
                            minWidth: width,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                          title={header}
                        >
                          {header}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {activeSheet.rows.map((row, index) => {
                    const podName = nameHeader
                      ? String(row[nameHeader] ?? '').trim()
                      : '';
                    const action =
                      /info/i.test(activeSheet.name) || nameHeader
                        ? podName
                          ? existingNames.has(normalizeKey(podName))
                            ? 'Update'
                            : 'Add'
                          : '—'
                        : null;
                    return (
                      <TableRow key={index} hover>
                        <TableCell sx={{ width: 48, verticalAlign: 'top' }}>
                          {index + 1}
                        </TableCell>
                        {action != null ? (
                          <TableCell sx={{ width: 88, verticalAlign: 'top' }}>
                            {action === '—' ? (
                              '—'
                            ) : (
                              <Chip
                                size="small"
                                label={action}
                                color={action === 'Update' ? 'warning' : 'success'}
                                variant="outlined"
                                sx={{ height: 22, '& .MuiChip-label': { px: 0.75, fontSize: 11 } }}
                              />
                            )}
                          </TableCell>
                        ) : null}
                        {activeSheet.headers.map((header) => {
                          const numeric = numericHeaders.has(header);
                          const text = formatCell(row[header]);
                          const description = isDescriptionHeader(header);
                          const width = columnWidth(header, numeric);
                          return (
                            <TableCell
                              key={header}
                              align={numeric ? 'right' : 'left'}
                              sx={{
                                width,
                                minWidth: width,
                                maxWidth: width,
                                verticalAlign: 'top',
                                overflow: 'hidden',
                                ...(description
                                  ? {
                                      whiteSpace: 'normal',
                                      overflowWrap: 'anywhere',
                                      wordBreak: 'break-word',
                                      display: '-webkit-box',
                                      WebkitLineClamp: 4,
                                      WebkitBoxOrient: 'vertical',
                                    }
                                  : {
                                      whiteSpace: 'nowrap',
                                      textOverflow: 'ellipsis',
                                    }),
                              }}
                            >
                              {description || text === '—' ? (
                                text
                              ) : (
                                <Tooltip title={text} placement="top-start">
                                  <Box
                                    component="span"
                                    sx={{
                                      display: 'block',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                    }}
                                  >
                                    {text}
                                  </Box>
                                </Tooltip>
                              )}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    );
                  })}
                  {rowCount === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={
                          activeSheet.headers.length +
                          1 +
                          (/info/i.test(activeSheet.name) || nameHeader ? 1 : 0)
                        }
                      >
                        This sheet has headers but no data rows.
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </TableContainer>

            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
              After merge, Info rows update/create PODs and Daily Update dates are stored as
              history.{' '}
              <Link component={NextLink} href="/pods">
                View PODS dashboard
              </Link>
            </Typography>
          </CardContent>
        </Card>
      ) : null}
    </Box>
  );
}
