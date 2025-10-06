import { Setting } from '../../api';

export interface UseSettingsReturn {
  settings: Setting[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  saveSetting: (setting: Omit<SaveSettingData, 'user_id'>) => Promise<void>;
  refetch: () => void;
}

export interface SaveSettingData {
  user_id: string;
  setting_key: string;
  setting_value: string;
}
