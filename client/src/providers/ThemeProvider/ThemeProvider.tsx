import React from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme, alpha, CssBaseline } from '@mui/material';
import { ThemeProviderProps } from './ThemeProvider.types';

// --- Color Palette Definitions ---
const colors = {
  background: '#121416', // Deep charcoal/green (Severance dark mode)
  paper: '#1d2125',      // Slightly lighter, heavy industrial feel
  primary: '#ffb74d',    // Amber/Orange (CRT Monitor Glow / Retro Sci-Fi)
  secondary: '#80cbc4',  // Faded Teal (50s Kitchen Appliance)
  accent: '#ff5252',     // Red Alert
  success: '#69f0ae',    // Phosphor Green
  textPrimary: '#e0e0e0', // Off-white (prevent eye strain)
  textSecondary: '#a0a0a0',
  border: 'rgba(255, 183, 77, 0.2)', // Subtle amber borders
};

const theme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: colors.background,
      paper: colors.paper,
    },
    primary: {
      main: colors.primary,
      light: alpha(colors.primary, 0.8),
      dark: '#f57c00',
      contrastText: colors.background,
    },
    secondary: {
      main: colors.secondary,
      light: alpha(colors.secondary, 0.8),
      dark: '#4db6ac',
      contrastText: colors.background,
    },
    error: {
      main: colors.accent,
    },
    success: {
      main: colors.success,
    },
    text: {
      primary: colors.textPrimary,
      secondary: colors.textSecondary,
    },
    divider: colors.border,
  },
  typography: {
    fontFamily: '"Syne", Arial, sans-serif',
    h1: {
      fontFamily: '"Syne", Arial, sans-serif',
      fontWeight: 800,
    },
    h2: {
      fontFamily: '"Syne", Arial, sans-serif',
      fontWeight: 700,
    },
    h3: {
      fontFamily: '"Syne", Arial, sans-serif',
      fontWeight: 700,
    },
    h4: {
      fontFamily: '"Syne", Arial, sans-serif',
      fontWeight: 700,
    },
    h5: {
      fontFamily: '"Syne", Arial, sans-serif',
      fontWeight: 700,
    },
    h6: {
      fontFamily: '"Syne", Arial, sans-serif',
      fontWeight: 700,
    },
    button: {
      fontFamily: '"Syne", Arial, sans-serif',
      fontWeight: 700,
    },
    body1: {
      fontFamily: '"Syne", Arial, sans-serif',
      fontWeight: 400,
    },
    body2: {
      fontFamily: '"Syne", Arial, sans-serif',
      fontWeight: 400,
    },
    caption: {
      fontFamily: '"JetBrains Mono", monospace',
      fontWeight: 400,
    },
    overline: {
      fontFamily: '"JetBrains Mono", monospace',
      fontWeight: 500,
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderColor: colors.border,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: `1px solid ${colors.border}`,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: colors.paper,
          borderBottom: `1px solid ${colors.border}`,
        },
      },
    },
  },
});

const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
};

export default ThemeProvider;
