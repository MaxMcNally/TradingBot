import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import EnhancedStrategySelector from './EnhancedStrategySelector';
import { usePublicStrategies } from '../../hooks';
import { getAvailableStrategies } from '../../api/tradingApi';

// Mock the hooks and API
jest.mock('../../hooks', () => ({
  usePublicStrategies: jest.fn(),
}));

jest.mock('../../api/tradingApi', () => ({
  getAvailableStrategies: jest.fn(),
}));

const mockUsePublicStrategies = usePublicStrategies as jest.MockedFunction<typeof usePublicStrategies>;
const mockGetAvailableStrategies = getAvailableStrategies as jest.MockedFunction<typeof getAvailableStrategies>;

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
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );
};

const mockBasicStrategies = [
  {
    name: 'MovingAverage',
    description: 'Uses moving average crossover to generate buy/sell signals',
    parameters: {
      shortWindow: 5,
      longWindow: 10,
    },
    enabled: true,
    symbols: [],
  },
  {
    name: 'BollingerBands',
    description: 'Uses Bollinger Bands to identify overbought/oversold conditions',
    parameters: {
      window: 20,
      numStdDev: 2,
    },
    enabled: true,
    symbols: [],
  }
];

const mockPublicStrategies = [
  {
    id: 1,
    user_id: 1,
    name: 'Public Moving Average Strategy',
    description: 'A public moving average strategy',
    strategy_type: 'moving_average_crossover',
    config: { fastWindow: 10, slowWindow: 30 },
    is_public: true,
    is_active: true,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z'
  },
  {
    id: 2,
    user_id: 2,
    name: 'Public Bollinger Strategy',
    description: 'A public Bollinger Bands strategy',
    strategy_type: 'bollinger_bands',
    config: { window: 20, multiplier: 2.0 },
    is_public: true,
    is_active: true,
    created_at: '2023-01-02T00:00:00Z',
    updated_at: '2023-01-02T00:00:00Z'
  }
];

