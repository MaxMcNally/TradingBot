// ThemeProvider component types and interfaces
import { Theme } from '@mui/material/styles';

export interface ThemeProviderProps {
  children: React.ReactNode;
}

export interface ThemeContextType {
  mode: 'light' | 'dark';
  theme: Theme;
  toggleTheme: () => void;
  resetToSystemTheme: () => void;
}
