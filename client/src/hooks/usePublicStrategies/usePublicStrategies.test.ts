import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePublicStrategies } from './usePublicStrategies';
import { getPublicStrategies, getPublicStrategiesByType } from '../../api';

// Mock the API functions
jest.mock('../../api', () => ({
  getPublicStrategies: jest.fn(),
  getPublicStrategiesByType: jest.fn(),
}));

const mockGetPublicStrategies = getPublicStrategies as jest.MockedFunction<typeof getPublicStrategies>;
const mockGetPublicStrategiesByType = getPublicStrategiesByType as jest.MockedFunction<typeof getPublicStrategiesByType>;

// Create a wrapper for React Query
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => 
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('usePublicStrategies', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch all public strategies when no strategyType is provided', async () => {
    const mockStrategies = [
      {
        id: 1,
        user_id: 1,
        name: 'Public Strategy 1',
        strategy_type: 'moving_average_crossover',
        is_public: true,
        is_active: true,
        created_at: '2023-01-01',
        updated_at: '2023-01-01'
      },
      {
        id: 2,
        user_id: 2,
        name: 'Public Strategy 2',
        strategy_type: 'bollinger_bands',
        is_public: true,
        is_active: true,
        created_at: '2023-01-02',
        updated_at: '2023-01-02'
      }
    ];

    mockGetPublicStrategies.mockResolvedValue({
      data: { strategies: mockStrategies, count: 2 }
    } as any);

    const { result } = renderHook(() => usePublicStrategies(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.strategies).toEqual([]);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockGetPublicStrategies).toHaveBeenCalledTimes(1);
    expect(result.current.strategies).toEqual(mockStrategies);
    expect(result.current.isError).toBe(false);
  });

  it('should fetch public strategies by type when strategyType is provided', async () => {
    const mockStrategies = [
      {
        id: 1,
        user_id: 1,
        name: 'Moving Average Strategy',
        strategy_type: 'moving_average_crossover',
        is_public: true,
        is_active: true,
        created_at: '2023-01-01',
        updated_at: '2023-01-01'
      }
    ];

    mockGetPublicStrategiesByType.mockResolvedValue({
      data: { strategies: mockStrategies, count: 1 }
    } as any);

    const { result } = renderHook(() => usePublicStrategies('moving_average_crossover'), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockGetPublicStrategiesByType).toHaveBeenCalledWith('moving_average_crossover');
    expect(result.current.strategies).toEqual(mockStrategies);
    expect(result.current.isError).toBe(false);
  });

  it('should handle API errors', async () => {
    const mockError = new Error('API Error');
    mockGetPublicStrategies.mockRejectedValue(mockError);

    const { result } = renderHook(() => usePublicStrategies(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isError).toBe(true);
    expect(result.current.error).toBe(mockError);
    expect(result.current.strategies).toEqual([]);
  });

  it('should handle empty results', async () => {
    mockGetPublicStrategies.mockResolvedValue({
      data: { strategies: [], count: 0 }
    } as any);

    const { result } = renderHook(() => usePublicStrategies(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.strategies).toEqual([]);
    expect(result.current.isError).toBe(false);
  });

  it('should refetch data when refetch is called', async () => {
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
      }
    ];

    mockGetPublicStrategies.mockResolvedValue({
      data: { strategies: mockStrategies, count: 1 }
    } as any);

    const { result } = renderHook(() => usePublicStrategies(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockGetPublicStrategies).toHaveBeenCalledTimes(1);

    // Call refetch
    result.current.refetch();

    await waitFor(() => {
      expect(mockGetPublicStrategies).toHaveBeenCalledTimes(2);
    });
  });

  it('should use correct query key for caching', async () => {
    mockGetPublicStrategies.mockResolvedValue({
      data: { strategies: [], count: 0 }
    } as any);

    const { result: result1 } = renderHook(() => usePublicStrategies(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result1.current.isLoading).toBe(false);
    });

    // Render with same parameters should use cached data
    const { result: result2 } = renderHook(() => usePublicStrategies(), {
      wrapper: createWrapper(),
    });

    expect(result2.current.isLoading).toBe(false);
    expect(mockGetPublicStrategies).toHaveBeenCalledTimes(1);
  });

  it('should use different query key for different strategy types', async () => {
    mockGetPublicStrategies.mockResolvedValue({
      data: { strategies: [], count: 0 }
    } as any);

    mockGetPublicStrategiesByType.mockResolvedValue({
      data: { strategies: [], count: 0 }
    } as any);

    const { result: result1 } = renderHook(() => usePublicStrategies(), {
      wrapper: createWrapper(),
    });

    const { result: result2 } = renderHook(() => usePublicStrategies('moving_average_crossover'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result1.current.isLoading).toBe(false);
      expect(result2.current.isLoading).toBe(false);
    });

    expect(mockGetPublicStrategies).toHaveBeenCalledTimes(1);
    expect(mockGetPublicStrategiesByType).toHaveBeenCalledTimes(1);
  });
});
