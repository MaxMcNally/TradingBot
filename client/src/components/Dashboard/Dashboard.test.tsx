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

  it('shows error state when user loading fails', () => {
    (useUser as vi.Mock).mockReturnValue({
      user: null,
      isLoading: false,
      error: new Error('Failed to load user'),
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
    
    // Click on Portfolio Overview tab
    const portfolioOverviewTab = screen.getByRole('tab', { name: /portfolio overview/i });
    fireEvent.click(portfolioOverviewTab);

    // Assert Portfolio Overview content (unique text in panel)
    expect(
      screen.getByText('Your current portfolio holdings and performance metrics will be displayed here.')
    ).toBeInTheDocument();
    expect(screen.queryByTestId('trading-results')).not.toBeInTheDocument();

    // Click on Performance Metrics tab
    const performanceMetricsTab = screen.getByRole('tab', { name: /performance metrics/i });
    fireEvent.click(performanceMetricsTab);

    // Assert Performance Metrics content (unique text in panel)
    expect(
      screen.getByText('Detailed performance analytics and trading statistics will be displayed here.')
    ).toBeInTheDocument();
    expect(
      screen.queryByText('Your current portfolio holdings and performance metrics will be displayed here.')
    ).not.toBeInTheDocument();
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
    
    // Switch to Portfolio Overview tab
    const portfolioOverviewTab = screen.getByRole('tab', { name: /portfolio overview/i });
    fireEvent.click(portfolioOverviewTab);

    expect(
      screen.getByText('Your current portfolio holdings and performance metrics will be displayed here.')
    ).toBeInTheDocument();

    // Switch back to Trading Results
    const tradingResultsTab = screen.getByRole('tab', { name: /trading results/i });
    fireEvent.click(tradingResultsTab);
    
    expect(screen.getByTestId('trading-results')).toBeInTheDocument();
    expect(
      screen.queryByText('Your current portfolio holdings and performance metrics will be displayed here.')
    ).not.toBeInTheDocument();
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
    
    const portfolioOverviewTab = screen.getByRole('tab', { name: /portfolio overview/i });
    expect(portfolioOverviewTab).toHaveAttribute('id', 'dashboard-tab-1');
    expect(portfolioOverviewTab).toHaveAttribute('aria-controls', 'dashboard-tabpanel-1');
  });
});
