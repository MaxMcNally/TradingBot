import { AppUser } from "../../types/user";

export interface Setting {
  id?: string;
  user_id: string;
  key: string;
  value: string;
  created_at?: string;
  updated_at?: string;
}

export interface AccountSettings {
  name: string;
  email: string;
  username: string;
}

export interface SettingsFormData {
  [key: string]: string;
}

export interface SettingsResponse {
  success: boolean;
  data: {
    settings: Setting[];
  };
}

export interface SettingsProps {
  user: AppUser;
}
