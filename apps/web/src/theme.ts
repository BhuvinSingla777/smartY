import { createTheme } from '@mui/material/styles';

/** Atlassian / Jira-inspired board theme */
export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0052CC',
      light: '#4C9AFF',
      dark: '#0747A6',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#FFAB00',
      light: '#FFE380',
      dark: '#FF8B00',
      contrastText: '#172B4D',
    },
    background: {
      default: '#F4F5F7',
      paper: '#FFFFFF',
    },
    success: { main: '#36B37E', light: '#ABF5D1', dark: '#00875A' },
    warning: { main: '#FFAB00', light: '#FFF0B3', dark: '#FF8B00' },
    error: { main: '#FF5630', light: '#FFBDAD', dark: '#DE350B' },
    info: { main: '#00B8D9', light: '#B3F5FF', dark: '#00A3BF' },
    text: {
      primary: '#172B4D',
      secondary: '#6B778C',
    },
    divider: '#DFE1E6',
  },
  typography: {
    fontFamily: '"Plus Jakarta Sans", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 700, letterSpacing: '-0.02em', color: '#172B4D' },
    h5: { fontWeight: 700, color: '#172B4D' },
    h6: { fontWeight: 600, color: '#172B4D' },
    subtitle1: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#F4F5F7',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 1px rgba(9, 30, 66, 0.08), 0 0 1px rgba(9, 30, 66, 0.12)',
          border: '1px solid #EBECF0',
          borderRadius: 8,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        elevation1: {
          boxShadow: '0 1px 1px rgba(9, 30, 66, 0.08), 0 0 1px rgba(9, 30, 66, 0.12)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          boxShadow: 'none',
          '&:hover': { boxShadow: 'none' },
        },
        containedPrimary: {
          backgroundColor: '#0052CC',
          '&:hover': { backgroundColor: '#0747A6' },
        },
        containedSecondary: {
          backgroundColor: '#FFAB00',
          color: '#172B4D',
          '&:hover': { backgroundColor: '#FF8B00' },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          fontSize: '0.7rem',
          letterSpacing: '0.02em',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#FFFFFF',
          color: '#172B4D',
          borderBottom: '1px solid #DFE1E6',
          boxShadow: 'none',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            fontWeight: 600,
            color: '#6B778C',
            backgroundColor: '#FAFBFC',
            borderBottom: '2px solid #DFE1E6',
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          backgroundColor: '#FFFFFF',
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#B3BAC5',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#4C9AFF',
            borderWidth: 2,
          },
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          height: 6,
          borderRadius: 3,
          backgroundColor: '#EBECF0',
        },
        bar: {
          borderRadius: 3,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
          boxShadow: '0 8px 16px -4px rgba(9, 30, 66, 0.25)',
        },
        paperFullScreen: {
          borderRadius: 0,
        },
      },
    },
    MuiTablePagination: {
      styleOverrides: {
        root: {
          overflow: 'auto',
        },
        toolbar: {
          flexWrap: 'wrap',
          justifyContent: 'flex-end',
          gap: 4,
          minHeight: '52px !important',
          paddingLeft: 8,
          paddingRight: 8,
        },
        selectLabel: {
          margin: 0,
        },
        displayedRows: {
          margin: 0,
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          '&:last-child': { paddingBottom: 16 },
          '@media (max-width:600px)': {
            padding: 12,
            '&:last-child': { paddingBottom: 12 },
          },
        },
      },
    },
  },
});

/** Chart palette aligned with board accents */
export const CHART_COLORS = [
  '#0052CC',
  '#4C9AFF',
  '#FFAB00',
  '#36B37E',
  '#6554C0',
  '#FF5630',
  '#00B8D9',
];
