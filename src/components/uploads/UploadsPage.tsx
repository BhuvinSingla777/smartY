'use client';

import { useCallback, useMemo, useState } from 'react';
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
import { importsApi, podsApi } from '@/lib/endpoints';
import { PageHeader, ErrorState } from '@/components/common/Common';
import { POD_BRANCHES, formatPodBranch } from '@/lib/shared';
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
  if (/status|date|dev|owner/i.test(header)) return 140;
  return 160;
}

export default function UploadsPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');
  const [sheets, setSheets] = useState<ExtractedSheet[]>([]);
  const [sheetIndex, setSheetIndex] = useState(0);
  const [parseWarnings, setParseWarnings] = useState<string[]>([]);
  const [defaultBranch, setDefaultBranch] = useState('');
  const [saveResult, setSaveResult] = useState<{
    summary: string;
    created: Array<{ id: string; name: string }>;
    updated: Array<{ id: string; name: string }>;
  } | null>(null);

  const activeSheet = sheets[sheetIndex] ?? null;
  const columnCount = activeSheet?.headers.length ?? 0;
  const rowCount = activeSheet?.rows.length ?? 0;

  const extractAndSave = useCallback(
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
        setSheets(extracted);
        setSheetIndex(suggested);
        setFileName(result.fileName ?? nextFile.name);
        setParseWarnings(result.parseWarnings ?? result.preview?.parseWarnings ?? []);

        const infoSheet =
          extracted.find((s) => /^info$/i.test(s.name.trim())) ?? extracted[suggested] ?? extracted[0];
        if (!infoSheet?.rows.length) {
          throw new Error('The Info sheet has no POD rows to save.');
        }

        setStatus('Saving to database…');
        const saved = await podsApi.createFromSheet(
          {
            name: infoSheet.name,
            headers: infoSheet.headers,
            rows: infoSheet.rows,
          },
          undefined,
          extracted,
          defaultBranch || null,
        );
        setSaveResult({
          summary: saved.summary,
          created: saved.created ?? [],
          updated: saved.updated ?? [],
        });
        setStatus('');
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed');
        setStatus('');
      } finally {
        setBusy(false);
      }
    },
    [router, defaultBranch],
  );

  const applyFile = (next: File | null) => {
    setFile(next);
    if (next) {
      void extractAndSave(next);
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

  return (
    <Box>
      <PageHeader
        title="Backlog"
        subtitle="Drop PODS.xlsx. A clean extract updates this view and writes the same rows to the database."
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
                Info + Daily Update. Add a Branch column (sdm, sdd, or sdn) or choose a
                default branch above. A successful extract writes PODs and daily history to
                the database automatically.
              </Typography>
              <Button variant="outlined" component="label" disabled={busy}>
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
          Database updated: {saveResult.summary}.{' '}
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
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6">{fileName}</Typography>
              <Typography variant="body2" color="text.secondary">
                {columnCount} columns · {rowCount} rows on “{activeSheet.name}”
                {saveResult ? ' · saved to database' : ''}
              </Typography>
            </Box>

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
                  minWidth: Math.max(960, activeSheet.headers.length * 140),
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
                  {activeSheet.rows.map((row, index) => (
                    <TableRow key={index} hover>
                      <TableCell sx={{ width: 48, verticalAlign: 'top' }}>{index + 1}</TableCell>
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
                  ))}
                  {rowCount === 0 ? (
                    <TableRow>
                      <TableCell colSpan={activeSheet.headers.length + 1}>
                        This sheet has headers but no data rows.
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </TableContainer>

            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
              Info rows become PODs. Daily Update dates are stored as POD history.{' '}
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
