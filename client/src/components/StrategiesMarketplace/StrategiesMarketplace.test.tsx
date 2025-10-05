import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import StrategiesMarketplace from './StrategiesMarketplace';
import { usePublicStrategies, useUserStrategies } from '../../hooks';
import { useUser } from '../../hooks';
import { copyPublicStrategy } from '../../api';

// Mock the hooks
jest.mock('../../hooks', () => ({
  usePublicStrategies: jest.fn(),
  useUserStrategies: jest.fn(),
  useUser: jest.fn(),
}));

jest.mock('../../api', () => ({
  copyPublicStrategy: jest.fn(),
}));

const mockUsePublicStrategies = usePublicStrategies as jest.MockedFunction<typeof usePublicStrategies>;
const mockUseUserStrategies = useUserStrategies as jest.MockedFunction<typeof useUserStrategies>;
const mockUseUser = useUser as jest.MockedFunction<typeof useUser>;
const mockCopyPublicStrategy = copyPublicStrategy as jest.MockedFunction<typeof copyPublicStrategy>;

// Create a wrapper with providers
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  const theme = createTheme();
  
  return ({ children }: { children: React.ReactNode }) => 
    React.createElement(
      QueryClientProvider,
      { client: queryClient },
      React.createElement(ThemeProvider, { theme }, children)
    );
};

const mockPublicStrategies = [
  {
    id: 1,
    user_id: 1,
    name: 'Public Moving Average Strategy',
    description: 'A public moving average crossover strategy',
    strategy_type: 'moving_average_crossover',
    config: { fastWindow: 10, slowWindow: 30 },
    backtest_results: {
      totalReturn: 0.18,
      winRate: 0.68,
      maxDrawdown: 0.10,
      finalPortfolioValue: 11800,
      totalTrades: 25,
      sharpeRatio: 1.2
    },
    is_public: true,
    is_active: true,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z'
  },
  {
    id: 2,
    user_id: 2,
    name: 'Public Bollinger Bands Strategy',
    description: 'A public Bollinger Bands strategy',
    strategy_type: 'bollinger_bands',
    config: { window: 20, multiplier: 2.0 },
    backtest_results: {
      totalReturn: 0.12,
      winRate: 0.60,
      maxDrawdown: 0.08,
      finalPortfolioValue: 11200,
      totalTrades: 20,
      sharpeRatio: 0.9
    },
    is_public: true,
    is_active: true,
    created_at: '2023-01-02T00:00:00Z',
    updated_at: '2023-01-02T00:00:00Z'
  }
];

