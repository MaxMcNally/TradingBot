import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { 
  useTradingStats, 
  usePortfolioSummary, 
  useTrades, 
  useTradingSessions,
  useTradingSessionManagement 
} from './useTrading';
import * as tradingApi from '../../api/tradingApi';

// Mock the trading API module
jest.mock('../../api/tradingApi', () => ({
  getUserTradingStats: jest.fn(),
  getUserPortfolioSummary: jest.fn(),
  getUserRecentTrades: jest.fn(),
  getUserTradingSessions: jest.fn(),
  getUserPortfolioHistory: jest.fn(),
  getActiveTradingSession: jest.fn(),
  startTradingSession: jest.fn(),
  stopTradingSession: jest.fn(),
  pauseTradingSession: jest.fn(),
  resumeTradingSession: jest.fn(),
}));

const mockTradingApi = tradingApi as jest.Mocked<typeof tradingApi>;

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

describe('useTradingStats', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return trading stats when API succeeds', async () => {
    const mockStats = {
      userId: 1,
      username: 'testuser',
      totalTrades: 10,
      winningTrades: 7,
      totalPnL: 1500,
      winRate: 0.7,
      activeSessions: 1,
    };
    mockTradingApi.getUserTradingStats.mockResolvedValueOnce({
      data: mockStats
    } as any);

    const { result } = renderHook(() => useTradingStats(1), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.stats).toEqual(mockStats);
    expect(result.current.isError).toBe(false);
  });

  it('should handle API error', async () => {
    mockTradingApi.getUserTradingStats.mockRejectedValueOnce(new Error('API Error'));

    const { result } = renderHook(() => useTradingStats(1), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.stats).toBeNull();
    expect(result.current.isError).toBe(true);
  });
});

describe('useTradingSessionManagement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should start trading session successfully', async () => {
    const mockSessionData = {
      mode: 'PAPER' as const,
      initialCash: 10000,
      symbols: ['AAPL'],
      strategy: 'MovingAverage',
      strategyParameters: { shortWindow: 5, longWindow: 10 },
    };
    const mockResponse = {
      success: true,
      sessionId: 1,
      message: 'Session started',
    };
    mockTradingApi.startTradingSession.mockResolvedValueOnce({
      data: mockResponse
    } as any);

    const { result } = renderHook(() => useTradingSessionManagement(), {
      wrapper: createWrapper(),
    });

    const response = await result.current.startSession(mockSessionData);

    expect(mockTradingApi.startTradingSession).toHaveBeenCalledWith(mockSessionData);
    expect(response).toEqual(mockResponse);
    expect(result.current.isError).toBe(false);
  });

  it('should stop trading session successfully', async () => {
    const mockResponse = {
      success: true,
      message: 'Session stopped',
    };
    mockTradingApi.stopTradingSession.mockResolvedValueOnce({
      data: mockResponse
    } as any);

    const { result } = renderHook(() => useTradingSessionManagement(), {
      wrapper: createWrapper(),
    });

    await result.current.stopSession(1);

    expect(mockTradingApi.stopTradingSession).toHaveBeenCalledWith(1);
    expect(result.current.isError).toBe(false);
  });

  it('should handle session management errors', async () => {
    mockTradingApi.startTradingSession.mockRejectedValueOnce(new Error('Start failed'));

    const { result } = renderHook(() => useTradingSessionManagement(), {
      wrapper: createWrapper(),
    });

    await expect(result.current.startSession({
      mode: 'PAPER',
      initialCash: 10000,
      symbols: ['AAPL'],
      strategy: 'MovingAverage',
      strategyParameters: {},
    })).rejects.toThrow('Start failed');

    expect(result.current.isError).toBe(true);
  });
});
