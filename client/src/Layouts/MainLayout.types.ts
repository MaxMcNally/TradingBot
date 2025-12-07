import { User } from '../types/user';

export interface MainLayoutProps {
  children: React.ReactNode;
  user: User | null;
  onLogout: () => void;
}

