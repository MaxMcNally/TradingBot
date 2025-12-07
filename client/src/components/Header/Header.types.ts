import { AppUser } from "../../types/user";

export interface HeaderProps {
  user: AppUser | null;
  onLogout: () => void;
}
