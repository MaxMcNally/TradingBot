import { User } from '../../components/Login/Login.types';

export interface UseUserReturn {
  user: User | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refetch: () => void;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}
