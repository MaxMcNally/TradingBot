import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import StrategyParameters, { STRATEGY_CONFIGS } from './StrategyParameters';

describe('StrategyParameters Component', () => {
  const mockOnParametersChange = vi.fn();

  const defaultProps = {
    selectedStrategy: 'SentimentAnalysis',
    strategyParameters: {
      lookbackDays: 3,
      minArticles: 2,
      buyThreshold: 0.4,
    },
    onParametersChange: mockOnParametersChange,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Validation Logic', () => {
    it('should render strategy parameters correctly', () => {
      render(<StrategyParameters {...defaultProps} />);
      
      expect(screen.getByText('Strategy Parameters')).toBeInTheDocument();
      expect(screen.getByText('SentimentAnalysis Parameters')).toBeInTheDocument();
      expect(screen.getByLabelText('Lookback Days')).toBeInTheDocument();
      expect(screen.getByLabelText('Min Articles')).toBeInTheDocument();
    });

    it('should validate required number fields correctly', () => {
      render(<StrategyParameters {...defaultProps} />);
      
      const lookbackDaysInput = screen.getByLabelText('Lookback Days');
      
      // Clear the input to make it empty
      fireEvent.change(lookbackDaysInput, { target: { value: '' } });
      
      // Try to save - should show validation error
      const saveButton = screen.getByText('Save Parameters');
      fireEvent.click(saveButton);
      
      // Should show number validation error, not required field error
      expect(screen.getByText('Lookback Days must be a valid number')).toBeInTheDocument();
      expect(mockOnParametersChange).not.toHaveBeenCalled();
    });

    it('should treat empty string as invalid number for required number fields', () => {
      render(<StrategyParameters {...defaultProps} />);
      
      const lookbackDaysInput = screen.getByLabelText('Lookback Days');
      
      // Set to empty string
      fireEvent.change(lookbackDaysInput, { target: { value: '' } });
      
      // Should show "must be a valid number" error, not "is required" error
      expect(screen.getByText('Lookback Days must be a valid number')).toBeInTheDocument();
    });

    it('should treat empty string as invalid number for non-required number fields', () => {
      // Create a custom strategy config with non-required number field
      const customStrategyDefinitions = {
        TestStrategy: {
          optionalNumber: {
            type: 'number' as const,
            label: 'Optional Number',
            defaultValue: 10,
            min: 1,
            max: 100,
            required: false, // Not required
          },
        },
      };

      render(
        <StrategyParameters 
          selectedStrategy="TestStrategy"
          strategyParameters={{ optionalNumber: 10 }}
          onParametersChange={mockOnParametersChange}
          strategyDefinitions={customStrategyDefinitions}
        />
      );
      
      const optionalNumberInput = screen.getByLabelText('Optional Number');
      
      // Set to empty string
      fireEvent.change(optionalNumberInput, { target: { value: '' } });
      
      // Should show "must be a valid number" error (not required error)
      expect(screen.getByText('Optional Number must be a valid number')).toBeInTheDocument();
    });

    it('should validate number field minimum values correctly', () => {
      render(<StrategyParameters {...defaultProps} />);
      
      const lookbackDaysInput = screen.getByLabelText('Lookback Days');
      
      // Set value below minimum (min is 1)
      fireEvent.change(lookbackDaysInput, { target: { value: '0' } });
      
      expect(screen.getByText('Lookback Days must be at least 1')).toBeInTheDocument();
    });

    it('should validate number field maximum values correctly', () => {
      render(<StrategyParameters {...defaultProps} />);
      
      const lookbackDaysInput = screen.getByLabelText('Lookback Days');
      
      // Set value above maximum (max is 30)
      fireEvent.change(lookbackDaysInput, { target: { value: '31' } });
      
      expect(screen.getByText('Lookback Days must be at most 30')).toBeInTheDocument();
    });

    it('should handle invalid number strings', () => {
      render(<StrategyParameters {...defaultProps} />);
      
      const lookbackDaysInput = screen.getByLabelText('Lookback Days');
      
      // Set to invalid number string
      fireEvent.change(lookbackDaysInput, { target: { value: 'abc' } });
      
      expect(screen.getByText('Lookback Days must be a valid number')).toBeInTheDocument();
    });


    it('should allow saving when all validations pass', async () => {
      render(<StrategyParameters {...defaultProps} />);
      
      const lookbackDaysInput = screen.getByLabelText('Lookback Days');
      
      // Set valid value
      fireEvent.change(lookbackDaysInput, { target: { value: '5' } });
      
      // Should be able to save
      const saveButton = screen.getByText('Save Parameters');
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(mockOnParametersChange).toHaveBeenCalled();
      });
    });

    it('should prevent saving when validation errors exist', () => {
      render(<StrategyParameters {...defaultProps} />);
      
      const lookbackDaysInput = screen.getByLabelText('Lookback Days');
      
      // Set invalid value (empty string)
      fireEvent.change(lookbackDaysInput, { target: { value: '' } });
      
      // Save button should be disabled
      const saveButton = screen.getByText('Save Parameters');
      expect(saveButton).toBeDisabled();
    });

    it('should show validation errors in real-time as user types', () => {
      render(<StrategyParameters {...defaultProps} />);
      
      const lookbackDaysInput = screen.getByLabelText('Lookback Days');
      
      // Type invalid value
      fireEvent.change(lookbackDaysInput, { target: { value: '' } });
      
      // Should immediately show validation error
      expect(screen.getByText('Lookback Days must be a valid number')).toBeInTheDocument();
      
      // Type valid value
      fireEvent.change(lookbackDaysInput, { target: { value: '5' } });
      
      // Error should disappear
      expect(screen.queryByText('Lookback Days must be a valid number')).not.toBeInTheDocument();
    });

    it('should handle edge case: zero as a valid number', () => {
      // Create a strategy that allows zero
      const customStrategyDefinitions = {
        TestStrategy: {
          allowZero: {
            type: 'number' as const,
            label: 'Allow Zero',
            defaultValue: 0,
            min: 0,
            max: 100,
            required: true,
          },
        },
      };

      render(
        <StrategyParameters 
          selectedStrategy="TestStrategy"
          strategyParameters={{ allowZero: 0 }}
          onParametersChange={mockOnParametersChange}
          strategyDefinitions={customStrategyDefinitions}
        />
      );
      
      const allowZeroInput = screen.getByLabelText('Allow Zero');
      
      // Set to zero
      fireEvent.change(allowZeroInput, { target: { value: '0' } });
      
      // Should not show validation error for zero
      expect(screen.queryByText(/must be/)).not.toBeInTheDocument();
    });

    it('should handle decimal numbers correctly', () => {
      render(<StrategyParameters {...defaultProps} />);
      
      const buyThresholdInput = screen.getByLabelText('Buy Threshold');
      
      // Set valid decimal
      fireEvent.change(buyThresholdInput, { target: { value: '0.5' } });
      
      // Should not show validation error
      expect(screen.queryByText(/must be/)).not.toBeInTheDocument();
      
      // Set invalid decimal (empty string)
      fireEvent.change(buyThresholdInput, { target: { value: '' } });
      
      // Should show number validation error
      expect(screen.getByText('Buy Threshold must be a valid number')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large numbers', () => {
      render(<StrategyParameters {...defaultProps} />);
      
      const lookbackDaysInput = screen.getByLabelText('Lookback Days');
      
      // Set to very large number
      fireEvent.change(lookbackDaysInput, { target: { value: '999999' } });
      
      // Should show max validation error
      expect(screen.getByText('Lookback Days must be at most 30')).toBeInTheDocument();
    });

    it('should handle scientific notation', () => {
      render(<StrategyParameters {...defaultProps} />);
      
      const lookbackDaysInput = screen.getByLabelText('Lookback Days');
      
      // Set to scientific notation (1e1 = 10)
      fireEvent.change(lookbackDaysInput, { target: { value: '1e1' } });
      
      // Should be valid if within bounds (10 is between 1 and 30)
      expect(screen.queryByText(/must be/)).not.toBeInTheDocument();
    });
  });
});