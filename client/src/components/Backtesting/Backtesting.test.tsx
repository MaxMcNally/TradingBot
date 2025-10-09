import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import Backtesting from './Backtesting';

// Mock the hooks
vi.mock('../../hooks', () => ({
  useUser: vi.fn(),
  useStrategies: vi.fn(),
  useBacktest: vi.fn(),
  useUserStrategies: vi.fn(),
}));


import { useUser, useStrategies, useBacktest, useUserStrategies } from '../../hooks';

// Mock child components
vi.mock('./StockSelectionSection', () => ({
  default: function MockStockSelectionSection({ onStocksChange }: { onStocksChange: (stocks: string[]) => void }) {
    return (
      <div data-testid="stock-selection">
        <button onClick={() => onStocksChange(['AAPL', 'GOOGL'])}>
          Select Stocks
        </button>
      </div>
    );
  },
}));

vi.mock('./StrategySelectionSection', () => ({
  default: function MockStrategySelectionSection({ onStrategyChange }: { onStrategyChange: (strategy: string) => void }) {
    return (
      <div data-testid="strategy-selection">
        <button onClick={() => onStrategyChange('movingAverageCrossover')}>
          Select Strategy
        </button>
      </div>
    );
  },
}));

vi.mock('./StrategyParametersSection', () => ({
  default: function MockStrategyParametersSection({ 
    strategy, 
    onParametersChange 
  }: { 
    strategy: string; 
    onParametersChange: (params: any) => void;
  }) {
    return (
      <div data-testid="strategy-parameters">
        <span>Strategy: {strategy}</span>
        <button onClick={() => onParametersChange({ shortPeriod: 10, longPeriod: 20 })}>
          Set Parameters
        </button>
      </div>
    );
  },
}));

