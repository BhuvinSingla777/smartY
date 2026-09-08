'use client';

import { MenuItem, TextField } from '@mui/material';

export type ReportSource = 'pods' | 'bdg';

export function parseReportSource(value: string | null | undefined): ReportSource {
  return value === 'bdg' ? 'bdg' : 'pods';
}

export default function ReportSourceSelect({
  value,
  onChange,
}: {
  value: ReportSource;
  onChange: (value: ReportSource) => void;
}) {
  return (
    <TextField
      select
      label="Show data for"
      size="small"
      value={value}
      onChange={(e) => onChange(parseReportSource(e.target.value))}
      sx={{ minWidth: 220, mb: 3 }}
    >
      <MenuItem value="pods">PODS</MenuItem>
      <MenuItem value="bdg">BDG</MenuItem>
    </TextField>
  );
}
