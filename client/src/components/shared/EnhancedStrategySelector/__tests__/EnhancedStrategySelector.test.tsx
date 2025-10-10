import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import EnhancedStrategySelector from '../EnhancedStrategySelector';
import { vi } from 'vitest';

// Mock the hooks
vi.mock('../../../../hooks', () => ({
  usePublicStrategies: () => ({
    strategies: [],
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn()
  }),
  useStrategies: () => ({
    strategies: [
      {
        name: 'meanReversion',
        displayName: 'Mean Reversion',
        description: 'Buy when price is below moving average by threshold, sell when above',
        category: 'Mean Reversion',
        parameters: {
          window: {
            type: 'number',
            description: 'Moving average window in days',
            default: 20,
            min: 5,
            max: 200
          },
          threshold: {
            type: 'number',
            description: 'Percentage threshold for buy/sell signals (0.05 = 5%)',
            default: 0.05,
            min: 0.01,
            max: 0.2,
            step: 0.01
          }
        }
      },
      {
        name: 'sentimentAnalysis',
        displayName: 'Sentiment Analysis',
        description: 'Aggregates recent news sentiment to produce BUY/SELL signals',
        category: 'News/Sentiment',
        parameters: {
          lookbackDays: {
            type: 'number',
            description: 'Days of news to consider',
            default: 3,
            min: 1,
            max: 30
          }
        }
      }
    ],
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn()
  })
}));

// Mock the trading API
vi.mock('../../../../api/tradingApi', () => ({
  getAvailableStrategies: vi.fn()
}));

describe('EnhancedStrategySelector', () => {
  let queryClient: QueryClient;
  const mockOnStrategyChange = vi.fn();
  const mockOnParametersChange = vi.fn();

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const defaultProps = {
    selectedStrategy: '',
    onStrategyChange: mockOnStrategyChange,
    onParametersChange: mockOnParametersChange,
    title: 'Select Strategy',
    description: 'Choose a trading strategy',
    compact: false,
    showTips: true
  };

  it('should render strategy cards with display names', async () => {
    render(
      <EnhancedStrategySelector {...defaultProps} />,
      { wrapper }
    );

    await waitFor(() => {
      expect(screen.getByText('Mean Reversion')).toBeInTheDocument();
      expect(screen.getByText('Sentiment Analysis')).toBeInTheDocument();
    });

    // Should not show internal names
    expect(screen.queryByText('meanReversion')).not.toBeInTheDocument();
    expect(screen.queryByText('sentimentAnalysis')).not.toBeInTheDocument();
  });

  it('should render strategy descriptions', async () => {
    render(
      <EnhancedStrategySelector {...defaultProps} />,
      { wrapper }
    );

    await waitFor(() => {
      expect(screen.getByText('Buy when price is below moving average by threshold, sell when above')).toBeInTheDocument();
      expect(screen.getByText('Aggregates recent news sentiment to produce BUY/SELL signals')).toBeInTheDocument();
    });
  });

  it('should call onStrategyChange when a strategy is selected', async () => {
    render(
      <EnhancedStrategySelector {...defaultProps} />,
      { wrapper }
    );

    await waitFor(() => {
      expect(screen.getByText('Mean Reversion')).toBeInTheDocument();
    });

    const meanReversionRadio = screen.getByDisplayValue('meanReversion');
    meanReversionRadio.click();

    expect(mockOnStrategyChange).toHaveBeenCalledWith('meanReversion');
  });

  it('should call onParametersChange when strategy changes', async () => {
    render(
      <EnhancedStrategySelector {...defaultProps} />,
      { wrapper }
    );

    await waitFor(() => {
      expect(screen.getByText('Mean Reversion')).toBeInTheDocument();
    });

    const meanReversionRadio = screen.getByDisplayValue('meanReversion');
    meanReversionRadio.click();

    expect(mockOnParametersChange).toHaveBeenCalledWith({
      window: 20,
      threshold: 0.05
    });
  });

  it('should show selected strategy with visual indicator', async () => {
    render(
      <EnhancedStrategySelector {...defaultProps} selectedStrategy="meanReversion" />,
      { wrapper }
    );

    await waitFor(() => {
      expect(screen.getByText('Mean Reversion')).toBeInTheDocument();
    });

    const meanReversionRadio = screen.getByDisplayValue('meanReversion');
    expect(meanReversionRadio).toBeChecked();
  });

  it('should render tabs for basic and public strategies', async () => {
    render(
      <EnhancedStrategySelector {...defaultProps} />,
      { wrapper }
    );

    await waitFor(() => {
      expect(screen.getByText('Basic Strategies')).toBeInTheDocument();
      expect(screen.getByText('Public Strategies')).toBeInTheDocument();
    });
  });

  it('should handle loading state', () => {
    // Mock loading state
    vi.doMock('../../../../hooks', () => ({
      usePublicStrategies: () => ({
        strategies: [],
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn()
      }),
      useStrategies: () => ({
        strategies: [],
        isLoading: true,
        isError: false,
        error: null,
        refetch: vi.fn()
      })
    }));

    render(
      <EnhancedStrategySelector {...defaultProps} />,
      { wrapper }
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should handle error state', () => {
    // Mock error state
    vi.doMock('../../../../hooks', () => ({
      usePublicStrategies: () => ({
        strategies: [],
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn()
      }),
      useStrategies: () => ({
        strategies: [],
        isLoading: false,
        isError: true,
        error: new Error('Failed to fetch strategies'),
        refetch: vi.fn()
      })
    }));

    render(
      <EnhancedStrategySelector {...defaultProps} />,
      { wrapper }
    );

    expect(screen.getByText(/Failed to load strategies/i)).toBeInTheDocument();
  });

  it('should render in compact mode', async () => {
    render(
      <EnhancedStrategySelector {...defaultProps} compact={true} />,
      { wrapper }
    );

    await waitFor(() => {
      expect(screen.getByText('Mean Reversion')).toBeInTheDocument();
    });

    // In compact mode, tabs should not be visible
    expect(screen.queryByText('Basic Strategies')).not.toBeInTheDocument();
    expect(screen.queryByText('Public Strategies')).not.toBeInTheDocument();
  });

  it('should show strategy tips when enabled', async () => {
    render(
      <EnhancedStrategySelector {...defaultProps} showTips={true} />,
      { wrapper }
    );

    await waitFor(() => {
      expect(screen.getByText('Mean Reversion')).toBeInTheDocument();
    });

    // Look for tips section
    expect(screen.getByText(/strategy tips/i)).toBeInTheDocument();
  });
});
