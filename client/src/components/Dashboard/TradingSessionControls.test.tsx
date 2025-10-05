import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TradingSessionControls from './TradingSessionControls';
import { useUser } from '../../hooks';
import * as tradingApi from '../../api/tradingApi';

// Mock the hooks
jest.mock('../../hooks', () => ({
  useUser: jest.fn(),
}));

// Mock the trading API
jest.mock('../../api/tradingApi', () => ({
  checkActiveSession: jest.fn(),
  startTradingSession: jest.fn(),
  stopTradingSession: jest.fn(),
  pauseTradingSession: jest.fn(),
  resumeTradingSession: jest.fn(),
}));

// Mock the child components
jest.mock('../shared', () => ({
  StockPicker: function MockStockPicker({ selectedStocks, onStocksChange }: any) {
    return (
      <div data-testid="stock-picker">
        <div>Selected: {selectedStocks.join(', ')}</div>
        <button onClick={() => onStocksChange(['AAPL', 'GOOGL'])}>
          Add Test Symbols
        </button>
      </div>
    );
  },
  StrategySelector: function MockStrategySelector({ 
    selectedStrategy, 
    onStrategyChange, 
    strategyParameters, 
    onParametersChange 
  }: any) {
    return (
      <div data-testid="strategy-selector">
        <div>Selected: {selectedStrategy}</div>
        <div>Parameters: {JSON.stringify(strategyParameters)}</div>
        <button onClick={() => onStrategyChange('movingAverage')}>
          Change Strategy
        </button>
        <button onClick={() => onParametersChange({ window: 15, threshold: 0.03 })}>
          Update Parameters
        </button>
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

describe('TradingSessionControls Component', () => {
  const mockUser = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    name: 'Test User',
  };

  const mockActiveSession = {
    id: 1,
    userId: 1,
    startTime: '2023-01-01T10:00:00Z',
    endTime: null,
    mode: 'PAPER',
    initialCash: 10000,
    status: 'ACTIVE',
    totalTrades: 5,
    winningTrades: 3,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    (useUser as jest.Mock).mockReturnValue({
      user: mockUser,
      isLoading: false,
      error: null,
    });

    (tradingApi.checkActiveSession as jest.Mock).mockResolvedValue({
      data: { session: null }
    });
  });

  it('renders session controls interface correctly', () => {
    renderWithQueryClient(<TradingSessionControls />);
    
    expect(screen.getByText('Trading Session Controls')).toBeInTheDocument();
    expect(screen.getByText('Configure and manage your trading sessions')).toBeInTheDocument();
  });

  it('shows loading state when user is loading', () => {
    (useUser as jest.Mock).mockReturnValue({
      user: null,
      isLoading: true,
      error: null,
    });

    renderWithQueryClient(<TradingSessionControls />);
    
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows error state when user loading fails', () => {
    (useUser as jest.Mock).mockReturnValue({
      user: null,
      isLoading: false,
      error: 'Failed to load user',
    });

    renderWithQueryClient(<TradingSessionControls />);
    
    expect(screen.getByText('Failed to load user')).toBeInTheDocument();
  });

  it('displays market status information', async () => {
    renderWithQueryClient(<TradingSessionControls />);
    
    await waitFor(() => {
      expect(screen.getByText(/Market Status:/)).toBeInTheDocument();
    });
  });

  it('shows session configuration form when no active session', async () => {
    renderWithQueryClient(<TradingSessionControls />);
    
    await waitFor(() => {
      expect(screen.getByText('Session Configuration')).toBeInTheDocument();
      expect(screen.getByText('Trading Mode')).toBeInTheDocument();
      expect(screen.getByText('Initial Capital')).toBeInTheDocument();
      expect(screen.getByText('Symbol Selection')).toBeInTheDocument();
      expect(screen.getByText('Strategy Selection')).toBeInTheDocument();
    });
  });

  it('shows active session controls when session is active', async () => {
    (tradingApi.checkActiveSession as jest.Mock).mockResolvedValue({
      data: { session: mockActiveSession }
    });

    renderWithQueryClient(<TradingSessionControls />);
    
    await waitFor(() => {
      expect(screen.getByText('Active Session')).toBeInTheDocument();
      expect(screen.getByText('Session Status: ACTIVE')).toBeInTheDocument();
      expect(screen.getByText('Stop Session')).toBeInTheDocument();
    });
  });

  it('handles session mode selection', async () => {
    renderWithQueryClient(<TradingSessionControls />);
    
    await waitFor(() => {
      const paperModeRadio = screen.getByDisplayValue('PAPER');
      const liveModeRadio = screen.getByDisplayValue('LIVE');
      
      expect(paperModeRadio).toBeInTheDocument();
      expect(liveModeRadio).toBeInTheDocument();
      
      fireEvent.click(liveModeRadio);
      expect(liveModeRadio).toBeChecked();
    });
  });

  it('handles initial capital input', async () => {
    renderWithQueryClient(<TradingSessionControls />);
    
    await waitFor(() => {
      const capitalInput = screen.getByLabelText('Initial Capital');
      fireEvent.change(capitalInput, { target: { value: '15000' } });
      
      expect(capitalInput).toHaveValue(15000);
    });
  });

  it('handles scheduled end time toggle', async () => {
    renderWithQueryClient(<TradingSessionControls />);
    
    await waitFor(() => {
      const enableScheduledEndSwitch = screen.getByLabelText('Enable Scheduled End Time');
      
      fireEvent.click(enableScheduledEndSwitch);
      expect(enableScheduledEndSwitch).toBeChecked();
      
      // Should show datetime input
      expect(screen.getByLabelText('Session End Time')).toBeInTheDocument();
    });
  });

  it('handles scheduled end time input', async () => {
    renderWithQueryClient(<TradingSessionControls />);
    
    await waitFor(() => {
      const enableScheduledEndSwitch = screen.getByLabelText('Enable Scheduled End Time');
      fireEvent.click(enableScheduledEndSwitch);
      
      const endTimeInput = screen.getByLabelText('Session End Time');
      fireEvent.change(endTimeInput, { target: { value: '2023-12-31T16:00' } });
      
      expect(endTimeInput).toHaveValue('2023-12-31T16:00');
    });
  });

  it('starts trading session with correct parameters', async () => {
    (tradingApi.startTradingSession as jest.Mock).mockResolvedValue({
      data: { session: mockActiveSession }
    });

    renderWithQueryClient(<TradingSessionControls />);
    
    await waitFor(() => {
      // Configure session
      const capitalInput = screen.getByLabelText('Initial Capital');
      fireEvent.change(capitalInput, { target: { value: '15000' } });
      
      // Add symbols
      const addSymbolsButton = screen.getByText('Add Test Symbols');
      fireEvent.click(addSymbolsButton);
      
      // Start session
      const startButton = screen.getByText('Start Trading Session');
      fireEvent.click(startButton);
    });

    await waitFor(() => {
      expect(tradingApi.startTradingSession).toHaveBeenCalledWith({
        userId: 1,
        mode: 'PAPER',
        initialCash: 15000,
        symbols: ['AAPL', 'GOOGL'],
        strategy: 'meanReversion',
        strategyParameters: { window: 20, threshold: 0.05 },
        scheduledEndTime: undefined,
      });
    });
  });

  it('starts trading session with scheduled end time', async () => {
    (tradingApi.startTradingSession as jest.Mock).mockResolvedValue({
      data: { session: mockActiveSession }
    });

    renderWithQueryClient(<TradingSessionControls />);
    
    await waitFor(() => {
      // Enable scheduled end time
      const enableScheduledEndSwitch = screen.getByLabelText('Enable Scheduled End Time');
      fireEvent.click(enableScheduledEndSwitch);
      
      const endTimeInput = screen.getByLabelText('Session End Time');
      fireEvent.change(endTimeInput, { target: { value: '2023-12-31T16:00' } });
      
      // Add symbols
      const addSymbolsButton = screen.getByText('Add Test Symbols');
      fireEvent.click(addSymbolsButton);
      
      // Start session
      const startButton = screen.getByText('Start Trading Session');
      fireEvent.click(startButton);
    });

    await waitFor(() => {
      expect(tradingApi.startTradingSession).toHaveBeenCalledWith({
        userId: 1,
        mode: 'PAPER',
        initialCash: 10000,
        symbols: ['AAPL', 'GOOGL'],
        strategy: 'meanReversion',
        strategyParameters: { window: 20, threshold: 0.05 },
        scheduledEndTime: '2023-12-31T16:00',
      });
    });
  });

  it('stops active trading session', async () => {
    (tradingApi.checkActiveSession as jest.Mock).mockResolvedValue({
      data: { session: mockActiveSession }
    });
    (tradingApi.stopTradingSession as jest.Mock).mockResolvedValue({
      data: { success: true }
    });

    renderWithQueryClient(<TradingSessionControls />);
    
    await waitFor(() => {
      const stopButton = screen.getByText('Stop Session');
      fireEvent.click(stopButton);
    });

    await waitFor(() => {
      expect(tradingApi.stopTradingSession).toHaveBeenCalledWith(1);
    });
  });

  it('shows validation errors for invalid input', async () => {
    renderWithQueryClient(<TradingSessionControls />);
    
    await waitFor(() => {
      // Try to start session without symbols
      const startButton = screen.getByText('Start Trading Session');
      fireEvent.click(startButton);
      
      expect(screen.getByText('Please select at least one symbol')).toBeInTheDocument();
    });
  });

  it('shows error when starting session fails', async () => {
    (tradingApi.startTradingSession as jest.Mock).mockRejectedValue(
      new Error('Failed to start session')
    );

    renderWithQueryClient(<TradingSessionControls />);
    
    await waitFor(() => {
      // Add symbols first
      const addSymbolsButton = screen.getByText('Add Test Symbols');
      fireEvent.click(addSymbolsButton);
      
      // Start session
      const startButton = screen.getByText('Start Trading Session');
      fireEvent.click(startButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Failed to start session')).toBeInTheDocument();
    });
  });

  it('shows error when stopping session fails', async () => {
    (tradingApi.checkActiveSession as jest.Mock).mockResolvedValue({
      data: { session: mockActiveSession }
    });
    (tradingApi.stopTradingSession as jest.Mock).mockRejectedValue(
      new Error('Failed to stop session')
    );

    renderWithQueryClient(<TradingSessionControls />);
    
    await waitFor(() => {
      const stopButton = screen.getByText('Stop Session');
      fireEvent.click(stopButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Failed to stop session')).toBeInTheDocument();
    });
  });

  it('displays session review before starting', async () => {
    renderWithQueryClient(<TradingSessionControls />);
    
    await waitFor(() => {
      // Configure session
      const capitalInput = screen.getByLabelText('Initial Capital');
      fireEvent.change(capitalInput, { target: { value: '15000' } });
      
      // Add symbols
      const addSymbolsButton = screen.getByText('Add Test Symbols');
      fireEvent.click(addSymbolsButton);
      
      // Should show review section
      expect(screen.getByText('Session Review')).toBeInTheDocument();
      expect(screen.getByText('Trading Mode: PAPER')).toBeInTheDocument();
      expect(screen.getByText('Initial Capital: $15,000')).toBeInTheDocument();
      expect(screen.getByText('Selected Symbols: AAPL, GOOGL')).toBeInTheDocument();
    });
  });

  it('handles strategy parameter changes', async () => {
    renderWithQueryClient(<TradingSessionControls />);
    
    await waitFor(() => {
      // Update strategy parameters
      const updateParamsButton = screen.getByText('Update Parameters');
      fireEvent.click(updateParamsButton);
      
      // Should show updated parameters in review
      expect(screen.getByText('Strategy Parameters: {"window":15,"threshold":0.03}')).toBeInTheDocument();
    });
  });

  it('handles strategy changes', async () => {
    renderWithQueryClient(<TradingSessionControls />);
    
    await waitFor(() => {
      // Change strategy
      const changeStrategyButton = screen.getByText('Change Strategy');
      fireEvent.click(changeStrategyButton);
      
      // Should show new strategy in review
      expect(screen.getByText('Strategy: movingAverage')).toBeInTheDocument();
    });
  });
});
