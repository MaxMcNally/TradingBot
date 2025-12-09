import React from 'react';
import { ThemeProvider as MuiThemeProvider, CssBaseline } from '@mui/material';
import { createTheme, alpha } from '@mui/material/styles';
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
      light: alpha(colors.primary, 0.7),
      dark: alpha(colors.primary, 0.9),
      contrastText: colors.background,
    },
    secondary: {
      main: colors.secondary,
      light: alpha(colors.secondary, 0.7),
      dark: alpha(colors.secondary, 0.9),
      contrastText: colors.background,
    },
    error: {
      main: colors.accent,
      light: alpha(colors.accent, 0.7),
      dark: alpha(colors.accent, 0.9),
    },
    success: {
      main: colors.success,
      light: alpha(colors.success, 0.7),
      dark: alpha(colors.success, 0.9),
    },
    text: {
      primary: colors.textPrimary,
      secondary: colors.textSecondary,
    },
    divider: colors.border,
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
    allVariants: {
      color: colors.textPrimary,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: colors.background,
          color: colors.textPrimary,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: colors.paper,
          backgroundImage: 'none',
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
