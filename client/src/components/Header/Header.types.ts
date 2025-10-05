// Header component types and interfaces

export interface User {
  id: string;
  email: string;
  name?: string;
  username?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface HeaderProps {
  user: User | null;
  onLogout: () => void;
}
