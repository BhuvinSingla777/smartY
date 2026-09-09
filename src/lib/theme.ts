import { createTheme } from '@mui/material/styles';

const CYAN = {
  50: '#F3FCFD',
  100: '#E6F7FA',
  200: '#D4F1F4',
  300: '#B7E6EC',
  400: '#7ED4DE',
  500: '#3BB8C5',
  600: '#1F8A96',
  700: '#0F5E68',
  800: '#0A454C',
};

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: CYAN[600],
      light: CYAN[400],
      dark: CYAN[700],
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#7BC9C4',
      light: '#C8EDE9',
      dark: '#3A8F8A',
      contrastText: CYAN[800],
    },
    background: {
      default: CYAN[50],
      paper: '#FFFFFF',
    },
    success: { main: '#5BB89A', light: '#D4F3E8', dark: '#2E7A64' },
    warning: { main: '#E0B15A', light: '#FFF3D6', dark: '#B8862A' },
    error: { main: '#E07A6A', light: '#FFD8D1', dark: '#B55244' },
    info: { main: CYAN[500], light: CYAN[200], dark: CYAN[700] },
    text: {
      primary: CYAN[800],
      secondary: '#4A6B70',
    },
    divider: CYAN[300],
  },
  typography: {
    fontFamily: '"Inter", "Helvetica Neue", Helvetica, Arial, sans-serif',
    h4: { fontWeight: 700, letterSpacing: '-0.02em', fontSize: '1.5rem', color: CYAN[800] },
    h5: { fontWeight: 700, color: CYAN[800] },
    h6: { fontWeight: 600, fontSize: '0.95rem', color: CYAN[800] },
    subtitle1: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 500 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: CYAN[50],
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          border: `1px solid ${CYAN[300]}`,
          borderRadius: 16,
          backgroundColor: '#FFFFFF',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        elevation1: {
          boxShadow: 'none',
          border: `1px solid ${CYAN[300]}`,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          boxShadow: 'none',
          '&:hover': { boxShadow: 'none' },
        },
        containedPrimary: {
          backgroundColor: CYAN[600],
          '&:hover': { backgroundColor: CYAN[700] },
        },
        outlined: {
          borderColor: CYAN[300],
          color: CYAN[700],
          '&:hover': { borderColor: CYAN[400], backgroundColor: CYAN[100] },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          fontSize: '0.7rem',
          letterSpacing: '0.02em',
          height: 24,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: CYAN[100],
          color: CYAN[800],
          borderBottom: `1px solid ${CYAN[300]}`,
          boxShadow: 'none',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            fontWeight: 600,
            color: CYAN[700],
            backgroundColor: CYAN[100],
            borderBottom: `1px solid ${CYAN[300]}`,
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          backgroundColor: '#FFFFFF',
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: CYAN[400],
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: CYAN[600],
            borderWidth: 2,
          },
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          height: 8,
          borderRadius: 8,
          backgroundColor: CYAN[200],
        },
        bar: {
          borderRadius: 8,
          backgroundColor: CYAN[500],
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderColor: CYAN[300],
          color: CYAN[700],
          '&.Mui-selected': {
            backgroundColor: CYAN[200],
            color: CYAN[800],
            '&:hover': { backgroundColor: CYAN[300] },
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          boxShadow: '0 12px 32px rgba(15, 94, 104, 0.12)',
        },
      },
    },
  },
});

export const CHART_COLORS = [
  CYAN[500],
  '#6B8AA8',
  CYAN[400],
  '#5BB89A',
  '#7BC9C4',
  CYAN[600],
  '#8EC5D6',
];

export const CHART_INBOUND = CYAN[500];
export const CHART_OUTBOUND = '#6B8AA8';

export const DRAWER_WIDTH = 248;
export const SIDEBAR_BG = CYAN[100];
export const SIDEBAR_BG_END = CYAN[200];
export const AVATAR_COLORS = [CYAN[600], '#5BB89A', '#7BC9C4', '#8EC5D6', CYAN[500], '#E0B15A'];
