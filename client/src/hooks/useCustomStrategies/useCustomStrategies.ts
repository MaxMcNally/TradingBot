import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getCustomStrategies,
  createCustomStrategy,
  updateCustomStrategy,
  deleteCustomStrategy,
  testCustomStrategy,
  CustomStrategy,
  CreateCustomStrategyData,
  UpdateCustomStrategyData,
  TestCustomStrategyRequest
} from '../../api/customStrategiesApi';

export interface UseCustomStrategiesReturn {
  strategies: CustomStrategy[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  createStrategy: (data: CreateCustomStrategyData) => Promise<CustomStrategy>;
  updateStrategy: (id: number, data: UpdateCustomStrategyData) => Promise<CustomStrategy>;
  deleteStrategy: (id: number) => Promise<void>;
  testStrategy: (data: TestCustomStrategyRequest) => Promise<any>;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  isTesting: boolean;
}

export const useCustomStrategies = (includeInactive: boolean = false): UseCustomStrategiesReturn => {
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    isError,
    error,
    refetch: refetchQuery
  } = useQuery({
    queryKey: ['customStrategies', includeInactive],
    queryFn: async () => {
      const response = await getCustomStrategies(includeInactive);
      return response.data.data || [];
    },
    retry: 1,
    staleTime: 30 * 1000 // 30 seconds
  });

  const createMutation = useMutation({
    mutationFn: createCustomStrategy,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customStrategies'] });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCustomStrategyData }) =>
      updateCustomStrategy(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customStrategies'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCustomStrategy,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customStrategies'] });
    }
  });

  const testMutation = useMutation({
    mutationFn: testCustomStrategy
  });

  const refetch = async () => {
    await refetchQuery();
  };

  const createStrategy = async (data: CreateCustomStrategyData): Promise<CustomStrategy> => {
    const response = await createMutation.mutateAsync(data);
    return response.data.data;
  };

  const updateStrategy = async (id: number, data: UpdateCustomStrategyData): Promise<CustomStrategy> => {
    const response = await updateMutation.mutateAsync({ id, data });
    return response.data.data;
  };

  const deleteStrategy = async (id: number): Promise<void> => {
    await deleteMutation.mutateAsync(id);
  };

  const testStrategy = async (data: TestCustomStrategyRequest): Promise<any> => {
    const response = await testMutation.mutateAsync(data);
    return response.data.data;
  };

  return {
    strategies: data || [],
    isLoading,
    isError,
    error: error as Error | null,
    refetch,
    createStrategy,
    updateStrategy,
    deleteStrategy,
    testStrategy,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isTesting: testMutation.isPending
  };
};

