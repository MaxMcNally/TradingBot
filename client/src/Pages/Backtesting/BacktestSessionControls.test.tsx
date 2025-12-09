import { vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import BacktestSessionControls from './BacktestSessionControls';
import { runBacktest } from '../../api';
import { UnifiedStrategy } from '../../components/shared';

// Mock the API
vi.mock('../../api', () => ({
  runBacktest: vi.fn()
}));

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

describe('BacktestSessionControls', () => {
  const mockOnBacktestStarted = vi.fn();
  const mockOnBacktestCompleted = vi.fn();

  const defaultProps = {
    selectedStocks: ['AAPL'],
    selectedBot: {
      id: 1,
      name: 'Test Bot',
      type: 'user' as const,
      strategy_type: 'meanReversion'
    } as UnifiedStrategy,
    strategyParameters: {},
    onBacktestStarted: mockOnBacktestStarted,
    onBacktestCompleted: mockOnBacktestCompleted
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders backtest configuration form', () => {
    renderWithQueryClient(<BacktestSessionControls {...defaultProps} />);

    expect(screen.getByLabelText(/start date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/end date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/initial capital/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/shares per trade/i)).toBeInTheDocument();
  });

  it('disables run button when no stocks selected', () => {
    renderWithQueryClient(
      <BacktestSessionControls
        {...defaultProps}
        selectedStocks={[]}
      />
    );

    const runButton = screen.getByRole('button', { name: /run backtest/i });
    expect(runButton).toBeDisabled();
  });

  it('disables run button when no bot selected', () => {
    renderWithQueryClient(
      <BacktestSessionControls
        {...defaultProps}
        selectedBot={null}
      />
    );

    const runButton = screen.getByRole('button', { name: /run backtest/i });
    expect(runButton).toBeDisabled();
  });

  it('runs backtest with user strategy', async () => {
    const mockResponse = {
      data: {
        success: true,
        data: {
          strategy: 'meanReversion',
          symbols: ['AAPL'],
          results: [],
          totalReturn: 0.05,
          finalPortfolioValue: 10500,
          winRate: 0.6,
          totalTrades: 10,
          maxDrawdown: 0.1
        }
      }
    };

    (runBacktest as any).mockResolvedValue(mockResponse);

    renderWithQueryClient(<BacktestSessionControls {...defaultProps} />);

    const runButton = screen.getByRole('button', { name: /run backtest/i });
    fireEvent.click(runButton);

    await waitFor(() => {
      expect(runBacktest).toHaveBeenCalledWith(
        expect.objectContaining({
          strategy: 'meanReversion',
          symbols: ['AAPL']
        })
      );
    });

    expect(mockOnBacktestStarted).toHaveBeenCalled();
    await waitFor(() => {
      expect(mockOnBacktestCompleted).toHaveBeenCalled();
    });
  });

  it('runs backtest with custom strategy', async () => {
    const customBot: UnifiedStrategy = {
      id: 1,
      name: 'Custom Strategy',
      type: 'custom',
      buy_conditions: {
        type: 'indicator',
        indicator: {
          type: 'rsi',
          params: { period: 14 },
          condition: 'below',
          value: 30
        }
      },
      sell_conditions: {
        type: 'indicator',
        indicator: {
          type: 'rsi',
          params: { period: 14 },
          condition: 'above',
          value: 70
        }
      }
    } as UnifiedStrategy;

    const mockResponse = {
      data: {
        success: true,
        data: {
          strategy: 'custom',
          symbols: ['AAPL'],
          results: [],
          totalReturn: 0.05,
          finalPortfolioValue: 10500,
          winRate: 0.6,
          totalTrades: 10,
          maxDrawdown: 0.1
        }
      }
    };

    (runBacktest as any).mockResolvedValue(mockResponse);

    renderWithQueryClient(
      <BacktestSessionControls
        {...defaultProps}
        selectedBot={customBot}
      />
    );

    const runButton = screen.getByRole('button', { name: /run backtest/i });
    fireEvent.click(runButton);

    await waitFor(() => {
      expect(runBacktest).toHaveBeenCalledWith(
        expect.objectContaining({
          strategy: 'custom',
          symbols: ['AAPL'],
          customStrategy: expect.objectContaining({
            id: 1,
            buy_conditions: expect.any(Object),
            sell_conditions: expect.any(Object)
          })
        })
      );
    });

    expect(mockOnBacktestStarted).toHaveBeenCalled();
  });

  it('shows error when custom strategy is missing conditions', async () => {
    const invalidCustomBot: UnifiedStrategy = {
      id: 1,
      name: 'Invalid Custom Strategy',
      type: 'custom'
      // Missing buy_conditions and sell_conditions
    } as UnifiedStrategy;

    renderWithQueryClient(
      <BacktestSessionControls
        {...defaultProps}
        selectedBot={invalidCustomBot}
      />
    );

    const runButton = screen.getByRole('button', { name: /run backtest/i });
    fireEvent.click(runButton);

    await waitFor(() => {
      expect(screen.getByText(/custom strategy is missing/i)).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    (runBacktest as any).mockRejectedValue({
      response: {
        data: {
          error: 'Backtest failed'
        }
      }
    });

    renderWithQueryClient(<BacktestSessionControls {...defaultProps} />);

    const runButton = screen.getByRole('button', { name: /run backtest/i });
    fireEvent.click(runButton);

    await waitFor(() => {
      expect(screen.getByText(/backtest failed/i)).toBeInTheDocument();
    });
  });

  it('updates form values correctly', () => {
    renderWithQueryClient(<BacktestSessionControls {...defaultProps} />);

    const startDateInput = screen.getByLabelText(/start date/i) as HTMLInputElement;
    const endDateInput = screen.getByLabelText(/end date/i) as HTMLInputElement;
    const capitalInput = screen.getByLabelText(/initial capital/i) as HTMLInputElement;
    const sharesInput = screen.getByLabelText(/shares per trade/i) as HTMLInputElement;

    fireEvent.change(startDateInput, { target: { value: '2023-01-01' } });
    fireEvent.change(endDateInput, { target: { value: '2023-12-31' } });
    fireEvent.change(capitalInput, { target: { value: '20000' } });
    fireEvent.change(sharesInput, { target: { value: '200' } });

    expect(startDateInput.value).toBe('2023-01-01');
    expect(endDateInput.value).toBe('2023-12-31');
    expect(capitalInput.value).toBe('20000');
    expect(sharesInput.value).toBe('200');
  });
});

