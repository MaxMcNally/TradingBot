// Login component types and interfaces

export interface LoginFormData {
  username: string;
  email?: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  data: {
    token: string;
    user: User;
    requires2fa?: boolean;
  };
}

export interface User {
  id: string;
  email: string;
  name?: string;
  username?: string;
  email_verified?: number;
  two_factor_enabled?: number;
  role?: 'USER' | 'ADMIN';
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginProps {
  setUser: (user: User) => void;
}
