import { UserStrategy, CreateStrategyData, UpdateStrategyData } from '../../api';

export interface UseUserStrategiesReturn {
  strategies: UserStrategy[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
  createStrategy: (data: CreateStrategyData) => Promise<UserStrategy>;
  updateStrategy: (id: number, data: UpdateStrategyData) => Promise<UserStrategy>;
  deleteStrategy: (id: number) => Promise<void>;
  deactivateStrategy: (id: number) => Promise<void>;
  activateStrategy: (id: number) => Promise<void>;
  saveFromBacktest: (data: CreateStrategyData) => Promise<UserStrategy>;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
}
