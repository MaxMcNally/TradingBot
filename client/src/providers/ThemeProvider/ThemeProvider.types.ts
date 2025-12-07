// ThemeProvider component types and interfaces

export interface ThemeProviderProps {
  children: React.ReactNode;
}

export interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}
