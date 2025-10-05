import { Strategy } from '../../components/Backtesting/Backtesting.types';

export interface UseStrategiesReturn {
  strategies: Strategy[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

export interface UseBacktestReturn {
  runBacktest: (data: any) => Promise<any>;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  data: any;
}
