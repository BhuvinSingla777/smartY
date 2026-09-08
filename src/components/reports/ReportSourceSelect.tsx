'use client';

import { ToggleButton, ToggleButtonGroup } from '@mui/material';

export type ReportSource = 'dashboard' | 'pods' | 'bdg';

export function parseReportSource(value: string | null | undefined): ReportSource {
  if (value === 'bdg' || value === 'pods') return value;
  return 'dashboard';
}

export default function ReportSourceSelect({
  value,
  onChange,
}: {
  value: ReportSource;
  onChange: (value: ReportSource) => void;
}) {
  return (
    <ToggleButtonGroup
      exclusive
      size="small"
      value={value}
      onChange={(_, next) => {
        if (next) onChange(next as ReportSource);
      }}
      sx={{ mb: 3 }}
    >
      <ToggleButton value="dashboard" sx={{ px: 2 }}>
        Dashboard
      </ToggleButton>
      <ToggleButton value="pods" sx={{ px: 2 }}>
        PODS
      </ToggleButton>
      <ToggleButton value="bdg" sx={{ px: 2 }}>
        BDG
      </ToggleButton>
    </ToggleButtonGroup>
  );
}