describe('StrategiesMarketplace', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    mockUseUser.mockReturnValue({
      user: { id: '1', username: 'testuser' },
      isLoading: false,
      error: null
    } as any);

    mockUsePublicStrategies.mockReturnValue({
      strategies: mockPublicStrategies,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn()
    } as any);

    mockUseUserStrategies.mockReturnValue({
      strategies: [],
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
      createStrategy: jest.fn(),
      updateStrategy: jest.fn(),
      deleteStrategy: jest.fn(),
      deactivateStrategy: jest.fn(),
      activateStrategy: jest.fn(),
      isCreating: false,
      isUpdating: false,
      isDeleting: false
    } as any);
  });

  it('should render the marketplace with public strategies', () => {
    render(<StrategiesMarketplace />, { wrapper: createWrapper() });

    expect(screen.getByText('Strategies Marketplace')).toBeInTheDocument();
    expect(screen.getByText('Discover and use trading strategies created by the community')).toBeInTheDocument();
    expect(screen.getByText('Public Moving Average Strategy')).toBeInTheDocument();
    expect(screen.getByText('Public Bollinger Bands Strategy')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    mockUsePublicStrategies.mockReturnValue({
      strategies: [],
      isLoading: true,
      isError: false,
      error: null,
      refetch: jest.fn()
    } as any);

    render(<StrategiesMarketplace />, { wrapper: createWrapper() });

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should show error state', () => {
    mockUsePublicStrategies.mockReturnValue({
      strategies: [],
      isLoading: false,
      isError: true,
      error: new Error('Failed to load strategies'),
      refetch: jest.fn()
    } as any);

    render(<StrategiesMarketplace />, { wrapper: createWrapper() });

    expect(screen.getByText('Error loading public strategies: Failed to load strategies')).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('should show empty state when no public strategies', () => {
    mockUsePublicStrategies.mockReturnValue({
      strategies: [],
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn()
    } as any);

    render(<StrategiesMarketplace />, { wrapper: createWrapper() });

    expect(screen.getByText('No public strategies available')).toBeInTheDocument();
    expect(screen.getByText('Be the first to share a public strategy!')).toBeInTheDocument();
  });

  it('should filter strategies by search term', () => {
    render(<StrategiesMarketplace />, { wrapper: createWrapper() });

    const searchInput = screen.getByPlaceholderText('Search strategies...');
    fireEvent.change(searchInput, { target: { value: 'Moving Average' } });

    expect(screen.getByText('Public Moving Average Strategy')).toBeInTheDocument();
    expect(screen.queryByText('Public Bollinger Bands Strategy')).not.toBeInTheDocument();
  });

  it('should filter strategies by type', () => {
    render(<StrategiesMarketplace />, { wrapper: createWrapper() });

    const typeSelect = screen.getByLabelText('Strategy Type');
    fireEvent.mouseDown(typeSelect);
    
    const movingAverageOption = screen.getByText('Moving Average Crossover');
    fireEvent.click(movingAverageOption);

    expect(screen.getByText('Public Moving Average Strategy')).toBeInTheDocument();
    expect(screen.queryByText('Public Bollinger Bands Strategy')).not.toBeInTheDocument();
  });

  it('should sort strategies by name', () => {
    render(<StrategiesMarketplace />, { wrapper: createWrapper() });

    const sortSelect = screen.getByLabelText('Sort By');
    fireEvent.mouseDown(sortSelect);
    
    const nameOption = screen.getByText('Name');
    fireEvent.click(nameOption);

    // The strategies should be sorted alphabetically
    const strategyCards = screen.getAllByText(/Public.*Strategy/);
    expect(strategyCards[0]).toHaveTextContent('Public Bollinger Bands Strategy');
    expect(strategyCards[1]).toHaveTextContent('Public Moving Average Strategy');
  });

  it('should clear filters when Clear Filters button is clicked', () => {
    render(<StrategiesMarketplace />, { wrapper: createWrapper() });

    // Set some filters
    const searchInput = screen.getByPlaceholderText('Search strategies...');
    fireEvent.change(searchInput, { target: { value: 'test' } });

    const typeSelect = screen.getByLabelText('Strategy Type');
    fireEvent.mouseDown(typeSelect);
    const movingAverageOption = screen.getByText('Moving Average Crossover');
    fireEvent.click(movingAverageOption);

    // Clear filters
    const clearButton = screen.getByText('Clear Filters');
    fireEvent.click(clearButton);

    // All strategies should be visible again
    expect(screen.getByText('Public Moving Average Strategy')).toBeInTheDocument();
    expect(screen.getByText('Public Bollinger Bands Strategy')).toBeInTheDocument();
    expect(searchInput).toHaveValue('');
  });

  it('should open strategy details dialog when View Details is clicked', () => {
    render(<StrategiesMarketplace />, { wrapper: createWrapper() });

    const viewDetailsButton = screen.getAllByText('View Details')[0];
    fireEvent.click(viewDetailsButton);

    expect(screen.getByText('Public Moving Average Strategy')).toBeInTheDocument();
    expect(screen.getByText('Strategy Information')).toBeInTheDocument();
    expect(screen.getByText('Backtest Results')).toBeInTheDocument();
    expect(screen.getByText('Strategy Configuration')).toBeInTheDocument();
  });

  it('should copy strategy when Copy to My Strategies is clicked', async () => {
    mockCopyPublicStrategy.mockResolvedValue({
      data: {
        message: 'Strategy copied successfully',
        strategy: { id: 3, name: 'Public Moving Average Strategy (Copy)' }
      }
    } as any);

    render(<StrategiesMarketplace />, { wrapper: createWrapper() });

    const viewDetailsButton = screen.getAllByText('View Details')[0];
    fireEvent.click(viewDetailsButton);

    const copyButton = screen.getByText('Copy to My Strategies');
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(mockCopyPublicStrategy).toHaveBeenCalledWith(1, 1);
    });
  });

  it('should show copying state when copying strategy', async () => {
    mockCopyPublicStrategy.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(<StrategiesMarketplace />, { wrapper: createWrapper() });

    const viewDetailsButton = screen.getAllByText('View Details')[0];
    fireEvent.click(viewDetailsButton);

    const copyButton = screen.getByText('Copy to My Strategies');
    fireEvent.click(copyButton);

    expect(screen.getByText('Copying...')).toBeInTheDocument();
    expect(copyButton).toBeDisabled();
  });

  it('should handle copy strategy error', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    mockCopyPublicStrategy.mockRejectedValue(new Error('Copy failed'));

    render(<StrategiesMarketplace />, { wrapper: createWrapper() });

    const viewDetailsButton = screen.getAllByText('View Details')[0];
    fireEvent.click(viewDetailsButton);

    const copyButton = screen.getByText('Copy to My Strategies');
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error copying strategy:', expect.any(Error));
    });

    consoleSpy.mockRestore();
  });

  it('should display backtest results correctly', () => {
    render(<StrategiesMarketplace />, { wrapper: createWrapper() });

    expect(screen.getByText('18.0% Return')).toBeInTheDocument();
    expect(screen.getByText('68.0% Win Rate')).toBeInTheDocument();
  });

  it('should display strategy metadata correctly', () => {
    render(<StrategiesMarketplace />, { wrapper: createWrapper() });

    expect(screen.getByText('Created by User #1')).toBeInTheDocument();
    expect(screen.getByText('Created by User #2')).toBeInTheDocument();
  });

  it('should show public strategy indicator', () => {
    render(<StrategiesMarketplace />, { wrapper: createWrapper() });

    const publicIcons = screen.getAllByTestId('PublicIcon');
    expect(publicIcons).toHaveLength(2); // One for each strategy
  });

  it('should handle user not found error when copying', async () => {
    mockUseUser.mockReturnValue({
      user: null,
      isLoading: false,
      error: null
    } as any);

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    render(<StrategiesMarketplace />, { wrapper: createWrapper() });

    const viewDetailsButton = screen.getAllByText('View Details')[0];
    fireEvent.click(viewDetailsButton);

    const copyButton = screen.getByText('Copy to My Strategies');
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('User not found');
    });

    consoleSpy.mockRestore();
  });
});
