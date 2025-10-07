import { vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import StrategySelector from './StrategySelector';
import { useStrategies } from '../../hooks';

// Mock the hooks
vi.mock('../../hooks', () => ({
  useStrategies: vi.fn(),
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

describe('StrategySelector Component', () => {
  const mockStrategies = [
    {
      name: 'meanReversion',
      description: 'Mean Reversion Strategy',
      parameters: { window: 20, threshold: 0.05 },
      enabled: true,
      symbols: [],
    },
    {
      name: 'movingAverage',
      description: 'Moving Average Strategy',
      parameters: { fastWindow: 10, slowWindow: 30 },
      enabled: true,
      symbols: [],
    },
    {
      name: 'bollingerBands',
      description: 'Bollinger Bands Strategy',
      parameters: { window: 20, stdDev: 2 },
      enabled: true,
      symbols: [],
    },
  ];

  const defaultProps = {
    selectedStrategy: 'meanReversion',
    onStrategyChange: vi.fn(),
    strategyParameters: { window: 20, threshold: 0.05 },
    onParametersChange: vi.fn(),
    title: 'Select Trading Strategy',
    description: 'Choose a strategy for your trading session',
    compact: false,
    showTips: true,
    availableStrategies: mockStrategies,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    (useStrategies as vi.Mock).mockReturnValue({
      strategies: mockStrategies,
      isLoading: false,
      isError: false,
    });
  });

  it('renders strategy selector correctly', () => {
    renderWithQueryClient(<StrategySelector {...defaultProps} />);
    
    expect(screen.getByText('Select Trading Strategy')).toBeInTheDocument();
    expect(screen.getByText('Choose a strategy for your trading session')).toBeInTheDocument();
    expect(screen.getByText('meanReversion')).toBeInTheDocument();
    expect(screen.getByText('movingAverage')).toBeInTheDocument();
    expect(screen.getByText('bollingerBands')).toBeInTheDocument();
  });

  it('shows loading state when strategies are loading', () => {
    (useStrategies as vi.Mock).mockReturnValue({
      strategies: [],
      isLoading: true,
      isError: false,
    });

    renderWithQueryClient(<StrategySelector {...defaultProps} />);
    
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows error state when strategies fail to load', () => {
    (useStrategies as vi.Mock).mockReturnValue({
      strategies: [],
      isLoading: false,
      isError: true,
    });

    renderWithQueryClient(<StrategySelector {...defaultProps} />);
    
    expect(screen.getByText('Failed to load strategies')).toBeInTheDocument();
  });

  it('displays selected strategy with highlighted border', () => {
    renderWithQueryClient(<StrategySelector {...defaultProps} />);
    
    const selectedStrategyCard = screen.getByText('meanReversion').closest('[data-testid="strategy-card"]') || 
                                screen.getByText('meanReversion').closest('.MuiCard-root');
    
    expect(selectedStrategyCard).toBeInTheDocument();
    expect(screen.getByText('Selected')).toBeInTheDocument();
  });

  it('calls onStrategyChange when strategy is selected', () => {
    renderWithQueryClient(<StrategySelector {...defaultProps} />);
    
    const movingAverageRadio = screen.getByDisplayValue('movingAverage');
    fireEvent.click(movingAverageRadio);
    
    expect(defaultProps.onStrategyChange).toHaveBeenCalledWith('movingAverage');
  });

  it('displays strategy parameters for selected strategy', () => {
    renderWithQueryClient(<StrategySelector {...defaultProps} />);
    
    expect(screen.getByText('Parameters')).toBeInTheDocument();
    expect(screen.getByText('Window')).toBeInTheDocument();
    expect(screen.getByText('Threshold')).toBeInTheDocument();
  });

  it('calls onParametersChange when parameters are modified', () => {
    renderWithQueryClient(<StrategySelector {...defaultProps} />);
    
    const windowInput = screen.getByLabelText('Window');
    fireEvent.change(windowInput, { target: { value: '25' } });
    
    expect(defaultProps.onParametersChange).toHaveBeenCalledWith({
      window: 25,
      threshold: 0.05,
    });
  });

  it('handles different parameter types correctly', () => {
    const propsWithDifferentStrategy = {
      ...defaultProps,
      selectedStrategy: 'movingAverage',
      strategyParameters: { fastWindow: 10, slowWindow: 30 },
    };

    renderWithQueryClient(<StrategySelector {...propsWithDifferentStrategy} />);
    
    expect(screen.getByText('Fast Window')).toBeInTheDocument();
    expect(screen.getByText('Slow Window')).toBeInTheDocument();
  });

  it('displays strategy tips when showTips is true', () => {
    renderWithQueryClient(<StrategySelector {...defaultProps} />);
    
    expect(screen.getByText('Strategy Tips')).toBeInTheDocument();
    expect(screen.getByText(/Moving Average:/)).toBeInTheDocument();
    expect(screen.getByText(/Bollinger Bands:/)).toBeInTheDocument();
    expect(screen.getByText(/Mean Reversion:/)).toBeInTheDocument();
  });

  it('hides strategy tips when showTips is false', () => {
    const propsWithoutTips = {
      ...defaultProps,
      showTips: false,
    };

    renderWithQueryClient(<StrategySelector {...propsWithoutTips} />);
    
    expect(screen.queryByText('Strategy Tips')).not.toBeInTheDocument();
  });

  it('renders in compact mode correctly', () => {
    const compactProps = {
      ...defaultProps,
      compact: true,
    };

    renderWithQueryClient(<StrategySelector {...compactProps} />);
    
    // In compact mode, tips should not be shown
    expect(screen.queryByText('Strategy Tips')).not.toBeInTheDocument();
  });

  it('handles strategy change and updates parameters correctly', () => {
    renderWithQueryClient(<StrategySelector {...defaultProps} />);
    
    // Change to movingAverage strategy
    const movingAverageRadio = screen.getByDisplayValue('movingAverage');
    fireEvent.click(movingAverageRadio);
    
    expect(defaultProps.onStrategyChange).toHaveBeenCalledWith('movingAverage');
    
    // The component should call onParametersChange with default parameters for the new strategy
    expect(defaultProps.onParametersChange).toHaveBeenCalledWith({
      fastWindow: 10,
      slowWindow: 30,
    });
  });

  it('displays parameter descriptions and help text', () => {
    renderWithQueryClient(<StrategySelector {...defaultProps} />);
    
    const windowInput = screen.getByLabelText('Window');
    expect(windowInput).toHaveAttribute('aria-describedby');
    
    // Check for helper text
    const helperText = screen.getByText('Number of periods for mean calculation');
    expect(helperText).toBeInTheDocument();
  });

  it('validates parameter input ranges', () => {
    renderWithQueryClient(<StrategySelector {...defaultProps} />);
    
    const windowInput = screen.getByLabelText('Window');
    expect(windowInput).toHaveAttribute('min', '2');
    expect(windowInput).toHaveAttribute('max', '200');
  });

  it('handles boolean parameters correctly', () => {
    const propsWithBooleanStrategy = {
      ...defaultProps,
      selectedStrategy: 'momentum',
      strategyParameters: { useVolume: true, threshold: 0.02 },
    };

    renderWithQueryClient(<StrategySelector {...propsWithBooleanStrategy} />);
    
    // Should render checkbox for boolean parameter
    const useVolumeCheckbox = screen.getByRole('checkbox');
    expect(useVolumeCheckbox).toBeInTheDocument();
    expect(useVolumeCheckbox).toBeChecked();
  });

  it('displays strategy info section with current parameters', () => {
    renderWithQueryClient(<StrategySelector {...defaultProps} />);
    
    expect(screen.getByText('Selected Strategy:')).toBeInTheDocument();
    expect(screen.getByText('meanReversion')).toBeInTheDocument();
    expect(screen.getByText('Parameters:')).toBeInTheDocument();
  });

  it('handles empty strategy parameters gracefully', () => {
    const propsWithEmptyParams = {
      ...defaultProps,
      strategyParameters: {},
    };

    renderWithQueryClient(<StrategySelector {...propsWithEmptyParams} />);
    
    // Should not crash and should show empty parameters
    expect(screen.getByText('Parameters:')).toBeInTheDocument();
  });

  it('handles strategy without parameters', () => {
    const strategyWithoutParams = {
      name: 'simpleStrategy',
      description: 'Simple Strategy',
      parameters: {},
      enabled: true,
      symbols: [],
    };

    const propsWithSimpleStrategy = {
      ...defaultProps,
      selectedStrategy: 'simpleStrategy',
      availableStrategies: [strategyWithoutParams],
    };

    renderWithQueryClient(<StrategySelector {...propsWithSimpleStrategy} />);
    
    // Should not show parameters section
    expect(screen.queryByText('Parameters')).not.toBeInTheDocument();
  });

  it('maintains parameter state when switching between strategies', () => {
    renderWithQueryClient(<StrategySelector {...defaultProps} />);
    
    // Modify window parameter
    const windowInput = screen.getByLabelText('Window');
    fireEvent.change(windowInput, { target: { value: '25' } });
    
    expect(defaultProps.onParametersChange).toHaveBeenCalledWith({
      window: 25,
      threshold: 0.05,
    });
    
    // Switch to different strategy
    const movingAverageRadio = screen.getByDisplayValue('movingAverage');
    fireEvent.click(movingAverageRadio);
    
    // Should call onParametersChange with new strategy's default parameters
    expect(defaultProps.onParametersChange).toHaveBeenLastCalledWith({
      fastWindow: 10,
      slowWindow: 30,
    });
  });
});
