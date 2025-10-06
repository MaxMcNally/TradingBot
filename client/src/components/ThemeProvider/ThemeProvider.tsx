import React from 'react';
import { ThemeProvider as MuiThemeProvider, CssBaseline } from '@mui/material';
import { ThemeContextProvider, useTheme } from './ThemeContext';
import { ThemeProviderProps } from './ThemeProvider.types';

const ThemeProviderContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { theme } = useTheme();

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
      <ThemeProviderContent>
        {children}
      </ThemeProviderContent>
    </ThemeContextProvider>
  );
};

export default ThemeProvider;
