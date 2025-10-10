import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useStrategies } from '../useStrategies';
import { getStrategies } from '../../../api';
import { vi } from 'vitest';

// Mock the API
vi.mock('../../../api', () => ({
  getStrategies: vi.fn(),
}));

const mockGetStrategies = getStrategies as any;

describe('useStrategies', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('should fetch strategies successfully', async () => {
    const mockStrategies = [
      {
        name: 'meanReversion',
        displayName: 'Mean Reversion',
        description: 'Buy when price is below moving average by threshold, sell when above',
        category: 'Mean Reversion',
        parameters: {
          window: {
            type: 'number',
            description: 'Moving average window in days',
            default: 20,
            min: 5,
            max: 200
          },
          threshold: {
            type: 'number',
            description: 'Percentage threshold for buy/sell signals (0.05 = 5%)',
            default: 0.05,
            min: 0.01,
            max: 0.2,
            step: 0.01
          }
        }
      },
      {
        name: 'sentimentAnalysis',
        displayName: 'Sentiment Analysis',
        description: 'Aggregates recent news sentiment to produce BUY/SELL signals',
        category: 'News/Sentiment',
        parameters: {
          lookbackDays: {
            type: 'number',
            description: 'Days of news to consider',
            default: 3,
            min: 1,
            max: 30
          }
        }
      }
    ];

    mockGetStrategies.mockResolvedValue({
      data: {
        success: true,
        data: {
          strategies: mockStrategies
        }
      }
    } as any);

    const { result } = renderHook(() => useStrategies(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.strategies).toEqual(mockStrategies);
    expect(result.current.isError).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle loading state', () => {
    mockGetStrategies.mockImplementation(() => new Promise(() => {})); // Never resolves

    const { result } = renderHook(() => useStrategies(), { wrapper });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.strategies).toEqual([]);
    expect(result.current.isError).toBe(false);
  });

  it('should handle error state', async () => {
    const errorMessage = 'Failed to fetch strategies';
    mockGetStrategies.mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useStrategies(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isError).toBe(true);
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe(errorMessage);
    expect(result.current.strategies).toEqual([]);
  });

  it('should provide refetch function', async () => {
    const mockStrategies = [
      {
        name: 'meanReversion',
        displayName: 'Mean Reversion',
        description: 'Test strategy',
        category: 'Test',
        parameters: {}
      }
    ];

    mockGetStrategies.mockResolvedValue({
      data: {
        success: true,
        data: {
          strategies: mockStrategies
        }
      }
    } as any);

    const { result } = renderHook(() => useStrategies(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(typeof result.current.refetch).toBe('function');
    
    // Test refetch
    await result.current.refetch();
    expect(mockGetStrategies).toHaveBeenCalledTimes(2);
  });

  it('should handle empty strategies response', async () => {
    mockGetStrategies.mockResolvedValue({
      data: {
        success: true,
        data: {
          strategies: []
        }
      }
    } as any);

    const { result } = renderHook(() => useStrategies(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.strategies).toEqual([]);
    expect(result.current.isError).toBe(false);
  });

  it('should handle malformed API response', async () => {
    mockGetStrategies.mockResolvedValue({
      data: {
        success: true,
        data: {
          // Missing strategies array
        }
      }
    } as any);

    const { result } = renderHook(() => useStrategies(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.strategies).toEqual([]);
    expect(result.current.isError).toBe(false);
  });

  it('should cache strategies for 10 minutes', () => {
    const { result } = renderHook(() => useStrategies(), { wrapper });

    // Check that the query has the correct stale time
    const query = queryClient.getQueryCache().find(['strategies']);
    expect(query?.options.staleTime).toBe(10 * 60 * 1000); // 10 minutes
  });
});
