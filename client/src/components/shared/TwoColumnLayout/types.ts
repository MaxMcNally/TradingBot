export interface TwoColumnLayoutProps {
  children: React.ReactNode;
  mainContent: React.ReactNode;
  sidebar: React.ReactNode;
  gap?: number;
  mainFlex?: number;
  sidebarFlex?: number;
  direction?: 'row' | 'column';
  responsive?: boolean;
}
