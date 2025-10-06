import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import Dashboard from './Dashboard';
import { useUser } from '../../hooks';

// Mock the hooks
vi.mock('../../hooks', () => ({
  useUser: vi.fn(),
}));

// Mock the child components
vi.mock('./TradingResults', () => {
  return function MockTradingResults({ userId }: { userId: number }) {
    return <div data-testid="trading-results">Trading Results for User {userId}</div>;
  };
});

vi.mock('./TradingSessionControls', () => {
  return function MockTradingSessionControls() {
    return <div data-testid="trading-session-controls">Trading Session Controls</div>;
  };
});

vi.mock('./TestDataManager', () => {
  return function MockTestDataManager() {
    return <div data-testid="test-data-manager">Test Data Manager</div>;
  };
});

vi.mock('../shared', () => ({
  StockPicker: function MockStockPicker() {
    return <div data-testid="stock-picker">Stock Picker</div>;
  },
  StrategySelector: function MockStrategySelector() {
    return <div data-testid="strategy-selector">Strategy Selector</div>;
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

describe('Dashboard Component', () => {
  const mockUser = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    name: 'Test User',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dashboard with tabs correctly', () => {
    (useUser as vi.Mock).mockReturnValue({
      user: mockUser,
      isLoading: false,
      error: null,
    });

    renderWithQueryClient(<Dashboard />);
    
    expect(screen.getByText('Trading Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Welcome back, Test User! Manage your trading sessions and monitor performance.')).toBeInTheDocument();
    
    // Check for tab navigation
    expect(screen.getByRole('tab', { name: /trading results/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /stock selection/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /strategy configuration/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /session controls/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /test data/i })).toBeInTheDocument();
  });

  it('shows loading state when user is loading', () => {
    (useUser as vi.Mock).mockReturnValue({
      user: null,
      isLoading: true,
      error: null,
    });

    renderWithQueryClient(<Dashboard />);
    
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows error state when user loading fails', () => {
    (useUser as vi.Mock).mockReturnValue({
      user: null,
      isLoading: false,
      error: 'Failed to load user',
    });

    renderWithQueryClient(<Dashboard />);
    
    expect(screen.getByText('Failed to load user')).toBeInTheDocument();
  });

  it('switches between tabs correctly', () => {
    (useUser as vi.Mock).mockReturnValue({
      user: mockUser,
      isLoading: false,
      error: null,
    });

    renderWithQueryClient(<Dashboard />);
    
    // Initially on Trading Results tab
    expect(screen.getByTestId('trading-results')).toBeInTheDocument();
    
    // Click on Stock Selection tab
    const stockSelectionTab = screen.getByRole('tab', { name: /stock selection/i });
    fireEvent.click(stockSelectionTab);
    
    expect(screen.getByTestId('stock-picker')).toBeInTheDocument();
    expect(screen.queryByTestId('trading-results')).not.toBeInTheDocument();
    
    // Click on Strategy Configuration tab
    const strategyConfigTab = screen.getByRole('tab', { name: /strategy configuration/i });
    fireEvent.click(strategyConfigTab);
    
    expect(screen.getByTestId('strategy-selector')).toBeInTheDocument();
    expect(screen.queryByTestId('stock-picker')).not.toBeInTheDocument();
    
    // Click on Session Controls tab
    const sessionControlsTab = screen.getByRole('tab', { name: /session controls/i });
    fireEvent.click(sessionControlsTab);
    
    expect(screen.getByTestId('trading-session-controls')).toBeInTheDocument();
    expect(screen.queryByTestId('strategy-selector')).not.toBeInTheDocument();
    
    // Click on Test Data tab
    const testDataTab = screen.getByRole('tab', { name: /test data/i });
    fireEvent.click(testDataTab);
    
    expect(screen.getByTestId('test-data-manager')).toBeInTheDocument();
    expect(screen.queryByTestId('trading-session-controls')).not.toBeInTheDocument();
  });

  it('handles user without name gracefully', () => {
    const userWithoutName = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
    };

    (useUser as vi.Mock).mockReturnValue({
      user: userWithoutName,
      isLoading: false,
      error: null,
    });

    renderWithQueryClient(<Dashboard />);
    
    expect(screen.getByText('Welcome back, User! Manage your trading sessions and monitor performance.')).toBeInTheDocument();
  });

  it('passes correct userId to TradingResults component', () => {
    (useUser as vi.Mock).mockReturnValue({
      user: mockUser,
      isLoading: false,
      error: null,
    });

    renderWithQueryClient(<Dashboard />);
    
    expect(screen.getByText('Trading Results for User 1')).toBeInTheDocument();
  });

  it('maintains tab state when switching between tabs', () => {
    (useUser as vi.Mock).mockReturnValue({
      user: mockUser,
      isLoading: false,
      error: null,
    });

    renderWithQueryClient(<Dashboard />);
    
    // Switch to Test Data tab
    const testDataTab = screen.getByRole('tab', { name: /test data/i });
    fireEvent.click(testDataTab);
    
    expect(screen.getByTestId('test-data-manager')).toBeInTheDocument();
    
    // Switch back to Trading Results
    const tradingResultsTab = screen.getByRole('tab', { name: /trading results/i });
    fireEvent.click(tradingResultsTab);
    
    expect(screen.getByTestId('trading-results')).toBeInTheDocument();
    expect(screen.queryByTestId('test-data-manager')).not.toBeInTheDocument();
  });

  it('has proper accessibility attributes for tabs', () => {
    (useUser as vi.Mock).mockReturnValue({
      user: mockUser,
      isLoading: false,
      error: null,
    });

    renderWithQueryClient(<Dashboard />);
    
    const tradingResultsTab = screen.getByRole('tab', { name: /trading results/i });
    expect(tradingResultsTab).toHaveAttribute('id', 'dashboard-tab-0');
    expect(tradingResultsTab).toHaveAttribute('aria-controls', 'dashboard-tabpanel-0');
    
    const stockSelectionTab = screen.getByRole('tab', { name: /stock selection/i });
    expect(stockSelectionTab).toHaveAttribute('id', 'dashboard-tab-1');
    expect(stockSelectionTab).toHaveAttribute('aria-controls', 'dashboard-tabpanel-1');
  });
});
