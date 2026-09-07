import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Typography,
  Alert,
} from '@mui/material';
import type { ReactNode } from 'react';

export function KpiCard({
  label,
  value,
  subtitle,
}: {
  label: string;
  value: string | number;
  subtitle?: string;
}) {
  return (
    <Card
      sx={{
        height: '100%',
        borderLeft: '3px solid',
        borderLeftColor: 'primary.main',
      }}
    >
      <CardContent>
        <Typography
          variant="body2"
          color="text.secondary"
          gutterBottom
          sx={{ fontWeight: 600, letterSpacing: '0.02em', textTransform: 'uppercase', fontSize: 11 }}
        >
          {label}
        </Typography>
        <Typography
          variant="h4"
          color="text.primary"
          sx={{ fontWeight: 700, fontSize: { xs: '1.5rem', sm: '2.125rem' }, wordBreak: 'break-word' }}
        >
          {value}
        </Typography>
        {subtitle ? (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
        gap: 2,
      }}
    >
      <CircularProgress size={36} />
      <Typography color="text.secondary">{label}</Typography>
    </Box>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <Box sx={{ py: 6, textAlign: 'center' }}>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      {description ? (
        <Typography color="text.secondary">{description}</Typography>
      ) : null}
    </Box>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <Alert severity="error" sx={{ my: 2 }}>
      {message}
    </Alert>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between',
        alignItems: { xs: 'stretch', sm: 'flex-start' },
        mb: { xs: 2, md: 3 },
        gap: 2,
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography
          variant="h4"
          gutterBottom
          sx={{
            fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' },
            wordBreak: 'break-word',
          }}
        >
          {title}
        </Typography>
        {subtitle ? (
          <Typography color="text.secondary" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
            {subtitle}
          </Typography>
        ) : null}
      </Box>
      {action ? (
        <Box
          sx={{
            width: { xs: '100%', sm: 'auto' },
            flexShrink: 0,
            '& > .MuiStack-root': {
              width: { xs: '100%', sm: 'auto' },
            },
            '& .MuiButton-root': {
              width: { xs: '100%', sm: 'auto' },
            },
          }}
        >
          {action}
        </Box>
      ) : null}
    </Box>
  );
}
