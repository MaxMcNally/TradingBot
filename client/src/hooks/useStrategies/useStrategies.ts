import { useQuery, useMutation } from '@tanstack/react-query';
import { getStrategies, runBacktest } from '../../api';
import { UseStrategiesReturn, UseBacktestReturn } from './useStrategies.types';

export const useStrategies = (): UseStrategiesReturn => {
  const {
    data: strategies = [],
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['strategies'],
    queryFn: async () => {
      const response = await getStrategies();
      return response.data.data.strategies;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - strategies don't change often
  });

  return {
    strategies,
    isLoading,
    isError,
    error,
    refetch,
  };
};

export const useBacktest = (): UseBacktestReturn => {
  const {
    mutateAsync: runBacktestMutation,
    isPending: isLoading,
    isError,
    error,
    data
  } = useMutation({
    mutationFn: async (backtestData: any) => {
      const response = await runBacktest(backtestData);
      return response.data;
    },
  });

  return {
    runBacktest: runBacktestMutation,
    isLoading,
    isError,
    error,
    data,
  };
};
