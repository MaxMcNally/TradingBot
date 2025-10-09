import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import PerformanceMetrics from './PerformanceMetrics';

// Mock the hooks
vi.mock('../../hooks/useTrading/useTrading', () => ({
  usePerformanceMetrics: vi.fn(),
}));

import { usePerformanceMetrics } from '../../hooks/useTrading/useTrading';

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('PerformanceMetrics Component', () => {
  const mockPerformanceMetrics = [
    {
      id: 1,
      user_id: 1,
      strategy_name: 'Moving Average Crossover',
      strategy_type: 'TREND_FOLLOWING',
      execution_type: 'BACKTEST' as const,
      session_id: 1,
      symbols: ['AAPL', 'GOOGL'],
      start_date: '2024-01-01',
      end_date: '2024-01-31',
      initial_capital: 10000,
      final_capital: 11250.75,
      total_return: 0.125,
      total_return_dollar: 1250.75,
      max_drawdown: -0.05,
      sharpe_ratio: 1.25,
      sortino_ratio: 1.45,
      win_rate: 0.68,
      total_trades: 25,
      winning_trades: 17,
      losing_trades: 8,
      avg_win: 150.25,
      avg_loss: -75.50,
      profit_factor: 2.1,
      largest_win: 300.00,
      largest_loss: -150.00,
      avg_trade_duration: 5.5,
      volatility: 0.18,
      beta: 0.95,
      alpha: 0.05,
      config: { shortPeriod: 10, longPeriod: 20 },
      trades_data: [],
      portfolio_history: [],
      created_at: '2024-01-31T10:00:00Z',
      updated_at: '2024-01-31T10:00:00Z'
    },
    {
      id: 2,
      user_id: 1,
      strategy_name: 'Breakout Strategy',
      strategy_type: 'MOMENTUM',
      execution_type: 'LIVE_TRADING' as const,
      session_id: 2,
      symbols: ['MSFT', 'TSLA'],
      start_date: '2024-02-01',
      end_date: '2024-02-28',
      initial_capital: 10000,
      final_capital: 10800.50,
      total_return: 0.08,
      total_return_dollar: 800.50,
      max_drawdown: -0.03,
      sharpe_ratio: 1.15,
      sortino_ratio: 1.35,
      win_rate: 0.72,
      total_trades: 18,
      winning_trades: 13,
      losing_trades: 5,
      avg_win: 120.75,
      avg_loss: -60.25,
      profit_factor: 2.5,
      largest_win: 250.00,
      largest_loss: -100.00,
      avg_trade_duration: 4.2,
      volatility: 0.15,
      beta: 1.05,
      alpha: 0.03,
      config: { breakoutPeriod: 20, volumeThreshold: 1.5 },
      trades_data: [],
      portfolio_history: [],
      created_at: '2024-02-28T15:30:00Z',
      updated_at: '2024-02-28T15:30:00Z'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementations
    (usePerformanceMetrics as vi.Mock).mockReturnValue({
      metrics: mockPerformanceMetrics,
      isLoading: false,
      isError: false,
    });
  });

  it('renders performance metrics correctly', () => {
    renderWithQueryClient(<PerformanceMetrics userId={1} />);
    
    expect(screen.getByText('Performance Metrics')).toBeInTheDocument();
    expect(screen.getByText('Total Executions')).toBeInTheDocument();
    expect(screen.getByText('Average Return')).toBeInTheDocument();
  });

  it('displays strategy performance table', () => {
    renderWithQueryClient(<PerformanceMetrics userId={1} />);
    
    // Check table headers
    expect(screen.getByText('Strategy')).toBeInTheDocument();
    expect(screen.getByText('Type')).toBeInTheDocument();
    expect(screen.getByText('Return')).toBeInTheDocument();
    expect(screen.getByText('Sharpe')).toBeInTheDocument();
    expect(screen.getByText('Max DD')).toBeInTheDocument();
    expect(screen.getByText('Win Rate')).toBeInTheDocument();
    expect(screen.getByText('Trades')).toBeInTheDocument();
    expect(screen.getByText('Date')).toBeInTheDocument();
  });

  it('displays strategy data in table', () => {
    renderWithQueryClient(<PerformanceMetrics userId={1} />);
    
    // Check strategy names
    expect(screen.getByText('Moving Average Crossover')).toBeInTheDocument();
    expect(screen.getByText('Breakout Strategy')).toBeInTheDocument();
    
    // Check execution types
    expect(screen.getByText('BACKTEST')).toBeInTheDocument();
    expect(screen.getByText('LIVE_TRADING')).toBeInTheDocument();
    
    // Check return values
    expect(screen.getByText('12.50%')).toBeInTheDocument();
    expect(screen.getByText('8.00%')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    (usePerformanceMetrics as vi.Mock).mockReturnValue({
      metrics: [],
      isLoading: true,
      isError: false,
    });

    renderWithQueryClient(<PerformanceMetrics userId={1} />);
    
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows error state', () => {
    (usePerformanceMetrics as vi.Mock).mockReturnValue({
      metrics: [],
      isLoading: false,
      isError: true,
    });

    renderWithQueryClient(<PerformanceMetrics userId={1} />);
    
    expect(screen.getByText('Failed to load performance metrics')).toBeInTheDocument();
  });

  it('handles empty metrics', () => {
    (usePerformanceMetrics as vi.Mock).mockReturnValue({
      metrics: [],
      isLoading: false,
      isError: false,
    });

    renderWithQueryClient(<PerformanceMetrics userId={1} />);
    
    expect(screen.getByText('No performance data available')).toBeInTheDocument();
  });

  it('displays performance summary cards', () => {
    renderWithQueryClient(<PerformanceMetrics userId={1} />);
    
    // Check summary section
    expect(screen.getByText('Performance Summary')).toBeInTheDocument();
    expect(screen.getByText('Average Return')).toBeInTheDocument();
    expect(screen.getByText('Best Strategy')).toBeInTheDocument();
    expect(screen.getByText('Total Strategies')).toBeInTheDocument();
  });

  it('shows strategy type chips', () => {
    renderWithQueryClient(<PerformanceMetrics userId={1} />);
    
    // Check strategy type chips
    expect(screen.getByText('TREND_FOLLOWING')).toBeInTheDocument();
    expect(screen.getByText('MOMENTUM')).toBeInTheDocument();
  });

  it('displays execution type badges', () => {
    renderWithQueryClient(<PerformanceMetrics userId={1} />);
    
    // Check execution type badges
    expect(screen.getByText('BACKTEST')).toBeInTheDocument();
    expect(screen.getByText('LIVE_TRADING')).toBeInTheDocument();
  });

  it('formats dates correctly', () => {
    renderWithQueryClient(<PerformanceMetrics userId={1} />);
    
    // Check formatted dates
    expect(screen.getByText('Jan 31, 2024')).toBeInTheDocument();
    expect(screen.getByText('Feb 28, 2024')).toBeInTheDocument();
  });
});
