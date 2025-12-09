import { createTheme, alpha, Theme } from '@mui/material/styles';

export type FontTheme = 'SPACE_GROTESK' | 'RAJDHANI' | 'IBM_PLEX';
export type ColorMode = 'light' | 'dark';

// Color Palette Definitions
const paletteTokens = {
  dark: {
    bg: '#121416',
    paper: '#1d2125',
    primary: '#ffb74d', // Amber
    secondary: '#80cbc4', // Soft Teal
    text: '#e0e0e0',
    border: 'rgba(255, 183, 77, 0.2)',
  },
  light: {
    bg: '#e3e4db', // Putty
    paper: '#f2f0e9', // Manila
    primary: '#e65100', // Burnt Orange
    secondary: '#00695c', // Deep Teal
    text: '#263238', // Dark Grey Ink
    border: 'rgba(0, 0, 0, 0.12)',
  }
};

// Typography Strategies
const fontStrategies = {
  SPACE_GROTESK: {
    headers: '"Space Grotesk", sans-serif',
    body: '"Space Grotesk", sans-serif',
    code: '"JetBrains Mono", monospace',
    headerWeight: 700,
  },
  RAJDHANI: {
    headers: '"Rajdhani", sans-serif',
    body: '"Rajdhani", sans-serif',
    code: '"JetBrains Mono", monospace',
    headerWeight: 700,
  },
  IBM_PLEX: {
    headers: '"IBM Plex Sans", sans-serif',
    body: '"IBM Plex Sans", sans-serif',
    code: '"IBM Plex Mono", monospace',
    headerWeight: 600,
  }
};

export const createAppTheme = (mode: ColorMode, fontTheme: FontTheme): Theme => {
  const colors = paletteTokens[mode];
  const activeFont = fontStrategies[fontTheme];

  return createTheme({
    palette: {
      mode,
      background: {
        default: colors.bg,
        paper: colors.paper,
      },
      primary: {
        main: colors.primary,
        light: alpha(colors.primary, 0.8),
        dark: mode === 'dark' ? '#f57c00' : '#bf360c',
        contrastText: colors.bg,
      },
      secondary: {
        main: colors.secondary,
        light: alpha(colors.secondary, 0.8),
        dark: mode === 'dark' ? '#4db6ac' : '#004d40',
        contrastText: colors.bg,
      },
      text: {
        primary: colors.text,
        secondary: alpha(colors.text, 0.7),
      },
      divider: colors.border,
    },
    typography: {
      fontFamily: activeFont.body,
      h1: {
        fontFamily: activeFont.headers,
        fontWeight: activeFont.headerWeight,
        letterSpacing: '-0.02em',
      },
      h2: {
        fontFamily: activeFont.headers,
        fontWeight: activeFont.headerWeight,
      },
      h3: {
        fontFamily: activeFont.headers,
        fontWeight: activeFont.headerWeight,
      },
      h4: {
        fontFamily: activeFont.headers,
        fontWeight: activeFont.headerWeight,
      },
      h5: {
        fontFamily: activeFont.headers,
        fontWeight: activeFont.headerWeight,
      },
      h6: {
        fontFamily: activeFont.headers,
        fontWeight: activeFont.headerWeight,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
      },
      button: {
        fontFamily: activeFont.headers,
        fontWeight: 700,
      },
      subtitle1: {
        fontFamily: activeFont.code,
      },
      caption: {
        fontFamily: activeFont.code,
      },
    },
    shape: {
      borderRadius: 0, // Brutalist Sharp Edges
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            border: `1px solid ${colors.border}`,
            boxShadow: mode === 'light' 
              ? '2px 2px 0px 0px #b0bec5' 
              : '4px 4px 0px 0px rgba(0,0,0,0.5)',
            '&:hover': {
              backgroundColor: alpha(colors.primary, 0.1),
              transform: 'translate(-1px, -1px)',
              boxShadow: mode === 'light'
                ? '3px 3px 0px 0px #b0bec5'
                : '5px 5px 0px 0px rgba(0,0,0,0.5)',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            border: `1px solid ${colors.border}`,
            boxShadow: 'none',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: colors.bg,
            color: colors.text,
            borderBottom: `1px solid ${colors.border}`,
            boxShadow: 'none',
          },
        },
      },
    },
  });
};

