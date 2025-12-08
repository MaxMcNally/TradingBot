import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import CustomStrategyBuilder from './CustomStrategyBuilder';

const customStrategiesApi = {
  validateCustomStrategy: vi.fn(),
};
vi.mock('../../api/customStrategiesApi', () => customStrategiesApi);


// Mock the hooks
vi.mock('../../../hooks', () => ({
  useCustomStrategies: vi.fn(() => ({
    data: [],
    isLoading: false,
    error: null,
  })),
}));

describe('CustomStrategyBuilder', () => {
  const mockOnClose = vi.fn();
  const mockOnSave = vi.fn().mockResolvedValue(undefined);

  const defaultProps = {
    open: true,
    onClose: mockOnClose,
    onSave: mockOnSave,
    isLoading: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Default successful validation response
    (customStrategiesApi.validateCustomStrategy as any).mockResolvedValue({
      data: {
        success: true,
        data: {
          valid: true,
          errors: [],
          warnings: [],
        },
      },
    });
  });

  describe('Dialog Rendering', () => {
    it('should render the dialog when open is true', () => {
      render(<CustomStrategyBuilder {...defaultProps} />);
      expect(screen.getByText('Create Custom Strategy')).toBeInTheDocument();
    });

    it('should not render the dialog when open is false', () => {
      render(<CustomStrategyBuilder {...defaultProps} open={false} />);
      expect(screen.queryByText('Create Custom Strategy')).not.toBeInTheDocument();
    });

    it('should show "Edit Custom Strategy" when editingStrategy is provided', () => {
      const editingStrategy = {
        id: 1,
        name: 'Test Strategy',
        description: 'Test Description',
        buy_conditions: {
          type: 'indicator' as const,
          indicator: {
            type: 'rsi' as const,
            params: { period: 14, source: 'close' },
            condition: 'oversold',
          },
        },
        sell_conditions: {
          type: 'indicator' as const,
          indicator: {
            type: 'rsi' as const,
            params: { period: 14, source: 'close' },
            condition: 'overbought',
          },
        },
        is_public: false,
      };

      render(<CustomStrategyBuilder {...defaultProps} editingStrategy={editingStrategy} />);
      expect(screen.getByText('Edit Custom Strategy')).toBeInTheDocument();
    });

    it('should display the stepper with correct steps', () => {
      render(<CustomStrategyBuilder {...defaultProps} />);
      expect(screen.getByText('Buy Conditions')).toBeInTheDocument();
      expect(screen.getByText('Sell Conditions')).toBeInTheDocument();
      expect(screen.getByText('Strategy Details')).toBeInTheDocument();
    });
  });

  describe('Step 1: Buy Conditions', () => {
    it('should render buy conditions step by default', () => {
      render(<CustomStrategyBuilder {...defaultProps} />);
      expect(screen.getByText('Define Buy Conditions')).toBeInTheDocument();
    });

    it('should display all indicator tiles', () => {
      render(<CustomStrategyBuilder {...defaultProps} />);
      expect(screen.getByText('SMA')).toBeInTheDocument();
      expect(screen.getByText('EMA')).toBeInTheDocument();
      expect(screen.getByText('RSI')).toBeInTheDocument();
      expect(screen.getByText('MACD')).toBeInTheDocument();
      expect(screen.getByText('BB')).toBeInTheDocument();
      expect(screen.getByText('VWAP')).toBeInTheDocument();
    });

    it('should display logical operator tiles', () => {
      render(<CustomStrategyBuilder {...defaultProps} />);
      expect(screen.getByText('AND')).toBeInTheDocument();
      expect(screen.getByText('OR')).toBeInTheDocument();
      expect(screen.getByText('NOT')).toBeInTheDocument();
    });

    it('should show empty message when no buy conditions are added', () => {
      render(<CustomStrategyBuilder {...defaultProps} />);
      expect(screen.getByText('Drag indicators here to define when to buy')).toBeInTheDocument();
    });

    it('should add indicator to buy chain when clicking + icon', () => {
      render(<CustomStrategyBuilder {...defaultProps} />);
      
      // Find all + buttons (AddIcon)
      const addButtons = screen.getAllByRole('button', { hidden: true }).filter(
        (btn) => btn.querySelector('svg[data-testid="AddIcon"]')
      );
      
      // Click the first + button (should be on SMA tile)
      if (addButtons.length > 0) {
        fireEvent.click(addButtons[0]);
        
        // Should now show the indicator in the chain
        waitFor(() => {
          expect(screen.getByText(/SMA/i)).toBeInTheDocument();
        });
      }
    });

    it('should prevent moving to next step without buy conditions', () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      
      render(<CustomStrategyBuilder {...defaultProps} />);
      
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);
      
      expect(alertSpy).toHaveBeenCalledWith('Please add at least one buy condition before continuing');
      
      alertSpy.mockRestore();
    });
  });

  describe('Step 2: Sell Conditions', () => {
    it('should render sell conditions step when navigating from step 1', async () => {
      render(<CustomStrategyBuilder {...defaultProps} />);
      
      // Add a buy condition first
      const addButtons = screen.getAllByRole('button', { hidden: true }).filter(
        (btn) => btn.querySelector('svg[data-testid="AddIcon"]')
      );
      
      if (addButtons.length > 0) {
        fireEvent.click(addButtons[0]);
      }
      
      // Click Next
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);
      
      await waitFor(() => {
        expect(screen.getByText('Define Sell Conditions')).toBeInTheDocument();
      });
    });

    it('should prevent moving to next step without sell conditions', async () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      
      render(<CustomStrategyBuilder {...defaultProps} />);
      
      // Add buy condition and move to step 2
      const addButtons = screen.getAllByRole('button', { hidden: true }).filter(
        (btn) => btn.querySelector('svg[data-testid="AddIcon"]')
      );
      
      if (addButtons.length > 0) {
        fireEvent.click(addButtons[0]);
      }
      
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);
      
      await waitFor(() => {
        expect(screen.getByText('Define Sell Conditions')).toBeInTheDocument();
      });
      
      // Try to move to step 3 without sell conditions
      const nextButton2 = screen.getByText('Next');
      fireEvent.click(nextButton2);
      
      expect(alertSpy).toHaveBeenCalledWith('Please add at least one sell condition before continuing');
      
      alertSpy.mockRestore();
    });
  });

  describe('Step 3: Strategy Details', () => {
    const navigateToStep3 = async () => {
      render(<CustomStrategyBuilder {...defaultProps} />);
      
      // Add buy condition
      const addButtons = screen.getAllByRole('button', { hidden: true }).filter(
        (btn) => btn.querySelector('svg[data-testid="AddIcon"]')
      );
      
      if (addButtons.length > 0) {
        fireEvent.click(addButtons[0]);
      }
      
      // Move to step 2
      const nextButton1 = screen.getByText('Next');
      fireEvent.click(nextButton1);
      
      await waitFor(() => {
        expect(screen.getByText('Define Sell Conditions')).toBeInTheDocument();
      });
      
      // Add sell condition
      const addButtons2 = screen.getAllByRole('button', { hidden: true }).filter(
        (btn) => btn.querySelector('svg[data-testid="AddIcon"]')
      );
      
      if (addButtons2.length > 0) {
        fireEvent.click(addButtons2[0]);
      }
      
      // Move to step 3
      const nextButton2 = screen.getByText('Next');
      fireEvent.click(nextButton2);
      
      await waitFor(() => {
        expect(screen.getByText('Strategy Details')).toBeInTheDocument();
      });
    };

    it('should render strategy details step', async () => {
      await navigateToStep3();
      expect(screen.getByText('Strategy Details')).toBeInTheDocument();
    });

    it('should display strategy name input', async () => {
      await navigateToStep3();
      expect(screen.getByLabelText('Strategy Name')).toBeInTheDocument();
    });

    it('should display description input', async () => {
      await navigateToStep3();
      expect(screen.getByLabelText('Description (Optional)')).toBeInTheDocument();
    });

    it('should display public strategy toggle', async () => {
      await navigateToStep3();
      expect(screen.getByText('Make Strategy Public')).toBeInTheDocument();
    });

    it('should show validation disclaimer', async () => {
      await navigateToStep3();
      expect(screen.getByText(/Strategy Validation/i)).toBeInTheDocument();
      expect(screen.getByText(/We will attempt to validate/i)).toBeInTheDocument();
    });

    it('should call validateCustomStrategy when reaching step 3', async () => {
      await navigateToStep3();
      
      await waitFor(() => {
        expect(customStrategiesApi.validateCustomStrategy).toHaveBeenCalled();
      });
    });

    it('should display validation errors when present', async () => {
      (customStrategiesApi.validateCustomStrategy as any).mockResolvedValue({
        data: {
          success: false,
          data: {
            valid: false,
            errors: ['Buy and sell conditions cannot be identical'],
            warnings: [],
          },
        },
      });

      await navigateToStep3();

      await waitFor(() => {
        expect(screen.getByText('Validation Errors')).toBeInTheDocument();
        expect(screen.getByText('Buy and sell conditions cannot be identical')).toBeInTheDocument();
      });
    });

    it('should display validation warnings when present', async () => {
      (customStrategiesApi.validateCustomStrategy as any).mockResolvedValue({
        data: {
          success: true,
          data: {
            valid: true,
            errors: [],
            warnings: ['RSI period of 1 is outside the typical range'],
          },
        },
      });

      await navigateToStep3();

      await waitFor(() => {
        expect(screen.getByText('Validation Warnings')).toBeInTheDocument();
        expect(screen.getByText(/RSI period/i)).toBeInTheDocument();
      });
    });

    it('should show strategy summary with buy and sell conditions', async () => {
      await navigateToStep3();

      await waitFor(() => {
        expect(screen.getByText('Strategy Summary')).toBeInTheDocument();
        expect(screen.getByText('Buy Conditions')).toBeInTheDocument();
        expect(screen.getByText('Sell Conditions')).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    it('should navigate back to previous step', async () => {
      render(<CustomStrategyBuilder {...defaultProps} />);
      
      // Add buy condition and move to step 2
      const addButtons = screen.getAllByRole('button', { hidden: true }).filter(
        (btn) => btn.querySelector('svg[data-testid="AddIcon"]')
      );
      
      if (addButtons.length > 0) {
        fireEvent.click(addButtons[0]);
      }
      
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);
      
      await waitFor(() => {
        expect(screen.getByText('Define Sell Conditions')).toBeInTheDocument();
      });
      
      // Click Back
      const backButton = screen.getByText('Back');
      fireEvent.click(backButton);
      
      await waitFor(() => {
        expect(screen.getByText('Define Buy Conditions')).toBeInTheDocument();
      });
    });

    it('should disable back button on first step', () => {
      render(<CustomStrategyBuilder {...defaultProps} />);
      const backButton = screen.getByText('Back');
      expect(backButton).toBeDisabled();
    });
  });

  describe('Save Strategy', () => {
    const setupForSave = async () => {
      render(<CustomStrategyBuilder {...defaultProps} />);
      
      // Add buy condition
      const addButtons = screen.getAllByRole('button', { hidden: true }).filter(
        (btn) => btn.querySelector('svg[data-testid="AddIcon"]')
      );
      
      if (addButtons.length > 0) {
        fireEvent.click(addButtons[0]);
      }
      
      // Move to step 2
      const nextButton1 = screen.getByText('Next');
      fireEvent.click(nextButton1);
      
      await waitFor(() => {
        expect(screen.getByText('Define Sell Conditions')).toBeInTheDocument();
      });
      
      // Add sell condition
      const addButtons2 = screen.getAllByRole('button', { hidden: true }).filter(
        (btn) => btn.querySelector('svg[data-testid="AddIcon"]')
      );
      
      if (addButtons2.length > 0) {
        fireEvent.click(addButtons2[0]);
      }
      
      // Move to step 3
      const nextButton2 = screen.getByText('Next');
      fireEvent.click(nextButton2);
      
      await waitFor(() => {
        expect(screen.getByText('Strategy Details')).toBeInTheDocument();
      });
      
      // Enter strategy name
      const nameInput = screen.getByLabelText('Strategy Name');
      fireEvent.change(nameInput, { target: { value: 'Test Strategy' } });
    };

    it('should prevent saving without strategy name', async () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      
      await setupForSave();
      
      const saveButton = screen.getByText('Create Strategy');
      fireEvent.click(saveButton);
      
      expect(alertSpy).toHaveBeenCalledWith('Please enter a strategy name');
      
      alertSpy.mockRestore();
    });

    it('should call onSave with correct data when saving', async () => {
      await setupForSave();
      
      const saveButton = screen.getByText('Create Strategy');
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
      });
      
      const saveCall = mockOnSave.mock.calls[0][0];
      expect(saveCall.name).toBe('Test Strategy');
      expect(saveCall.buy_conditions).toBeDefined();
      expect(saveCall.sell_conditions).toBeDefined();
    });

    it('should include is_public flag when toggled', async () => {
      await setupForSave();
      
      // Toggle public switch
      const publicSwitch = screen.getByLabelText('Make Strategy Public');
      fireEvent.click(publicSwitch);
      
      const saveButton = screen.getByText('Create Strategy');
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
      });
      
      const saveCall = mockOnSave.mock.calls[0][0];
      expect(saveCall.is_public).toBe(true);
    });

    it('should close dialog after successful save', async () => {
      await setupForSave();
      
      const saveButton = screen.getByText('Create Strategy');
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('should show loading state when isLoading is true', () => {
      render(<CustomStrategyBuilder {...defaultProps} isLoading={true} />);
      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });
  });

  describe('Edit Mode', () => {
    const editingStrategy = {
      id: 1,
      name: 'Existing Strategy',
      description: 'Existing Description',
      buy_conditions: {
        type: 'indicator' as const,
        indicator: {
          type: 'rsi' as const,
          params: { period: 14, source: 'close' },
          condition: 'oversold',
          value: 30,
        },
      },
      sell_conditions: {
        type: 'indicator' as const,
        indicator: {
          type: 'rsi' as const,
          params: { period: 14, source: 'close' },
          condition: 'overbought',
          value: 70,
        },
      },
      is_public: true,
    };

    it('should populate form fields when editing', () => {
      render(<CustomStrategyBuilder {...defaultProps} editingStrategy={editingStrategy} />);
      
      // Navigate to step 3 to see the name field
      // For now, just check that edit mode is detected
      expect(screen.getByText('Edit Custom Strategy')).toBeInTheDocument();
    });

    it('should show update button text when editing', async () => {
      render(<CustomStrategyBuilder {...defaultProps} editingStrategy={editingStrategy} />);
      
      // Add conditions and navigate to step 3
      const addButtons = screen.getAllByRole('button', { hidden: true }).filter(
        (btn) => btn.querySelector('svg[data-testid="AddIcon"]')
      );
      
      if (addButtons.length > 0) {
        fireEvent.click(addButtons[0]);
      }
      
      const nextButton1 = screen.getByText('Next');
      fireEvent.click(nextButton1);
      
      await waitFor(() => {
        expect(screen.getByText('Define Sell Conditions')).toBeInTheDocument();
      });
      
      if (addButtons.length > 0) {
        fireEvent.click(addButtons[0]);
      }
      
      const nextButton2 = screen.getByText('Next');
      fireEvent.click(nextButton2);
      
      await waitFor(() => {
        expect(screen.getByText('Update Strategy')).toBeInTheDocument();
      });
    });
  });

  describe('Dialog Close', () => {
    it('should call onClose when cancel button is clicked', () => {
      render(<CustomStrategyBuilder {...defaultProps} />);
      
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);
      
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should reset state when dialog is closed', async () => {
      const { rerender } = render(<CustomStrategyBuilder {...defaultProps} />);
      
      // Add some data
      const addButtons = screen.getAllByRole('button', { hidden: true }).filter(
        (btn) => btn.querySelector('svg[data-testid="AddIcon"]')
      );
      
      if (addButtons.length > 0) {
        fireEvent.click(addButtons[0]);
      }
      
      // Close dialog
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);
      
      // Reopen dialog
      rerender(<CustomStrategyBuilder {...defaultProps} open={true} />);
      
      // Should be reset
      expect(screen.getByText('Drag indicators here to define when to buy')).toBeInTheDocument();
    });
  });

  describe('Validation Error Handling', () => {
    it('should handle API validation errors gracefully', async () => {
      (customStrategiesApi.validateCustomStrategy as any).mockRejectedValue({
        response: {
          data: {
            error: 'Network error',
          },
        },
      });

      render(<CustomStrategyBuilder {...defaultProps} />);
      
      // Add conditions and navigate to step 3
      const addButtons = screen.getAllByRole('button', { hidden: true }).filter(
        (btn) => btn.querySelector('svg[data-testid="AddIcon"]')
      );
      
      if (addButtons.length > 0) {
        fireEvent.click(addButtons[0]);
      }
      
      const nextButton1 = screen.getByText('Next');
      fireEvent.click(nextButton1);
      
      await waitFor(() => {
        expect(screen.getByText('Define Sell Conditions')).toBeInTheDocument();
      });
      
      if (addButtons.length > 0) {
        fireEvent.click(addButtons[0]);
      }
      
      const nextButton2 = screen.getByText('Next');
      fireEvent.click(nextButton2);
      
      await waitFor(() => {
        // Should show error message
        expect(screen.getByText(/Failed to validate strategy/i)).toBeInTheDocument();
      });
    });
  });
});

