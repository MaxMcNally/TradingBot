import { AppUser } from "../../types/user";

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

export type User = AppUser;

export interface LoginProps {
  setUser: (user: User) => void;
}
