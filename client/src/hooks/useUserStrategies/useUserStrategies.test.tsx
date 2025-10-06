import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUserStrategies } from './useUserStrategies';
import { 
  getUserStrategies, 
  createStrategy, 
  updateStrategy, 
  deleteStrategy, 
  deactivateStrategy, 
  activateStrategy, 
  saveStrategyFromBacktest 
} from '../../api';
import { useUser } from '../useUser';

// Mock the API functions
jest.mock('../../api', () => ({
  getUserStrategies: jest.fn(),
  createStrategy: jest.fn(),
  updateStrategy: jest.fn(),
  deleteStrategy: jest.fn(),
  deactivateStrategy: jest.fn(),
  activateStrategy: jest.fn(),
  saveStrategyFromBacktest: jest.fn(),
}));

jest.mock('../useUser', () => ({
  useUser: jest.fn(),
}));

const mockGetUserStrategies = getUserStrategies as jest.MockedFunction<typeof getUserStrategies>;
const mockCreateStrategy = createStrategy as jest.MockedFunction<typeof createStrategy>;
const mockUpdateStrategy = updateStrategy as jest.MockedFunction<typeof updateStrategy>;
const mockDeleteStrategy = deleteStrategy as jest.MockedFunction<typeof deleteStrategy>;
const mockDeactivateStrategy = deactivateStrategy as jest.MockedFunction<typeof deactivateStrategy>;
const mockActivateStrategy = activateStrategy as jest.MockedFunction<typeof activateStrategy>;
const mockSaveStrategyFromBacktest = saveStrategyFromBacktest as jest.MockedFunction<typeof saveStrategyFromBacktest>;
const mockUseUser = useUser as jest.MockedFunction<typeof useUser>;

