import { useQuery } from '@tanstack/react-query';
import { 
  getPublicStrategies, 
  getPublicStrategiesByType,
  UserStrategy
} from '../../api';

export interface UsePublicStrategiesReturn {
  strategies: UserStrategy[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

export const usePublicStrategies = (strategyType?: string): UsePublicStrategiesReturn => {
  const {
    data: strategies = [],
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['publicStrategies', strategyType],
    queryFn: async () => {
      if (strategyType) {
        const response = await getPublicStrategiesByType(strategyType);
        return response.data.strategies;
      } else {
        const response = await getPublicStrategies();
        return response.data.strategies;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    strategies,
    isLoading,
    isError,
    error: error as Error | null,
    refetch,
  };
};
