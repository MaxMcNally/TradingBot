// Login component types and interfaces

export interface LoginFormData {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  data: {
    token: string;
    user: User;
  };
}

export interface User {
  id: string;
  email: string;
  name?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginProps {
  setUser: (user: User) => void;
}
