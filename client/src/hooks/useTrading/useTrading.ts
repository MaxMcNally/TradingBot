import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getUserTradingStats,
  getUserPortfolioSummary,
  getUserRecentTrades,
  getUserTradingSessions,
  getUserPortfolioHistory,
  getActiveTradingSession,
  startTradingSession,
  stopTradingSession,
  pauseTradingSession,
  resumeTradingSession,
} from '../../api/tradingApi';
import {
  UseTradingStatsReturn,
  UsePortfolioSummaryReturn,
  UseTradesReturn,
  UseTradingSessionsReturn,
  UsePortfolioHistoryReturn,
  UseTradingSessionManagementReturn,
} from './useTrading.types';

export const useTradingStats = (userId: number): UseTradingStatsReturn => {
  const {
    data: stats,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['tradingStats', userId],
    queryFn: async () => {
      const response = await getUserTradingStats(userId);
      return response.data;
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  return {
    stats: stats || null,
    isLoading,
    isError,
    error,
    refetch,
  };
};

export const usePortfolioSummary = (userId: number): UsePortfolioSummaryReturn => {
  const {
    data: portfolio,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['portfolioSummary', userId],
    queryFn: async () => {
      const response = await getUserPortfolioSummary(userId);
      return response.data;
    },
    enabled: !!userId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  return {
    portfolio: portfolio || null,
    isLoading,
    isError,
    error,
    refetch,
  };
};

export const useTrades = (userId: number, limit: number = 50): UseTradesReturn => {
  const {
    data: trades = [],
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['trades', userId, limit],
    queryFn: async () => {
      const response = await getUserRecentTrades(userId, limit);
      return response.data;
    },
    enabled: !!userId,
    staleTime: 30 * 1000, // 30 seconds
  });

  return {
    trades,
    isLoading,
    isError,
    error,
    refetch,
  };
};

export const useTradingSessions = (userId: number, limit: number = 20): UseTradingSessionsReturn => {
  const {
    data: sessions = [],
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['tradingSessions', userId, limit],
    queryFn: async () => {
      const response = await getUserTradingSessions(userId, limit);
      return response.data;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    sessions,
    isLoading,
    isError,
    error,
    refetch,
  };
};

export const usePortfolioHistory = (userId: number, limit: number = 100): UsePortfolioHistoryReturn => {
  const {
    data: history = [],
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['portfolioHistory', userId, limit],
    queryFn: async () => {
      const response = await getUserPortfolioHistory(userId, limit);
      return response.data;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    history,
    isLoading,
    isError,
    error,
    refetch,
  };
};

export const useActiveTradingSession = (userId: number) => {
  return useQuery({
    queryKey: ['activeTradingSession', userId],
    queryFn: async () => {
      const response = await getActiveTradingSession(userId);
      return response.data;
    },
    enabled: !!userId,
    staleTime: 10 * 1000, // 10 seconds
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });
};

export const useTradingSessionManagement = (): UseTradingSessionManagementReturn => {
  const queryClient = useQueryClient();

  const startSessionMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await startTradingSession(data);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['tradingSessions'] });
      queryClient.invalidateQueries({ queryKey: ['activeTradingSession'] });
    },
  });

  const stopSessionMutation = useMutation({
    mutationFn: async (sessionId: number) => {
      const response = await stopTradingSession(sessionId);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tradingSessions'] });
      queryClient.invalidateQueries({ queryKey: ['activeTradingSession'] });
    },
  });

  const pauseSessionMutation = useMutation({
    mutationFn: async (sessionId: number) => {
      const response = await pauseTradingSession(sessionId);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tradingSessions'] });
      queryClient.invalidateQueries({ queryKey: ['activeTradingSession'] });
    },
  });

  const resumeSessionMutation = useMutation({
    mutationFn: async (sessionId: number) => {
      const response = await resumeTradingSession(sessionId);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tradingSessions'] });
      queryClient.invalidateQueries({ queryKey: ['activeTradingSession'] });
    },
  });

  const isLoading = startSessionMutation.isPending || 
                   stopSessionMutation.isPending || 
                   pauseSessionMutation.isPending || 
                   resumeSessionMutation.isPending;

  const isError = startSessionMutation.isError || 
                 stopSessionMutation.isError || 
                 pauseSessionMutation.isError || 
                 resumeSessionMutation.isError;

  const error = startSessionMutation.error || 
               stopSessionMutation.error || 
               pauseSessionMutation.error || 
               resumeSessionMutation.error;

  return {
    startSession: startSessionMutation.mutateAsync,
    stopSession: stopSessionMutation.mutateAsync,
    pauseSession: pauseSessionMutation.mutateAsync,
    resumeSession: resumeSessionMutation.mutateAsync,
    isLoading,
    isError,
    error,
  };
};
