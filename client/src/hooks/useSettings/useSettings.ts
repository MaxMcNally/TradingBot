import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSettings, saveSetting as saveSettingApi } from '../../api';
import { UseSettingsReturn, SaveSettingData } from './useSettings.types';

export const useSettings = (userId: string): UseSettingsReturn => {
  const queryClient = useQueryClient();

  // Query for user settings
  const {
    data: settings = [],
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['settings', userId],
    queryFn: async () => {
      const response = await getSettings(userId);
      return response.data;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Save setting mutation
  const saveSettingMutation = useMutation({
    mutationFn: async (settingData: SaveSettingData) => {
      const response = await saveSettingApi(settingData);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch settings
      queryClient.invalidateQueries({ queryKey: ['settings', userId] });
    },
    onError: (error) => {
      console.error('Save setting failed:', error);
    },
  });

  const saveSetting = async (setting: Omit<SaveSettingData, 'user_id'>) => {
    await saveSettingMutation.mutateAsync({
      ...setting,
      user_id: userId,
    });
  };

  return {
    settings,
    isLoading: isLoading || saveSettingMutation.isPending,
    isError: isError || saveSettingMutation.isError,
    error: error || saveSettingMutation.error,
    saveSetting,
    refetch,
  };
};
