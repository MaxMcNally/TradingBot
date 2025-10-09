import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import Dashboard from './Dashboard';
import { useUser } from '../../hooks';
import { useTradingStats } from '../../hooks/useTrading/useTrading';

// Mock the hooks
vi.mock('../../hooks', () => ({
  useUser: vi.fn(),
}));

vi.mock('../../hooks/useTrading/useTrading', () => ({
  useTradingStats: vi.fn(),
}));

// Mock the child components
vi.mock('./TradingResults', () => ({
  default: function MockTradingResults({ userId }: { userId: number }) {
    return <div data-testid="trading-results">Trading Results for User {userId}</div>;
  },
}));

vi.mock('./TradingSessionControls', () => ({
  default: function MockTradingSessionControls() {
    return <div data-testid="trading-session-controls">Trading Session Controls</div>;
  },
}));

vi.mock('./TestDataManager', () => ({
  default: function MockTestDataManager() {
    return <div data-testid="test-data-manager">Test Data Manager</div>;
  },
}));

vi.mock('./PortfolioOverview', () => ({
  default: function MockPortfolioOverview({ userId }: { userId: number }) {
    return <div data-testid="portfolio-overview">Portfolio Overview for User {userId}</div>;
  },
}));

vi.mock('./PerformanceMetrics', () => ({
  default: function MockPerformanceMetrics({ userId }: { userId: number }) {
    return <div data-testid="performance-metrics">Performance Metrics for User {userId}</div>;
  },
}));

