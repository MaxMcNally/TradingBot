import { useContext } from 'react';
import { ThemeContext } from './ThemeContext';
import { FontTheme, ColorMode } from './themeConfig';

export interface UseThemeReturn {
  mode: ColorMode;
  fontTheme: FontTheme;
  setMode: (mode: ColorMode) => Promise<void>;
  setFontTheme: (theme: FontTheme) => Promise<void>;
  isLoading: boolean;
}

export const useTheme = (): UseThemeReturn => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

