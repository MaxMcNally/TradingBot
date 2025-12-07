import { AppUser } from "../../types/user";

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
    user: AppUser;
  };
}

export interface SignupProps {
  setUser: (user: AppUser) => void;
}
