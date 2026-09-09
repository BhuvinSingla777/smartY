'use client';

import { useMemo, useState } from 'react';
import NextLink from 'next/link';
import {
  Avatar,
  AvatarGroup,
  Box,
  Button,
  Card,
  Chip,
  IconButton,
  InputAdornment,
  LinearProgress,
  Menu,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import AddIcon from '@mui/icons-material/Add';
import KeyboardDoubleArrowUpIcon from '@mui/icons-material/KeyboardDoubleArrowUp';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import FilterListIcon from '@mui/icons-material/FilterList';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { AVATAR_COLORS } from '@/lib/theme';
import { POD_BRANCHES, POD_DOMAINS, domainOverall, formatPodBranch } from '@/lib/shared';

export type BoardColumnId = 'todo' | 'progress' | 'review' | 'done';

const COLUMNS: Array<{
  id: BoardColumnId;
  title: string;
  dot: string;
  match: (status: string) => boolean;
}> = [
  {
    id: 'todo',
    title: 'To Do',
    dot: '#4C9AFF',
    match: (s) => /not started|todo|to do|new|^$/.test(s),
  },
  {
    id: 'progress',
    title: 'In Progress',
    dot: '#FFAB00',
    match: (s) => /progress|dev|active/.test(s),
  },
  {
    id: 'review',
    title: 'Review',
    dot: '#E774BB',
    match: (s) => /review|test|qa|hold|blocked/.test(s),
  },
  {
    id: 'done',
    title: 'Done',
    dot: '#36B37E',
    match: (s) => /complete|done|closed/.test(s),
  },
];

const TAG_STYLES = [
  { bg: '#EAE6FF', color: '#403294' },
  { bg: '#FFF0B3', color: '#FF8B00' },
  { bg: '#FCE4EC', color: '#C2185B' },
  { bg: '#E3FCEF', color: '#006644' },
  { bg: '#DEEBFF', color: '#0747A6' },
  { bg: '#E6FCFF', color: '#008DA6' },
];

function columnForStatus(status: string): BoardColumnId {
  const s = status.trim().toLowerCase();
  if (COLUMNS.find((c) => c.id === 'review')?.match(s)) return 'review';
  if (COLUMNS.find((c) => c.id === 'done')?.match(s)) return 'done';
  if (COLUMNS.find((c) => c.id === 'progress')?.match(s)) return 'progress';
  return 'todo';
}

function initials(name: string) {
  return name
    .split(/[\s,/&+]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function peopleFrom(value: unknown) {
  return String(value ?? '')
    .split(/[,;/|]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function progressCopy(overall: number) {
  if (overall <= 0) return { label: 'Not started yet', color: '#C1C7D0' };
  if (overall >= 100) return { label: 'Task finished', color: '#36B37E' };
  return { label: `${Math.round(overall)}% completed`, color: overall >= 50 ? '#FF8B00' : '#4C9AFF' };
}

function formatShortDate(value: string) {
  const d = new Date(`${value}T00:00:00`);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function truncateWords(text: string, maxWords = 6) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return text.trim();
  return `${words.slice(0, maxWords).join(' ')}...`;
}

function categoryTag(pod: Record<string, unknown>) {
  const machine = String(pod.machineAlignedToProject ?? '').trim();
  const fe = Number(pod.feCompletion ?? 0);
  const be = Number(pod.beCompletion ?? 0);
  const integ = Number(pod.integrationCompletion ?? 0);
  const label = machine
    ? machine.toUpperCase().slice(0, 16)
    : fe >= be && fe >= integ
      ? 'FRONTEND'
      : be >= integ
        ? 'BACKEND'
        : 'INTEGRATION';
  const hash = [...label].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return { label, ...TAG_STYLES[hash % TAG_STYLES.length] };
}

export function PodIssueCard({
  pod,
  onEdit,
}: {
  pod: Record<string, unknown>;
  onEdit: (pod: Record<string, unknown>) => void;
}) {
  const overall = Number(pod.overallCompletion ?? 0);
  const progress = progressCopy(overall);
  const people = [...peopleFrom(pod.developers), ...peopleFrom(pod.machineOwner)].slice(0, 4);
  const tag = categoryTag(pod);
  const branch = formatPodBranch(typeof pod.branch === 'string' ? pod.branch : null);
  const fullDescription = String(pod.description ?? '').trim();
  const shortDescription = fullDescription ? truncateWords(fullDescription, 6) : 'No description';

  return (
    <Card
      sx={{
        p: 1,
        mb: 0.75,
        borderRadius: 2,
        boxShadow: '0 1px 3px rgba(9, 30, 66, 0.13)',
        '&:hover': { boxShadow: '0 8px 16px -4px rgba(9, 30, 66, 0.18)' },
      }}
    >
      <Stack direction="row" alignItems="center" sx={{ mb: 0.5 }} spacing={0.5}>
        <Chip
          size="small"
          label={tag.label}
          sx={{
            height: 20,
            bgcolor: tag.bg,
            color: tag.color,
            fontWeight: 800,
            letterSpacing: '0.04em',
            '& .MuiChip-label': { px: 0.75, fontSize: 10 },
          }}
        />
        <Chip
          size="small"
          label={branch}
          sx={{
            height: 20,
            bgcolor: '#DEEBFF',
            color: '#0747A6',
            fontWeight: 700,
            '& .MuiChip-label': { px: 0.75, fontSize: 10 },
          }}
        />
        <Box sx={{ flexGrow: 1 }} />
        <IconButton size="small" onClick={() => onEdit(pod)} aria-label={`Edit ${String(pod.name)}`} sx={{ p: 0.25 }}>
          <MoreHorizIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Stack>

      <Typography
        component={NextLink}
        href={`/pods/${pod.id}`}
        fontWeight={700}
        sx={{
          color: 'text.primary',
          textDecoration: 'none',
          display: 'block',
          mb: 0.25,
          fontSize: 13,
          lineHeight: 1.3,
          '&:hover': { color: 'primary.main' },
        }}
      >
        {String(pod.name)}
      </Typography>
      <Tooltip title={fullDescription && shortDescription !== fullDescription ? fullDescription : ''} arrow>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 0.75,
            fontSize: 12,
            lineHeight: 1.3,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {shortDescription}
        </Typography>
      </Tooltip>

      <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ fontSize: 11 }}>
        {progress.label}
      </Typography>
      <LinearProgress
        variant="determinate"
        value={Math.max(0, Math.min(100, overall))}
        sx={{
          mt: 0.5,
          mb: 0.75,
          height: 4,
          '& .MuiLinearProgress-bar': { bgcolor: progress.color },
        }}
      />
      <Stack direction="row" spacing={0.5} sx={{ mb: 0.75, flexWrap: 'wrap' }}>
        {POD_DOMAINS.map((domain) => {
          const value = domainOverall(pod.domainCompletions, domain.id);
          return (
            <Chip
              key={domain.id}
              size="small"
              label={`${domain.label} ${value == null ? '—' : `${value}%`}`}
              sx={{
                height: 18,
                bgcolor: '#F4F5F7',
                color: '#42526E',
                fontWeight: 600,
                '& .MuiChip-label': { px: 0.6, fontSize: 9 },
              }}
            />
          );
        })}
      </Stack>

      <Stack direction="row" alignItems="center" justifyContent="space-between">
        {overall >= 100 ? (
          <CheckCircleIcon sx={{ color: '#36B37E', fontSize: 16 }} />
        ) : overall < 40 ? (
          <KeyboardDoubleArrowUpIcon sx={{ color: '#FF5630', fontSize: 16 }} />
        ) : (
          <KeyboardArrowUpIcon sx={{ color: '#36B37E', fontSize: 16 }} />
        )}
        <AvatarGroup
          max={4}
          sx={{
            '& .MuiAvatar-root': { width: 20, height: 20, fontSize: 9, fontWeight: 700, borderWidth: 1 },
          }}
        >
          {people.length
            ? people.map((person, index) => (
                <Tooltip key={`${person}-${index}`} title={person}>
                  <Avatar sx={{ bgcolor: AVATAR_COLORS[index % AVATAR_COLORS.length] }}>
                    {initials(person)}
                  </Avatar>
                </Tooltip>
              ))
            : [
                <Avatar key="fallback" sx={{ bgcolor: '#DFE1E6', color: '#5E6C84' }}>
                  {initials(String(pod.name))}
                </Avatar>,
              ]}
        </AvatarGroup>
      </Stack>
    </Card>
  );
}

export function PodTimeline({ pods }: { pods: Array<Record<string, unknown>> }) {
  const [offset, setOffset] = useState(0);
  const pageSize = 7;
  const markers = useMemo(
    () =>
      pods
        .map((pod) => {
          const raw = pod.startDate ? String(pod.startDate).slice(0, 10) : '';
          return raw
            ? {
                id: String(pod.id),
                name: String(pod.name),
                date: raw,
                overall: Number(pod.overallCompletion ?? 0),
                column: columnForStatus(String(pod.status ?? '')),
              }
            : null;
        })
        .filter((item): item is NonNullable<typeof item> => Boolean(item))
        .sort((a, b) => a.date.localeCompare(b.date)),
    [pods],
  );

  const uniqueDates = [...new Set(markers.map((m) => m.date))];
  const colors: Record<BoardColumnId, string> = {
    todo: '#4C9AFF',
    progress: '#FFAB00',
    review: '#E774BB',
    done: '#36B37E',
  };
  const page = uniqueDates.slice(offset, offset + pageSize);

  if (uniqueDates.length === 0) return null;

  return (
    <Box
      sx={{
        bgcolor: '#fff',
        borderRadius: 3,
        px: 1.5,
        py: 1.25,
        mb: 1.5,
        flexShrink: 0,
        boxShadow: '0 1px 1px rgba(9, 30, 66, 0.13)',
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
      }}
    >
      <IconButton
        size="small"
        disabled={offset === 0}
        onClick={() => setOffset((v) => Math.max(0, v - pageSize))}
      >
        <ChevronLeftIcon />
      </IconButton>
      <Box sx={{ position: 'relative', flexGrow: 1, pt: 2.5, pb: 0.5, overflow: 'hidden' }}>
        <Box
          sx={{
            position: 'absolute',
            left: 12,
            right: 12,
            top: 36,
            height: 3,
            borderRadius: 2,
            bgcolor: '#EBECF0',
          }}
        />
        <Stack direction="row" justifyContent="space-between" sx={{ position: 'relative' }}>
          {page.map((date) => {
            const onDate = markers.filter((m) => m.date === date);
            const first = onDate[0];
            return (
              <Box key={date} sx={{ textAlign: 'center', minWidth: 64, px: 0.5 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.25 }}>
                  {formatShortDate(date)}
                </Typography>
                <Tooltip
                  arrow
                  title={
                    <Box sx={{ p: 0.5, minWidth: 160 }}>
                      {onDate.map((m) => (
                        <Box key={m.id} sx={{ mb: 1 }}>
                          <Typography variant="caption" display="block" fontWeight={700}>
                            {m.name}
                          </Typography>
                          <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>
                            {Math.round(m.overall)}% completed
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={Math.max(0, Math.min(100, m.overall))}
                            sx={{ height: 4, bgcolor: 'rgba(255,255,255,0.3)' }}
                          />
                        </Box>
                      ))}
                    </Box>
                  }
                >
                  <Box
                    sx={{
                      width: 16,
                      height: 16,
                      mx: 'auto',
                      borderRadius: '50%',
                      bgcolor: colors[first.column],
                      border: '2px solid #fff',
                      boxShadow: '0 0 0 2px #DFE1E6',
                      cursor: 'pointer',
                    }}
                  />
                </Tooltip>
              </Box>
            );
          })}
        </Stack>
      </Box>
      <IconButton
        size="small"
        disabled={offset + pageSize >= uniqueDates.length}
        onClick={() => setOffset((v) => v + pageSize)}
      >
        <ChevronRightIcon />
      </IconButton>
    </Box>
  );
}

export default function PodBoard({
  pods,
  search,
  onSearch,
  statusFilter,
  onStatusFilter,
  statusOptions,
  branchFilter,
  onBranchFilter,
  onAdd,
  onEdit,
  onExport,
  onShowReports,
  savedQueries = [],
  onSaveQuery,
  onApplyQuery,
  onDeleteQuery,
}: {
  pods: Array<Record<string, unknown>>;
  search: string;
  onSearch: (value: string) => void;
  statusFilter: string;
  onStatusFilter: (value: string) => void;
  statusOptions: string[];
  branchFilter: string;
  onBranchFilter: (value: string) => void;
  onAdd: () => void;
  onEdit: (pod: Record<string, unknown>) => void;
  onExport: () => void;
  onShowReports?: () => void;
  savedQueries?: Array<{ id: string; name: string; search: string; status: string }>;
  onSaveQuery?: () => void;
  onApplyQuery?: (query: { search: string; status: string }) => void;
  onDeleteQuery?: (id: string) => void;
}) {
  const [filterAnchor, setFilterAnchor] = useState<null | HTMLElement>(null);
  const [moreAnchor, setMoreAnchor] = useState<null | HTMLElement>(null);
  const [savedAnchor, setSavedAnchor] = useState<null | HTMLElement>(null);
  const q = search.trim().toLowerCase();
  const filtered = pods.filter((pod) => {
    const name = String(pod.name ?? '').toLowerCase();
    const status = String(pod.status ?? '');
    const matchesSearch =
      !q || name.includes(q) || String(pod.description ?? '').toLowerCase().includes(q);
    const matchesStatus = !statusFilter || status === statusFilter;
    const podBranch = String(pod.branch ?? '').toLowerCase();
    const matchesBranch =
      !branchFilter ||
      (branchFilter === 'unassigned' ? !podBranch : podBranch === branchFilter);
    return matchesSearch && matchesStatus && matchesBranch;
  });

  const grouped = COLUMNS.map((column) => ({
    ...column,
    items: filtered.filter((pod) => columnForStatus(String(pod.status ?? '')) === column.id),
  }));

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: { xs: 'calc(100dvh - 96px)', md: 'calc(100dvh - 48px)' },
        minHeight: 0,
        overflow: 'hidden',
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ sm: 'center' }}
        spacing={1.5}
        sx={{ mb: 1.5, flexShrink: 0 }}
      >
        <Typography variant="h4" sx={{ mb: 0, fontSize: 28 }}>
          Board
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            onClick={onExport}
            sx={{ borderRadius: 5, px: 2, bgcolor: '#fff' }}
          >
            Release
          </Button>
          <IconButton onClick={(e) => setMoreAnchor(e.currentTarget)} aria-label="More actions">
            <MoreHorizIcon />
          </IconButton>
          <Menu anchorEl={moreAnchor} open={Boolean(moreAnchor)} onClose={() => setMoreAnchor(null)}>
            {onShowReports ? (
              <MenuItem
                onClick={() => {
                  setMoreAnchor(null);
                  onShowReports();
                }}
              >
                Reports
              </MenuItem>
            ) : null}
            <MenuItem
              onClick={() => {
                setMoreAnchor(null);
                onExport();
              }}
            >
              Export Excel
            </MenuItem>
          </Menu>
        </Stack>
      </Stack>

      <PodTimeline pods={filtered} />

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 1.5, flexShrink: 0 }}>
        <TextField
          size="small"
          placeholder="Search"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          sx={{
            width: { xs: '100%', sm: 280 },
            '& .MuiOutlinedInput-root': {
              borderRadius: 5,
              bgcolor: '#fff',
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            ),
          }}
        />
        <Button
          variant="outlined"
          startIcon={<FilterListIcon />}
          onClick={(e) => setFilterAnchor(e.currentTarget)}
          sx={{ borderRadius: 5, bgcolor: '#fff', color: 'text.secondary' }}
        >
          {statusFilter || 'Quick Filters'}
        </Button>
        <Menu
          anchorEl={filterAnchor}
          open={Boolean(filterAnchor)}
          onClose={() => setFilterAnchor(null)}
        >
          <MenuItem
            onClick={() => {
              onStatusFilter('');
              setFilterAnchor(null);
            }}
          >
            All PODs
          </MenuItem>
          {statusOptions.map((status) => (
            <MenuItem
              key={status}
              selected={statusFilter === status}
              onClick={() => {
                onStatusFilter(status);
                setFilterAnchor(null);
              }}
            >
              {status}
            </MenuItem>
          ))}
        </Menu>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={branchFilter || 'all'}
          onChange={(_, value) => {
            if (value == null) return;
            onBranchFilter(value === 'all' ? '' : String(value));
          }}
          sx={{ bgcolor: '#fff', borderRadius: 5 }}
        >
          <ToggleButton value="all" sx={{ px: 1.5, borderRadius: 5 }}>
            All
          </ToggleButton>
          {POD_BRANCHES.map((branch) => (
            <ToggleButton key={branch} value={branch} sx={{ px: 1.5 }}>
              {formatPodBranch(branch)}
            </ToggleButton>
          ))}
          <ToggleButton value="unassigned" sx={{ px: 1.5 }}>
            Unassigned
          </ToggleButton>
        </ToggleButtonGroup>
        {onSaveQuery ? (
          <Button
            variant="contained"
            startIcon={<BookmarkBorderIcon />}
            onClick={onSaveQuery}
            sx={{ borderRadius: 5 }}
          >
            Save query
          </Button>
        ) : null}
        {onApplyQuery ? (
          <>
            <Button
              variant="outlined"
              onClick={(e) => setSavedAnchor(e.currentTarget)}
              sx={{ borderRadius: 5, bgcolor: '#fff', color: 'text.secondary' }}
            >
              Saved queries{savedQueries.length ? ` (${savedQueries.length})` : ''}
            </Button>
            <Menu
              anchorEl={savedAnchor}
              open={Boolean(savedAnchor)}
              onClose={() => setSavedAnchor(null)}
            >
              {savedQueries.length === 0 ? (
                <MenuItem disabled>No saved queries yet</MenuItem>
              ) : (
                savedQueries.map((item) => (
                  <MenuItem
                    key={item.id}
                    onClick={() => {
                      onApplyQuery({ search: item.search, status: item.status });
                      setSavedAnchor(null);
                    }}
                  >
                    <Box sx={{ flexGrow: 1, minWidth: 160 }}>
                      <Typography variant="body2" fontWeight={600}>
                        {item.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.search || 'Any text'}
                        {item.status ? ` · ${item.status}` : ' · All statuses'}
                      </Typography>
                    </Box>
                    {onDeleteQuery ? (
                      <IconButton
                        size="small"
                        aria-label={`Delete ${item.name}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteQuery(item.id);
                        }}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    ) : null}
                  </MenuItem>
                ))
              )}
            </Menu>
          </>
        ) : null}
      </Stack>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(4, minmax(0, 1fr))' },
          gap: 1.5,
          alignItems: 'stretch',
          flex: 1,
          minHeight: 0,
          overflow: { xs: 'auto', md: 'hidden' },
        }}
      >
        {grouped.map((column) => (
          <Box
            key={column.id}
            sx={{
              bgcolor: '#EBECF0',
              borderRadius: 2.5,
              p: 1,
              height: { xs: 360, md: '100%' },
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1} sx={{ px: 0.5, mb: 0.75, flexShrink: 0 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: column.dot }} />
              <Typography variant="subtitle2" fontWeight={700}>
                {column.title} ({column.items.length})
              </Typography>
              <Box sx={{ flexGrow: 1 }} />
              <IconButton size="small" sx={{ p: 0.25 }}>
                <MoreHorizIcon fontSize="small" />
              </IconButton>
            </Stack>

            {column.id === 'todo' ? (
              <Button
                fullWidth
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={onAdd}
                sx={{
                  mb: 0.75,
                  flexShrink: 0,
                  borderStyle: 'dashed',
                  borderRadius: 2,
                  bgcolor: '#fff',
                  color: 'text.secondary',
                  py: 0.5,
                }}
              >
                Add Task
              </Button>
            ) : null}

            <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', pr: 0.25 }}>
              {column.items.map((pod) => (
                <PodIssueCard key={String(pod.id)} pod={pod} onEdit={onEdit} />
              ))}
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
