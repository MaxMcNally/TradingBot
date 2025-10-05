import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useStrategies, useBacktest } from './useStrategies';
import * as api from '../../api';

// Mock the API module
jest.mock('../../api', () => ({
  getStrategies: jest.fn(),
  runBacktest: jest.fn(),
}));

const mockApi = api as jest.Mocked<typeof api>;

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

describe('useStrategies', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return strategies data when getStrategies succeeds', async () => {
    const mockStrategies = [
      { name: 'meanReversion', description: 'Mean reversion strategy' },
      { name: 'momentum', description: 'Momentum strategy' },
    ];
    mockApi.getStrategies.mockResolvedValueOnce({
      data: { data: { strategies: mockStrategies } }
    } as any);

    const { result } = renderHook(() => useStrategies(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.strategies).toEqual(mockStrategies);
    expect(result.current.isError).toBe(false);
  });

  it('should handle getStrategies error', async () => {
    mockApi.getStrategies.mockRejectedValueOnce(new Error('Failed to fetch strategies'));

    const { result } = renderHook(() => useStrategies(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.strategies).toEqual([]);
    expect(result.current.isError).toBe(true);
  });
});

describe('useBacktest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should run backtest successfully', async () => {
    const mockBacktestData = {
      strategy: 'meanReversion',
      symbols: ['AAPL'],
      startDate: '2023-01-01',
      endDate: '2023-12-31',
    };
    const mockBacktestResult = {
      results: [{ symbol: 'AAPL', totalReturn: 0.15, finalPortfolioValue: 11500 }]
    };
    mockApi.runBacktest.mockResolvedValueOnce({
      data: mockBacktestResult
    } as any);

    const { result } = renderHook(() => useBacktest(), {
      wrapper: createWrapper(),
    });

    const backtestResult = await result.current.runBacktest(mockBacktestData);

    expect(mockApi.runBacktest).toHaveBeenCalledWith(mockBacktestData);
    expect(backtestResult).toEqual(mockBacktestResult);
    expect(result.current.isError).toBe(false);
  });

  it('should handle backtest error', async () => {
    const mockBacktestData = {
      strategy: 'invalid',
      symbols: ['INVALID'],
      startDate: '2023-01-01',
      endDate: '2023-12-31',
    };
    mockApi.runBacktest.mockRejectedValueOnce(new Error('Backtest failed'));

    const { result } = renderHook(() => useBacktest(), {
      wrapper: createWrapper(),
    });

    await expect(result.current.runBacktest(mockBacktestData)).rejects.toThrow('Backtest failed');
    expect(result.current.isError).toBe(true);
  });
});
