import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getSessionSettings,
  createSessionSettings,
  updateSessionSettings,
  TradingSessionSettings,
} from '../../api/tradingApi';

export interface UseTradingSessionSettingsReturn {
  settings: TradingSessionSettings | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  createSettings: (settings: Partial<TradingSessionSettings>) => Promise<TradingSessionSettings>;
  updateSettings: (settings: Partial<TradingSessionSettings>) => Promise<TradingSessionSettings>;
  isCreating: boolean;
  isUpdating: boolean;
}

export const useTradingSessionSettings = (sessionId: number | null): UseTradingSessionSettingsReturn => {
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    isError,
    error,
    refetch: refetchQuery
  } = useQuery({
    queryKey: ['tradingSessionSettings', sessionId],
    queryFn: async () => {
      if (!sessionId) return null;
      const response = await getSessionSettings(sessionId);
      return response.data.settings;
    },
    enabled: !!sessionId,
    retry: 1,
    staleTime: 30 * 1000, // 30 seconds
  });

  const createMutation = useMutation({
    mutationFn: async (settings: Partial<TradingSessionSettings>) => {
      if (!sessionId) throw new Error('Session ID is required');
      const response = await createSessionSettings(sessionId, settings);
      return response.data.settings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tradingSessionSettings', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['activeTradingSession'] });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (settings: Partial<TradingSessionSettings>) => {
      if (!sessionId) throw new Error('Session ID is required');
      const response = await updateSessionSettings(sessionId, settings);
      return response.data.settings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tradingSessionSettings', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['activeTradingSession'] });
    }
  });

  const refetch = async () => {
    await refetchQuery();
  };

  const createSettings = async (settings: Partial<TradingSessionSettings>): Promise<TradingSessionSettings> => {
    return await createMutation.mutateAsync(settings);
  };

  const updateSettings = async (settings: Partial<TradingSessionSettings>): Promise<TradingSessionSettings> => {
    return await updateMutation.mutateAsync(settings);
  };

  return {
    settings: data || null,
    isLoading,
    isError,
    error: error as Error | null,
    refetch,
    createSettings,
    updateSettings,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
  };
};

