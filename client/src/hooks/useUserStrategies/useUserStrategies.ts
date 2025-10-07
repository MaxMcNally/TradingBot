import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getUserStrategies, 
  createStrategy, 
  updateStrategy, 
  deleteStrategy, 
  deactivateStrategy, 
  activateStrategy, 
  saveStrategyFromBacktest,
  CreateStrategyData,
  UpdateStrategyData
} from '../../api';
import { useUser } from '../useUser';
import { UseUserStrategiesReturn } from './useUserStrategies.types';

export const useUserStrategies = (includeInactive: boolean = false): UseUserStrategiesReturn => {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const userId = user?.id ? parseInt(user.id) : 0;

  const {
    data: strategies = [],
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['userStrategies', userId, includeInactive],
    queryFn: async () => {
      if (!userId) throw new Error('User not found');
      const response = await getUserStrategies(userId, includeInactive);
      return response.data.strategies;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const createStrategyMutation = useMutation({
    mutationFn: async (data: CreateStrategyData) => {
      if (!userId) throw new Error('User not found');
      const response = await createStrategy(userId, data);
      return response.data.strategy;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userStrategies', userId] });
    },
  });

  const updateStrategyMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateStrategyData }) => {
      const response = await updateStrategy(id, data);
      return response.data.strategy;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userStrategies', userId] });
    },
  });

  const deleteStrategyMutation = useMutation({
    mutationFn: async (id: number) => {
      await deleteStrategy(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userStrategies', userId] });
    },
  });

  const deactivateStrategyMutation = useMutation({
    mutationFn: async (id: number) => {
      await deactivateStrategy(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userStrategies', userId] });
    },
  });

  const activateStrategyMutation = useMutation({
    mutationFn: async (id: number) => {
      await activateStrategy(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userStrategies', userId] });
    },
  });

  const saveFromBacktestMutation = useMutation({
    mutationFn: async (data: CreateStrategyData) => {
      if (!userId) throw new Error('User not found');
      const response = await saveStrategyFromBacktest(userId, data);
      return response.data.strategy;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userStrategies', userId] });
    },
  });

  return {
    strategies,
    isLoading,
    isError,
    error,
    refetch,
    createStrategy: createStrategyMutation.mutateAsync,
    updateStrategy: (id: number, data: UpdateStrategyData) => updateStrategyMutation.mutateAsync({ id, data }),
    deleteStrategy: deleteStrategyMutation.mutateAsync,
    deactivateStrategy: deactivateStrategyMutation.mutateAsync,
    activateStrategy: activateStrategyMutation.mutateAsync,
    saveFromBacktest: saveFromBacktestMutation.mutateAsync,
    isCreating: createStrategyMutation.isPending,
    isUpdating: updateStrategyMutation.isPending,
    isDeleting: deleteStrategyMutation.isPending,
  };
};