// Create a wrapper for React Query
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useUserStrategies', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseUser.mockReturnValue({
      user: { id: '1', username: 'testuser' },
      isLoading: false,
      error: null
    } as any);
  });

  it('should fetch user strategies including is_public field', async () => {
    const mockStrategies = [
      {
        id: 1,
        user_id: 1,
        name: 'Public Strategy',
        strategy_type: 'moving_average_crossover',
        is_public: true,
        is_active: true,
        created_at: '2023-01-01',
        updated_at: '2023-01-01'
      },
      {
        id: 2,
        user_id: 1,
        name: 'Private Strategy',
        strategy_type: 'bollinger_bands',
        is_public: false,
        is_active: true,
        created_at: '2023-01-02',
        updated_at: '2023-01-02'
      }
    ];

    mockGetUserStrategies.mockResolvedValue({
      data: { strategies: mockStrategies, count: 2 }
    } as any);

    const { result } = renderHook(() => useUserStrategies(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.strategies).toEqual([]);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockGetUserStrategies).toHaveBeenCalledWith(1, false);
    expect(result.current.strategies).toEqual(mockStrategies);
    expect(result.current.strategies[0].is_public).toBe(true);
    expect(result.current.strategies[1].is_public).toBe(false);
  });

  it('should create strategy with is_public field', async () => {
    const strategyData = {
      name: 'New Strategy',
      description: 'Test strategy',
      strategy_type: 'moving_average_crossover',
      config: { fastWindow: 10, slowWindow: 30 },
      is_public: true
    };

    const mockCreatedStrategy = {
      id: 3,
      user_id: 1,
      name: 'New Strategy',
      description: 'Test strategy',
      strategy_type: 'moving_average_crossover',
      config: { fastWindow: 10, slowWindow: 30 },
      is_public: true,
      is_active: true,
      created_at: '2023-01-03',
      updated_at: '2023-01-03'
    };

    mockCreateStrategy.mockResolvedValue({
      data: { strategy: mockCreatedStrategy }
    } as any);

    const { result } = renderHook(() => useUserStrategies(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await result.current.createStrategy(strategyData);

    expect(mockCreateStrategy).toHaveBeenCalledWith(1, strategyData);
  });

  it('should update strategy including is_public field', async () => {
    const updateData = {
      name: 'Updated Strategy',
      is_public: true
    };

    const mockUpdatedStrategy = {
      id: 1,
      user_id: 1,
      name: 'Updated Strategy',
      strategy_type: 'moving_average_crossover',
      is_public: true,
      is_active: true,
      created_at: '2023-01-01',
      updated_at: '2023-01-03'
    };

    mockUpdateStrategy.mockResolvedValue({
      data: { strategy: mockUpdatedStrategy }
    } as any);

    const { result } = renderHook(() => useUserStrategies(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await result.current.updateStrategy(1, updateData);

    expect(mockUpdateStrategy).toHaveBeenCalledWith(1, updateData);
  });

  it('should save strategy from backtest with is_public field', async () => {
    const backtestData = {
      name: 'Backtest Strategy',
      description: 'Strategy from backtest',
      strategy_type: 'bollinger_bands',
      config: { window: 20, multiplier: 2.0 },
      backtest_results: { totalReturn: 0.15 },
      is_public: false
    };

    const mockSavedStrategy = {
      id: 4,
      user_id: 1,
      name: 'Backtest Strategy',
      description: 'Strategy from backtest',
      strategy_type: 'bollinger_bands',
      config: { window: 20, multiplier: 2.0 },
      backtest_results: { totalReturn: 0.15 },
      is_public: false,
      is_active: true,
      created_at: '2023-01-04',
      updated_at: '2023-01-04'
    };

    mockSaveStrategyFromBacktest.mockResolvedValue({
      data: { strategy: mockSavedStrategy }
    } as any);

    const { result } = renderHook(() => useUserStrategies(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await result.current.saveFromBacktest(backtestData);

    expect(mockSaveStrategyFromBacktest).toHaveBeenCalledWith(1, backtestData);
  });

  it('should handle user not found', async () => {
    mockUseUser.mockReturnValue({
      user: null,
      isLoading: false,
      error: null
    } as any);

    const { result } = renderHook(() => useUserStrategies(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.strategies).toEqual([]);
  });

  it('should handle API errors', async () => {
    const mockError = new Error('API Error');
    mockGetUserStrategies.mockRejectedValue(mockError);

    const { result } = renderHook(() => useUserStrategies(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isError).toBe(true);
    expect(result.current.error).toBe(mockError);
    expect(result.current.strategies).toEqual([]);
  });

  it('should include inactive strategies when includeInactive is true', async () => {
    const mockStrategies = [
      {
        id: 1,
        user_id: 1,
        name: 'Active Strategy',
        strategy_type: 'moving_average_crossover',
        is_public: true,
        is_active: true,
        created_at: '2023-01-01',
        updated_at: '2023-01-01'
      },
      {
        id: 2,
        user_id: 1,
        name: 'Inactive Strategy',
        strategy_type: 'bollinger_bands',
        is_public: false,
        is_active: false,
        created_at: '2023-01-02',
        updated_at: '2023-01-02'
      }
    ];

    mockGetUserStrategies.mockResolvedValue({
      data: { strategies: mockStrategies, count: 2 }
    } as any);

    const { result } = renderHook(() => useUserStrategies(true), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockGetUserStrategies).toHaveBeenCalledWith(1, true);
    expect(result.current.strategies).toEqual(mockStrategies);
  });

  it('should show loading states for mutations', async () => {
    mockGetUserStrategies.mockResolvedValue({
      data: { strategies: [], count: 0 }
    } as any);

    const { result } = renderHook(() => useUserStrategies(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Test creating state
    const createPromise = result.current.createStrategy({
      name: 'Test Strategy',
      strategy_type: 'moving_average_crossover',
      config: {}
    });

    expect(result.current.isCreating).toBe(true);

    await createPromise;
    expect(result.current.isCreating).toBe(false);

    // Test updating state
    const updatePromise = result.current.updateStrategy(1, { name: 'Updated' });
    expect(result.current.isUpdating).toBe(true);

    await updatePromise;
    expect(result.current.isUpdating).toBe(false);

    // Test deleting state
    const deletePromise = result.current.deleteStrategy(1);
    expect(result.current.isDeleting).toBe(true);

    await deletePromise;
    expect(result.current.isDeleting).toBe(false);
  });
});