vi.mock('./SessionSummary', () => ({
  default: function MockSessionSummary({ 
    title, 
    selectedStocks, 
    selectedStrategy, 
    strategyParameters 
  }: { 
    title: string;
    selectedStocks: string[];
    selectedStrategy: string;
    strategyParameters: any;
  }) {
    return (
      <div data-testid="session-summary">
        <h3>{title}</h3>
        <p>Stocks: {selectedStocks.join(', ')}</p>
        <p>Strategy: {selectedStrategy}</p>
        <p>Parameters: {JSON.stringify(strategyParameters)}</p>
      </div>
    );
  },
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

describe('Backtesting Component', () => {
  const mockUser = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    name: 'Test User',
  };

  const mockBacktestResult = {
    totalReturn: 0.125,
    totalReturnDollar: 1250.75,
    maxDrawdown: -0.05,
    sharpeRatio: 1.25,
    winRate: 0.68,
    totalTrades: 25,
    trades: [
      {
        date: '2024-01-15',
        symbol: 'AAPL',
        action: 'BUY',
        shares: 10,
        price: 150.25,
        value: 1502.50
      }
    ]
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementations
    (useUser as vi.Mock).mockReturnValue({
      user: mockUser,
      isLoading: false,
      error: null,
    });
    
    (useStrategies as vi.Mock).mockReturnValue({
      strategies: [
        { id: 1, name: 'movingAverageCrossover', displayName: 'Moving Average Crossover' },
        { id: 2, name: 'bollinger', displayName: 'Bollinger Bands' }
      ],
      isLoading: false,
      isError: false,
    });
    
    (useBacktest as vi.Mock).mockReturnValue({
      runBacktest: vi.fn(),
      isLoading: false,
      error: null,
    });
    
    (useUserStrategies as vi.Mock).mockReturnValue({
      saveFromBacktest: vi.fn(),
      isCreating: false,
    });
  });

  it('renders backtesting component with correct tabs', () => {
    renderWithQueryClient(<Backtesting />);
    
    expect(screen.getByRole('heading', { name: 'Backtesting' })).toBeInTheDocument();
    expect(screen.getByText('Test your trading strategies with historical data')).toBeInTheDocument();

    // Check for tab navigation
    expect(screen.getByRole('tab', { name: /stock selection/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /strategy selection/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /strategy parameters/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /run test/i })).toBeInTheDocument();
  });

  it('switches between tabs correctly', () => {
    renderWithQueryClient(<Backtesting />);
    
    // Initially on Stock Selection tab
    expect(screen.getByTestId('stock-selection')).toBeInTheDocument();
    
    // Click on Strategy Selection tab
    const strategySelectionTab = screen.getByRole('tab', { name: /strategy selection/i });
    fireEvent.click(strategySelectionTab);
    
    expect(screen.getByTestId('strategy-selection')).toBeInTheDocument();
    expect(screen.queryByTestId('stock-selection')).not.toBeInTheDocument();
    
    // Click on Strategy Parameters tab
    const strategyParametersTab = screen.getByRole('tab', { name: /strategy parameters/i });
    fireEvent.click(strategyParametersTab);
    
    expect(screen.getByTestId('strategy-parameters')).toBeInTheDocument();
    expect(screen.queryByTestId('strategy-selection')).not.toBeInTheDocument();
    
    // Click on Run Test tab
    const runTestTab = screen.getByRole('tab', { name: /run test/i });
    fireEvent.click(runTestTab);
    
    expect(screen.getByText('Run Backtest')).toBeInTheDocument();
    expect(screen.queryByTestId('strategy-parameters')).not.toBeInTheDocument();
  });

  it('displays backtest configuration in Run Test tab', () => {
    renderWithQueryClient(<Backtesting />);
    
    // Navigate to Run Test tab
    const runTestTab = screen.getByRole('tab', { name: /run test/i });
    fireEvent.click(runTestTab);
    
    // Check for backtest configuration elements
    expect(screen.getByText('Backtest Configuration')).toBeInTheDocument();
    expect(screen.getByText('Date Range')).toBeInTheDocument();
    expect(screen.getByText('Trading Parameters')).toBeInTheDocument();
    expect(screen.getByText('Start Date')).toBeInTheDocument();
    expect(screen.getByText('End Date')).toBeInTheDocument();
    expect(screen.getByText('Initial Capital')).toBeInTheDocument();
    expect(screen.getByText('Shares Per Trade')).toBeInTheDocument();
  });

  it('shows CTA message in Run Test tab when no results', () => {
    renderWithQueryClient(<Backtesting />);
    
    // Navigate to Run Test tab
    const runTestTab = screen.getByRole('tab', { name: /run test/i });
    fireEvent.click(runTestTab);
    
    // Check for CTA message
    expect(screen.getByText('Ready to run your backtest?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /run backtest/i })).toBeInTheDocument();
  });

  it('handles stock selection', () => {
    renderWithQueryClient(<Backtesting />);
    
    // Select stocks
    const selectStocksButton = screen.getByText('Select Stocks');
    fireEvent.click(selectStocksButton);
    
    // Check that stocks are selected (this would be reflected in the session summary)
    expect(screen.getByText('Stocks: AAPL, GOOGL')).toBeInTheDocument();
  });

  it('handles strategy selection', () => {
    renderWithQueryClient(<Backtesting />);
    
    // Navigate to Strategy Selection tab
    const strategySelectionTab = screen.getByRole('tab', { name: /strategy selection/i });
    fireEvent.click(strategySelectionTab);
    
    // Select strategy
    const selectStrategyButton = screen.getByText('Select Strategy');
    fireEvent.click(selectStrategyButton);
    
    // Check that strategy is selected
    expect(screen.getByText('Strategy: movingAverageCrossover')).toBeInTheDocument();
  });

  it('handles strategy parameters', () => {
    renderWithQueryClient(<Backtesting />);
    
    // First select a strategy
    const strategySelectionTab = screen.getByRole('tab', { name: /strategy selection/i });
    fireEvent.click(strategySelectionTab);
    const selectStrategyButton = screen.getByText('Select Strategy');
    fireEvent.click(selectStrategyButton);
    
    // Navigate to Strategy Parameters tab
    const strategyParametersTab = screen.getByRole('tab', { name: /strategy parameters/i });
    fireEvent.click(strategyParametersTab);
    
    // Set parameters
    const setParametersButton = screen.getByText('Set Parameters');
    fireEvent.click(setParametersButton);
    
    // Check that parameters are set
    expect(screen.getByText(/Parameters: .*shortPeriod.*10.*longPeriod.*20/)).toBeInTheDocument();
  });

  it('shows loading state when running backtest', () => {
    (useBacktest as vi.Mock).mockReturnValue({
      runBacktest: vi.fn(),
      isLoading: true,
      error: null,
    });

    renderWithQueryClient(<Backtesting />);
    
    // Navigate to Run Test tab
    const runTestTab = screen.getByRole('tab', { name: /run test/i });
    fireEvent.click(runTestTab);
    
    expect(screen.getByText('Running Backtest...')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows error state when backtest fails', () => {
    (useBacktest as vi.Mock).mockReturnValue({
      runBacktest: vi.fn(),
      isLoading: false,
      error: new Error('Backtest failed'),
    });

    renderWithQueryClient(<Backtesting />);
    
    expect(screen.getByText('Backtest failed')).toBeInTheDocument();
  });

  it('displays backtest results when available', () => {
    const mockRunBacktest = vi.fn().mockResolvedValue(mockBacktestResult);
    (useBacktest as vi.Mock).mockReturnValue({
      runBacktest: mockRunBacktest,
      isLoading: false,
      error: null,
    });

    renderWithQueryClient(<Backtesting />);
    
    // Navigate to Run Test tab
    const runTestTab = screen.getByRole('tab', { name: /run test/i });
    fireEvent.click(runTestTab);
    
    // The results would be displayed when runBacktest is called
    // This would require more complex setup to simulate the actual backtest execution
  });

  it('has proper accessibility attributes for tabs', () => {
    renderWithQueryClient(<Backtesting />);
    
    const stockSelectionTab = screen.getByRole('tab', { name: /stock selection/i });
    expect(stockSelectionTab).toHaveAttribute('id', 'backtest-tab-0');
    expect(stockSelectionTab).toHaveAttribute('aria-controls', 'backtest-tabpanel-0');
    
    const runTestTab = screen.getByRole('tab', { name: /run test/i });
    expect(runTestTab).toHaveAttribute('id', 'backtest-tab-3');
    expect(runTestTab).toHaveAttribute('aria-controls', 'backtest-tabpanel-3');
  });

  it('displays session summary with correct information', () => {
    renderWithQueryClient(<Backtesting />);
    
    expect(screen.getByText('Backtest Configuration')).toBeInTheDocument();
    expect(screen.getByTestId('session-summary')).toBeInTheDocument();
  });
});
