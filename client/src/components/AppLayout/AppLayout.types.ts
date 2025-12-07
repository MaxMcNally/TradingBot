// AppLayout component types and interfaces

export interface AppLayoutProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  sidebar?: React.ReactNode;
}

export interface NavigationItem {
  label: string;
  path: string;
  icon: React.ComponentType;
}
