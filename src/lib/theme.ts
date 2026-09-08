import { createTheme } from '@mui/material/styles';

/** Atlassian Jira board theme */
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
      secondary: '#5E6C84',
    },
    divider: '#DFE1E6',
  },
  typography: {
    fontFamily: '"Inter", "Helvetica Neue", Helvetica, Arial, sans-serif',
    h4: { fontWeight: 700, letterSpacing: '-0.02em', fontSize: '1.5rem', color: '#172B4D' },
    h5: { fontWeight: 700, color: '#172B4D' },
    h6: { fontWeight: 600, fontSize: '0.95rem', color: '#172B4D' },
    subtitle1: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 500 },
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
          boxShadow: '0 1px 1px rgba(9, 30, 66, 0.13), 0 0 1px rgba(9, 30, 66, 0.13)',
          border: 'none',
          borderRadius: 10,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        elevation1: {
          boxShadow: '0 1px 1px rgba(9, 30, 66, 0.13), 0 0 1px rgba(9, 30, 66, 0.13)',
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
        outlined: {
          borderColor: '#DFE1E6',
          color: '#42526E',
          '&:hover': { borderColor: '#C1C7D0', backgroundColor: '#F4F5F7' },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 700,
          fontSize: '0.65rem',
          letterSpacing: '0.04em',
          height: 22,
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
    MuiToggleButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderColor: '#DFE1E6',
          color: '#42526E',
          '&.Mui-selected': {
            backgroundColor: '#DEEBFF',
            color: '#0052CC',
            '&:hover': { backgroundColor: '#B3D4FF' },
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
          boxShadow: '0 8px 16px -4px rgba(9, 30, 66, 0.25)',
        },
      },
    },
  },
});

export const CHART_COLORS = [
  '#0052CC',
  '#4C9AFF',
  '#FFAB00',
  '#36B37E',
  '#6554C0',
  '#FF5630',
  '#00B8D9',
];

export const SIDEBAR_BG = '#0B3A82';
export const AVATAR_COLORS = ['#0052CC', '#6554C0', '#FF5630', '#36B37E', '#00B8D9', '#FF8B00'];
