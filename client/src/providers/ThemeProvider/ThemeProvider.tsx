import React from 'react';
import { ThemeProvider as MuiThemeProvider, CssBaseline } from '@mui/material';
import { ThemeProviderProps } from './ThemeProvider.types';
import { ThemeContextProvider } from './ThemeContext';
import { useTheme } from './useTheme';
import { createAppTheme } from './themeConfig';

const ThemeProviderInner: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { mode, fontTheme, isLoading } = useTheme();
  
  if (isLoading) {
    // Return a default theme while loading (STANDARD ISSUE - IBM_PLEX)
    const defaultTheme = createAppTheme('dark', 'IBM_PLEX');
    return (
      <MuiThemeProvider theme={defaultTheme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    );
  }

  const theme = createAppTheme(mode, fontTheme);

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
};

const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  return (
    <ThemeContextProvider>
      <ThemeProviderInner>
        {children}
      </ThemeProviderInner>
    </ThemeContextProvider>
  );
};

export default ThemeProvider;