// Note: Do not mock '../shared' so the real TabPanel is used

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

  const mockStats = {
    totalTrades: 25,
    totalPnL: 1250.75,
    winRate: 0.68,
    activeSessions: 2,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementations
    (useUser as vi.Mock).mockReturnValue({
      user: mockUser,
      isLoading: false,
      error: null,
    });
    
    (useTradingStats as vi.Mock).mockReturnValue({
      stats: mockStats,
      isLoading: false,
      isError: false,
    });
  });

  it('renders dashboard with tabs correctly', () => {
    renderWithQueryClient(<Dashboard />);
    
    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.getByText('Welcome back, Test User! Monitor your portfolio performance and trading results.')).toBeInTheDocument();

    // Check for tab navigation (updated labels)
    expect(screen.getByRole('tab', { name: /trading results/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /portfolio overview/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /performance metrics/i })).toBeInTheDocument();
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

  it('shows loading state when stats are loading', () => {
    (useTradingStats as vi.Mock).mockReturnValue({
      stats: null,
      isLoading: true,
      isError: false,
    });

    renderWithQueryClient(<Dashboard />);
    
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows error state when user loading fails', () => {
    (useUser as vi.Mock).mockReturnValue({
      user: null,
      isLoading: false,
      error: new Error('Failed to load user'),
    });

    renderWithQueryClient(<Dashboard />);
    
    expect(screen.getByText('Failed to load user')).toBeInTheDocument();
  });

  it('shows error state when stats loading fails', () => {
    (useTradingStats as vi.Mock).mockReturnValue({
      stats: null,
      isLoading: false,
      isError: true,
    });

    renderWithQueryClient(<Dashboard />);
    
    expect(screen.getByText('Failed to load trading statistics')).toBeInTheDocument();
  });

  it('switches between tabs correctly', () => {
    renderWithQueryClient(<Dashboard />);
    
    // Initially on Trading Results tab
    expect(screen.getByTestId('trading-results')).toBeInTheDocument();
    
    // Click on Portfolio Overview tab
    const portfolioOverviewTab = screen.getByRole('tab', { name: /portfolio overview/i });
    fireEvent.click(portfolioOverviewTab);

    // Assert Portfolio Overview content
    expect(screen.getByTestId('portfolio-overview')).toBeInTheDocument();
    expect(screen.queryByTestId('trading-results')).not.toBeInTheDocument();

    // Click on Performance Metrics tab
    const performanceMetricsTab = screen.getByRole('tab', { name: /performance metrics/i });
    fireEvent.click(performanceMetricsTab);

    // Assert Performance Metrics content
    expect(screen.getByTestId('performance-metrics')).toBeInTheDocument();
    expect(screen.queryByTestId('portfolio-overview')).not.toBeInTheDocument();
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
    
    expect(screen.getByText('Welcome back, User! Monitor your portfolio performance and trading results.')).toBeInTheDocument();
  });

  it('passes correct userId to TradingResults component', () => {
    renderWithQueryClient(<Dashboard />);
    
    expect(screen.getByText('Trading Results for User 1')).toBeInTheDocument();
  });

  it('maintains tab state when switching between tabs', () => {
    renderWithQueryClient(<Dashboard />);
    
    // Switch to Portfolio Overview tab
    const portfolioOverviewTab = screen.getByRole('tab', { name: /portfolio overview/i });
    fireEvent.click(portfolioOverviewTab);

    expect(screen.getByTestId('portfolio-overview')).toBeInTheDocument();

    // Switch back to Trading Results
    const tradingResultsTab = screen.getByRole('tab', { name: /trading results/i });
    fireEvent.click(tradingResultsTab);
    
    expect(screen.getByTestId('trading-results')).toBeInTheDocument();
    expect(screen.queryByTestId('portfolio-overview')).not.toBeInTheDocument();
  });

  it('has proper accessibility attributes for tabs', () => {
    renderWithQueryClient(<Dashboard />);
    
    const tradingResultsTab = screen.getByRole('tab', { name: /trading results/i });
    expect(tradingResultsTab).toHaveAttribute('id', 'dashboard-tab-0');
    expect(tradingResultsTab).toHaveAttribute('aria-controls', 'dashboard-tabpanel-0');
    
    const portfolioOverviewTab = screen.getByRole('tab', { name: /portfolio overview/i });
    expect(portfolioOverviewTab).toHaveAttribute('id', 'dashboard-tab-1');
    expect(portfolioOverviewTab).toHaveAttribute('aria-controls', 'dashboard-tabpanel-1');
  });

  it('displays live trading statistics in quick stats cards', () => {
    renderWithQueryClient(<Dashboard />);
    
    // Check that live data is displayed in the quick stats cards
    expect(screen.getByText('Total Sessions')).toBeInTheDocument();
    expect(screen.getByText('Total P&L')).toBeInTheDocument();
    expect(screen.getByText('Win Rate')).toBeInTheDocument();
    expect(screen.getByText('Active Sessions')).toBeInTheDocument();
    
    // Check that the values are displayed (using getAllByText since there are multiple instances)
    const totalPnLValues = screen.getAllByText('$1,250.75');
    expect(totalPnLValues.length).toBeGreaterThan(0);
    
    const winRateValues = screen.getAllByText('0.68%');
    expect(winRateValues.length).toBeGreaterThan(0);
  });

  it('displays live trading statistics in persistent sidebar', () => {
    renderWithQueryClient(<Dashboard />);
    
    // Check that live data is displayed in the persistent sidebar
    expect(screen.getByText('Total Sessions:')).toBeInTheDocument();
    expect(screen.getByText('Total P&L:')).toBeInTheDocument();
    expect(screen.getByText('Win Rate:')).toBeInTheDocument();
    expect(screen.getByText('Active Sessions:')).toBeInTheDocument();
    
    // Check that the values are displayed (using getAllByText since there are multiple instances)
    const totalSessionsValues = screen.getAllByText('25');
    expect(totalSessionsValues.length).toBeGreaterThan(0);
    
    const totalPnLValues = screen.getAllByText('$1,250.75');
    expect(totalPnLValues.length).toBeGreaterThan(0);
    
    const winRateValues = screen.getAllByText('0.68%');
    expect(winRateValues.length).toBeGreaterThan(0);
    
    const activeSessionsValues = screen.getAllByText('2');
    expect(activeSessionsValues.length).toBeGreaterThan(0);
  });
});
