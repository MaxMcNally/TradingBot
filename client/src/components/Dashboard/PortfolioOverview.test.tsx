import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import PortfolioOverview from './PortfolioOverview';

// Mock the hooks
vi.mock('../../hooks/useTrading/useTrading', () => ({
  usePortfolioSummary: vi.fn(),
  usePortfolioHistory: vi.fn(),
}));

import { usePortfolioSummary, usePortfolioHistory } from '../../hooks/useTrading/useTrading';

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

describe('PortfolioOverview Component', () => {
  const mockPortfolio = {
    currentValue: 10000.50,
    cash: 2500.25,
    totalPnL: 1250.75,
    totalPnLPercentage: 0.1425,
  };

  const mockPortfolioHistory = [
    {
      id: 1,
      user_id: 1,
      timestamp: '2024-01-01T10:00:00Z',
      total_value: 10000.50,
      cash: 2500.25,
      positions: JSON.stringify({
        'AAPL': { shares: 10, avgPrice: 150.25 },
        'GOOGL': { shares: 5, avgPrice: 2800.00 }
      }),
      mode: 'PAPER' as const,
      created_at: '2024-01-01T10:00:00Z'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementations
    (usePortfolioSummary as vi.Mock).mockReturnValue({
      portfolio: mockPortfolio,
      isLoading: false,
      isError: false,
    });
    
    (usePortfolioHistory as vi.Mock).mockReturnValue({
      history: mockPortfolioHistory,
      isLoading: false,
      isError: false,
    });
  });

  it('renders portfolio overview correctly', () => {
    renderWithQueryClient(<PortfolioOverview userId={1} />);
    
    expect(screen.getByText('Portfolio Overview')).toBeInTheDocument();
    expect(screen.getAllByText('Total Value')).toHaveLength(2); // Card and table header
    expect(screen.getAllByText('$10,000.50')).toHaveLength(2); // May appear in multiple places
  });

  it('displays portfolio summary data', () => {
    renderWithQueryClient(<PortfolioOverview userId={1} />);
    
    // Check portfolio summary values
    expect(screen.getAllByText('$10,000.50')).toHaveLength(2); // totalValue (may appear multiple times)
    expect(screen.getAllByText('$2,500.25')).toHaveLength(2); // cash (appears in card and table)
    expect(screen.getAllByText(/25\.00%/)).toHaveLength(2); // cash percentage appears in card and asset allocation
  });

  it('displays holdings table', () => {
    renderWithQueryClient(<PortfolioOverview userId={1} />);
    
    // Check table headers
    expect(screen.getByText('Symbol')).toBeInTheDocument();
    expect(screen.getByText('Shares')).toBeInTheDocument();
    expect(screen.getByText('Avg Price')).toBeInTheDocument();
    expect(screen.getByText('Current Value')).toBeInTheDocument();
    expect(screen.getByText('% of Portfolio')).toBeInTheDocument();
    
    // Check holdings data
    expect(screen.getAllByText('AAPL')).toHaveLength(2);
    expect(screen.getAllByText('GOOGL')).toHaveLength(2);
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    (usePortfolioSummary as vi.Mock).mockReturnValue({
      portfolio: null,
      isLoading: true,
      isError: false,
    });

    renderWithQueryClient(<PortfolioOverview userId={1} />);
    
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows error state', () => {
    (usePortfolioSummary as vi.Mock).mockReturnValue({
      portfolio: null,
      isLoading: false,
      isError: true,
    });

    renderWithQueryClient(<PortfolioOverview userId={1} />);
    
    expect(screen.getByText('Failed to load portfolio data. Please try again later.')).toBeInTheDocument();
  });

  it('handles empty holdings', () => {
    const emptyPortfolioHistory = [
      {
        id: 1,
        user_id: 1,
        timestamp: '2024-01-01T10:00:00Z',
        total_value: 10000.50,
        cash: 2500.25,
        positions: JSON.stringify({}),
        mode: 'PAPER' as const,
        created_at: '2024-01-01T10:00:00Z'
      }
    ];

    (usePortfolioHistory as vi.Mock).mockReturnValue({
      history: emptyPortfolioHistory,
      isLoading: false,
      isError: false,
    });

    renderWithQueryClient(<PortfolioOverview userId={1} />);
    
    expect(screen.getByText('No Active Positions')).toBeInTheDocument();
  });

  it('displays portfolio history', () => {
    renderWithQueryClient(<PortfolioOverview userId={1} />);
    
    // Check history section
    expect(screen.getByText('Recent Portfolio History')).toBeInTheDocument();
  });

  it('shows asset allocation when holdings exist', () => {
    renderWithQueryClient(<PortfolioOverview userId={1} />);
    
    expect(screen.getByText('Asset Allocation')).toBeInTheDocument();
    expect(screen.getAllByText('AAPL')).toHaveLength(2);
    expect(screen.getAllByText('GOOGL')).toHaveLength(2);
  });
});