describe('EnhancedStrategySelector', () => {
  const defaultProps = {
    selectedStrategy: '',
    onStrategyChange: jest.fn(),
    onParametersChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    mockGetAvailableStrategies.mockResolvedValue({
      data: { strategies: mockBasicStrategies }
    } as any);

    mockUsePublicStrategies.mockReturnValue({
      strategies: mockPublicStrategies,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn()
    } as any);
  });

  it('should render with basic strategies by default', async () => {
    render(<EnhancedStrategySelector {...defaultProps} />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('MovingAverage')).toBeInTheDocument();
      expect(screen.getByText('BollingerBands')).toBeInTheDocument();
    });

    expect(screen.getByText('Basic Strategies')).toBeInTheDocument();
    expect(screen.getByText('Public Strategies')).toBeInTheDocument();
  });

  it('should show loading state initially', () => {
    render(<EnhancedStrategySelector {...defaultProps} />, { wrapper: createWrapper() });

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should handle API error and show default strategies', async () => {
    mockGetAvailableStrategies.mockRejectedValue(new Error('API Error'));

    render(<EnhancedStrategySelector {...defaultProps} />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('MovingAverage')).toBeInTheDocument();
      expect(screen.getByText('BollingerBands')).toBeInTheDocument();
    });

    expect(screen.getByText('Failed to load strategies, using defaults')).toBeInTheDocument();
  });

  it('should switch between Basic and Public strategies tabs', async () => {
    render(<EnhancedStrategySelector {...defaultProps} />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('MovingAverage')).toBeInTheDocument();
    });

    // Click on Public Strategies tab
    const publicTab = screen.getByText('Public Strategies');
    fireEvent.click(publicTab);

    await waitFor(() => {
      expect(screen.getByText('Public Moving Average Strategy')).toBeInTheDocument();
      expect(screen.getByText('Public Bollinger Strategy')).toBeInTheDocument();
    });

    // Click back on Basic Strategies tab
    const basicTab = screen.getByText('Basic Strategies');
    fireEvent.click(basicTab);

    await waitFor(() => {
      expect(screen.getByText('MovingAverage')).toBeInTheDocument();
      expect(screen.getByText('BollingerBands')).toBeInTheDocument();
    });
  });

  it('should call onStrategyChange when a basic strategy is selected', async () => {
    render(<EnhancedStrategySelector {...defaultProps} />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('MovingAverage')).toBeInTheDocument();
    });

    const movingAverageRadio = screen.getByDisplayValue('MovingAverage');
    fireEvent.click(movingAverageRadio);

    expect(defaultProps.onStrategyChange).toHaveBeenCalledWith('MovingAverage');
  });

  it('should call onStrategyChange when a public strategy is selected', async () => {
    render(<EnhancedStrategySelector {...defaultProps} />, { wrapper: createWrapper() });

    // Switch to Public Strategies tab
    const publicTab = screen.getByText('Public Strategies');
    fireEvent.click(publicTab);

    await waitFor(() => {
      expect(screen.getByText('Public Moving Average Strategy')).toBeInTheDocument();
    });

    const publicStrategyRadio = screen.getByDisplayValue('Public Moving Average Strategy');
    fireEvent.click(publicStrategyRadio);

    expect(defaultProps.onStrategyChange).toHaveBeenCalledWith('Public Moving Average Strategy');
  });

  it('should call onParametersChange when a basic strategy is selected', async () => {
    render(<EnhancedStrategySelector {...defaultProps} />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('MovingAverage')).toBeInTheDocument();
    });

    const movingAverageRadio = screen.getByDisplayValue('MovingAverage');
    fireEvent.click(movingAverageRadio);

    expect(defaultProps.onParametersChange).toHaveBeenCalledWith({
      shortWindow: 5,
      longWindow: 10
    });
  });

  it('should call onParametersChange with default values when a public strategy is selected', async () => {
    render(<EnhancedStrategySelector {...defaultProps} />, { wrapper: createWrapper() });

    // Switch to Public Strategies tab
    const publicTab = screen.getByText('Public Strategies');
    fireEvent.click(publicTab);

    await waitFor(() => {
      expect(screen.getByText('Public Moving Average Strategy')).toBeInTheDocument();
    });

    const publicStrategyRadio = screen.getByDisplayValue('Public Moving Average Strategy');
    fireEvent.click(publicStrategyRadio);

    expect(defaultProps.onParametersChange).toHaveBeenCalledWith({
      window: 20,
      threshold: 0.05,
      shortWindow: 10,
      longWindow: 30
    });
  });

  it('should show selected strategy indicator', async () => {
    render(<EnhancedStrategySelector {...defaultProps} selectedStrategy="MovingAverage" />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('MovingAverage')).toBeInTheDocument();
    });

    expect(screen.getByText('Selected')).toBeInTheDocument();
  });

  it('should show public strategy indicator for public strategies', async () => {
    render(<EnhancedStrategySelector {...defaultProps} />, { wrapper: createWrapper() });

    // Switch to Public Strategies tab
    const publicTab = screen.getByText('Public Strategies');
    fireEvent.click(publicTab);

    await waitFor(() => {
      expect(screen.getByText('Public Moving Average Strategy')).toBeInTheDocument();
    });

    // Check for public icon (this would be a PublicIcon component)
    const publicIcons = screen.getAllByTestId('PublicIcon');
    expect(publicIcons.length).toBeGreaterThan(0);
  });

  it('should show loading state for public strategies', () => {
    mockUsePublicStrategies.mockReturnValue({
      strategies: [],
      isLoading: true,
      isError: false,
      error: null,
      refetch: jest.fn()
    } as any);

    render(<EnhancedStrategySelector {...defaultProps} />, { wrapper: createWrapper() });

    // Switch to Public Strategies tab
    const publicTab = screen.getByText('Public Strategies');
    fireEvent.click(publicTab);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should show error state for public strategies', () => {
    mockUsePublicStrategies.mockReturnValue({
      strategies: [],
      isLoading: false,
      isError: true,
      error: new Error('Failed to load public strategies'),
      refetch: jest.fn()
    } as any);

    render(<EnhancedStrategySelector {...defaultProps} />, { wrapper: createWrapper() });

    // Switch to Public Strategies tab
    const publicTab = screen.getByText('Public Strategies');
    fireEvent.click(publicTab);

    expect(screen.getByText('Error loading public strategies: Failed to load public strategies')).toBeInTheDocument();
  });

  it('should show empty state when no public strategies', () => {
    mockUsePublicStrategies.mockReturnValue({
      strategies: [],
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn()
    } as any);

    render(<EnhancedStrategySelector {...defaultProps} />, { wrapper: createWrapper() });

    // Switch to Public Strategies tab
    const publicTab = screen.getByText('Public Strategies');
    fireEvent.click(publicTab);

    expect(screen.getByText('No public strategies are available at the moment. Check back later or create your own public strategy.')).toBeInTheDocument();
  });

  it('should show strategy tips when showTips is true', async () => {
    render(<EnhancedStrategySelector {...defaultProps} showTips={true} />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Strategy Tips')).toBeInTheDocument();
    });

    expect(screen.getByText(/Moving Average:/)).toBeInTheDocument();
    expect(screen.getByText(/Bollinger Bands:/)).toBeInTheDocument();
  });

  it('should not show strategy tips when showTips is false', async () => {
    render(<EnhancedStrategySelector {...defaultProps} showTips={false} />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('MovingAverage')).toBeInTheDocument();
    });

    expect(screen.queryByText('Strategy Tips')).not.toBeInTheDocument();
  });

  it('should render in compact mode', async () => {
    render(<EnhancedStrategySelector {...defaultProps} compact={true} />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('MovingAverage')).toBeInTheDocument();
    });

    // In compact mode, title and description should not be shown
    expect(screen.queryByText('Select Trading Strategy')).not.toBeInTheDocument();
    expect(screen.queryByText('Choose a trading strategy that will determine when to buy and sell stocks')).not.toBeInTheDocument();
  });

  it('should use provided availableStrategies when available', async () => {
    const customStrategies = [
      {
        name: 'CustomStrategy',
        description: 'A custom strategy',
        parameters: { param1: 10 },
        enabled: true,
        symbols: []
      }
    ];

    render(<EnhancedStrategySelector {...defaultProps} availableStrategies={customStrategies} />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('CustomStrategy')).toBeInTheDocument();
    });

    expect(screen.queryByText('MovingAverage')).not.toBeInTheDocument();
  });

  it('should handle refresh button click', async () => {
    const mockRefetch = jest.fn();
    mockUsePublicStrategies.mockReturnValue({
      strategies: mockPublicStrategies,
      isLoading: false,
      isError: false,
      error: null,
      refetch: mockRefetch
    } as any);

    render(<EnhancedStrategySelector {...defaultProps} />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('MovingAverage')).toBeInTheDocument();
    });

    const refreshButton = screen.getByLabelText('Refresh Strategies');
    fireEvent.click(refreshButton);

    expect(mockGetAvailableStrategies).toHaveBeenCalledTimes(2); // Once on mount, once on refresh
  });
});
