// Signup component types and interfaces

export interface SignupFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface SignupResponse {
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

export interface SignupProps {
  setUser: (user: User) => void;
}
