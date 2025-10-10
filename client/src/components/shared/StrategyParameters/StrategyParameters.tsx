import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Button,
  Alert,
  Chip,
  Divider,
} from "@mui/material";
import { Settings, Save, Refresh } from "@mui/icons-material";

// Strategy parameter configuration with min/max limits
export interface StrategyParameterConfig {
  type: 'number' | 'select' | 'boolean';
  label: string;
  defaultValue: any;
  min?: number;
  max?: number;
  step?: number;
  options?: { value: any; label: string }[];
  helperText?: string;
  required?: boolean;
}

export interface StrategyConfig {
  [key: string]: StrategyParameterConfig;
}

// Predefined strategy configurations with proper limits
export const STRATEGY_CONFIGS: Record<string, StrategyConfig> = {
  SentimentAnalysis: {
    lookbackDays: {
      type: 'number',
      label: 'Lookback Days',
      defaultValue: 3,
      min: 1,
      max: 30,
      helperText: 'Number of days to look back for news articles',
      required: true,
    },
    minArticles: {
      type: 'number',
      label: 'Min Articles',
      defaultValue: 2,
      min: 1,
      max: 50,
      helperText: 'Minimum number of articles required for analysis',
      required: true,
    },
    buyThreshold: {
      type: 'number',
      label: 'Buy Threshold',
      defaultValue: 0.4,
      min: 0,
      max: 1,
      step: 0.05,
      helperText: 'Sentiment score threshold for buy signals',
      required: true,
    },
    sellThreshold: {
      type: 'number',
      label: 'Sell Threshold',
      defaultValue: -0.4,
      min: -1,
      max: 0,
      step: 0.05,
      helperText: 'Sentiment score threshold for sell signals',
      required: true,
    },
    titleWeight: {
      type: 'number',
      label: 'Title Weight',
      defaultValue: 2.0,
      min: 0.5,
      max: 5.0,
      step: 0.1,
      helperText: 'Weight multiplier for article titles vs content',
      required: true,
    },
    recencyHalfLifeHours: {
      type: 'number',
      label: 'Recency Half-Life (hours)',
      defaultValue: 12,
      min: 1,
      max: 72,
      helperText: 'Hours for recency weighting decay',
      required: true,
    },
  },
  MeanReversion: {
    window: {
      type: 'number',
      label: 'Window',
      defaultValue: 20,
      min: 5,
      max: 200,
      helperText: 'Number of periods for mean calculation',
      required: true,
    },
    threshold: {
      type: 'number',
      label: 'Threshold',
      defaultValue: 0.05,
      min: 0.01,
      max: 0.2,
      step: 0.01,
      helperText: 'Percentage threshold for signal generation',
      required: true,
    },
  },
  MovingAverage: {
    shortWindow: {
      type: 'number',
      label: 'Short Window',
      defaultValue: 5,
      min: 2,
      max: 50,
      helperText: 'Short-term moving average periods',
      required: true,
    },
    longWindow: {
      type: 'number',
      label: 'Long Window',
      defaultValue: 10,
      min: 5,
      max: 200,
      helperText: 'Long-term moving average periods',
      required: true,
    },
    maType: {
      type: 'select',
      label: 'MA Type',
      defaultValue: 'SMA',
      options: [
        { value: 'SMA', label: 'Simple Moving Average' },
        { value: 'EMA', label: 'Exponential Moving Average' },
      ],
      helperText: 'Type of moving average to use',
      required: true,
    },
  },
  MovingAverageCrossover: {
    fastWindow: {
      type: 'number',
      label: 'Fast Window',
      defaultValue: 10,
      min: 5,
      max: 50,
      helperText: 'Fast moving average window in days',
      required: true,
    },
    slowWindow: {
      type: 'number',
      label: 'Slow Window',
      defaultValue: 30,
      min: 10,
      max: 200,
      helperText: 'Slow moving average window in days',
      required: true,
    },
    maType: {
      type: 'select',
      label: 'Moving Average Type',
      defaultValue: 'SMA',
      options: [
        { value: 'SMA', label: 'Simple Moving Average (SMA)' },
        { value: 'EMA', label: 'Exponential Moving Average (EMA)' },
      ],
      helperText: 'Type of moving average to use',
      required: true,
    },
  },
  Momentum: {
    rsiWindow: {
      type: 'number',
      label: 'RSI Window',
      defaultValue: 14,
      min: 5,
      max: 50,
      helperText: 'RSI calculation window in days',
      required: true,
    },
    rsiOverbought: {
      type: 'number',
      label: 'RSI Overbought',
      defaultValue: 70,
      min: 60,
      max: 90,
      helperText: 'RSI level considered overbought',
      required: true,
    },
    rsiOversold: {
      type: 'number',
      label: 'RSI Oversold',
      defaultValue: 30,
      min: 10,
      max: 40,
      helperText: 'RSI level considered oversold',
      required: true,
    },
    momentumWindow: {
      type: 'number',
      label: 'Momentum Window',
      defaultValue: 10,
      min: 5,
      max: 50,
      helperText: 'Momentum calculation window in days',
      required: true,
    },
    momentumThreshold: {
      type: 'number',
      label: 'Momentum Threshold',
      defaultValue: 0.02,
      min: 0.01,
      max: 0.1,
      step: 0.01,
      helperText: 'Minimum momentum percentage for signals',
      required: true,
    },
  },
  BollingerBands: {
    window: {
      type: 'number',
      label: 'Window',
      defaultValue: 20,
      min: 5,
      max: 50,
      helperText: 'Moving average window for Bollinger Bands',
      required: true,
    },
    multiplier: {
      type: 'number',
      label: 'Multiplier',
      defaultValue: 2.0,
      min: 1.0,
      max: 3.0,
      step: 0.1,
      helperText: 'Standard deviation multiplier for bands',
      required: true,
    },
  },
  Breakout: {
    lookbackWindow: {
      type: 'number',
      label: 'Lookback Window',
      defaultValue: 20,
      min: 5,
      max: 100,
      helperText: 'Number of periods to look back for support/resistance',
      required: true,
    },
    breakoutThreshold: {
      type: 'number',
      label: 'Breakout Threshold',
      defaultValue: 0.01,
      min: 0.005,
      max: 0.05,
      step: 0.01,
      helperText: 'Percentage threshold for breakout confirmation',
      required: true,
    },
    minVolumeRatio: {
      type: 'number',
      label: 'Min Volume Ratio',
      defaultValue: 1.5,
      min: 1.0,
      max: 5.0,
      step: 0.1,
      helperText: 'Minimum volume ratio for breakout confirmation',
      required: true,
    },
    confirmationPeriod: {
      type: 'number',
      label: 'Confirmation Period',
      defaultValue: 2,
      min: 1,
      max: 5,
      helperText: 'Number of periods to confirm breakout',
      required: true,
    },
  },
};

export interface StrategyParametersProps {
  selectedStrategy: string;
  strategyParameters: Record<string, any>;
  onParametersChange: (parameters: Record<string, any>) => void;
  showSaveButton?: boolean;
  showResetButton?: boolean;
  compact?: boolean;
  showCurrentValues?: boolean;
  title?: string;
  description?: string;
  strategyDefinitions?: Record<string, StrategyConfig>;
}

const StrategyParameters: React.FC<StrategyParametersProps> = ({
  selectedStrategy,
  strategyParameters,
  onParametersChange,
  showSaveButton = true,
  showResetButton = true,
  compact = false,
  showCurrentValues = false,
  title = "Strategy Parameters",
  description = "Configure the parameters for your selected strategy. These settings will determine how the strategy behaves.",
  strategyDefinitions,
}) => {
  const [localParameters, setLocalParameters] = useState<Record<string, any>>(strategyParameters);
  const [hasChanges, setHasChanges] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Get strategy configuration - use API data if available, otherwise fall back to hardcoded
  const strategyConfig = strategyDefinitions?.[selectedStrategy] || STRATEGY_CONFIGS[selectedStrategy] || {};

  // Reset parameters when strategy changes
  useEffect(() => {
    const defaultParams: Record<string, any> = {};
    
    Object.entries(strategyConfig).forEach(([key, config]) => {
      defaultParams[key] = config.defaultValue;
    });
    
    setLocalParameters(defaultParams);
    setHasChanges(false);
    setValidationErrors({});
  }, [selectedStrategy, strategyConfig]);

  // Check for changes
  useEffect(() => {
    const hasChanges = JSON.stringify(localParameters) !== JSON.stringify(strategyParameters);
    setHasChanges(hasChanges);
  }, [localParameters, strategyParameters]);

  // Validate parameter value
  const validateParameter = (key: string, value: any): string | null => {
    const config = strategyConfig[key];
    if (!config) return null;

    if (config.required && (value === null || value === undefined || value === '')) {
      return `${config.label} is required`;
    }

    if (config.type === 'number' && value !== null && value !== undefined) {
      const numValue = Number(value);
      if (isNaN(numValue)) {
        return `${config.label} must be a valid number`;
      }
      if (config.min !== undefined && numValue < config.min) {
        return `${config.label} must be at least ${config.min}`;
      }
      if (config.max !== undefined && numValue > config.max) {
        return `${config.label} must be at most ${config.max}`;
      }
    }

    return null;
  };

  const handleParameterChange = (key: string, value: any) => {
    const error = validateParameter(key, value);
    setValidationErrors(prev => ({
      ...prev,
      [key]: error || ''
    }));
    
    setLocalParameters(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    // Validate all parameters before saving
    const errors: Record<string, string> = {};
    let hasErrors = false;

    Object.entries(localParameters).forEach(([key, value]) => {
      const error = validateParameter(key, value);
      if (error) {
        errors[key] = error;
        hasErrors = true;
      }
    });

    if (hasErrors) {
      setValidationErrors(errors);
      return;
    }

    onParametersChange(localParameters);
    setHasChanges(false);
    setValidationErrors({});
  };

  const handleReset = () => {
    setLocalParameters(strategyParameters);
    setHasChanges(false);
    setValidationErrors({});
  };

  const renderParameterInput = (key: string, config: StrategyParameterConfig) => {
    const value = localParameters[key] ?? config.defaultValue;
    const error = validationErrors[key];

    const commonProps = {
      size: compact ? "small" : "medium" as const,
      fullWidth: true,
      error: !!error,
      helperText: error || config.helperText,
    };

    switch (config.type) {
      case 'number':
        return (
          <TextField
            key={key}
            label={config.label}
            type="number"
            value={value}
            onChange={(e) => {
              const newValue = config.step && config.step < 1 
                ? parseFloat(e.target.value) 
                : parseInt(e.target.value);
              handleParameterChange(key, newValue);
            }}
            inputProps={{
              min: config.min,
              max: config.max,
              step: config.step || 1,
            }}
            {...commonProps}
          />
        );

      case 'select':
        return (
          <FormControl key={key} {...commonProps}>
            <InputLabel>{config.label}</InputLabel>
            <Select
              value={value}
              onChange={(e) => handleParameterChange(key, e.target.value)}
              label={config.label}
            >
              {config.options?.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );

      case 'boolean':
        return (
          <FormControl key={key} {...commonProps}>
            <InputLabel>{config.label}</InputLabel>
            <Select
              value={value ? 'true' : 'false'}
              onChange={(e) => handleParameterChange(key, e.target.value === 'true')}
              label={config.label}
            >
              <MenuItem value="true">Yes</MenuItem>
              <MenuItem value="false">No</MenuItem>
            </Select>
          </FormControl>
        );

      default:
        return null;
    }
  };

  const renderParameterInputs = () => {
    if (!strategyConfig || Object.keys(strategyConfig).length === 0) {
      return (
        <Alert severity="info">
          No parameters available for the selected strategy.
        </Alert>
      );
    }

    return (
      <Stack spacing={compact ? 1.5 : 2}>
        {Object.entries(strategyConfig).map(([key, config]) => 
          renderParameterInput(key, config)
        )}
      </Stack>
    );
  };

  const renderCurrentValues = () => {
    if (!showCurrentValues || !strategyParameters || Object.keys(strategyParameters).length === 0) {
      return null;
    }

    return (
      <Box>
        <Typography variant="subtitle2" gutterBottom>
          Current Values
        </Typography>
        <Box display="flex" flexWrap="wrap" gap={1}>
          {Object.entries(strategyParameters).map(([key, value]) => (
            <Chip
              key={key}
              label={`${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`}
              size="small"
              variant="outlined"
            />
          ))}
        </Box>
        <Divider sx={{ my: 2 }} />
      </Box>
    );
  };

  return (
    <Box>
      <Paper sx={{ p: compact ? 2 : 3 }}>
        <Box display="flex" alignItems="center" mb={compact ? 2 : 3}>
          <Settings sx={{ mr: 1, verticalAlign: 'middle' }} />
          <Typography variant={compact ? "subtitle1" : "h6"}>
            {title}
          </Typography>
        </Box>
        
        {description && (
          <Typography variant="body2" color="textSecondary" paragraph>
            {description}
          </Typography>
        )}

        {renderCurrentValues()}

        <Box mb={compact ? 2 : 3}>
          <Typography variant="subtitle2" gutterBottom>
            {selectedStrategy} Parameters
          </Typography>
          {renderParameterInputs()}
        </Box>

        {(showSaveButton || showResetButton) && (
          <Box display="flex" gap={2} justifyContent="flex-end">
            {showResetButton && (
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={handleReset}
                disabled={!hasChanges}
                size={compact ? "small" : "medium"}
              >
                Reset
              </Button>
            )}
            {showSaveButton && (
              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={handleSave}
                disabled={!hasChanges || Object.values(validationErrors).some(error => error !== '')}
                size={compact ? "small" : "medium"}
              >
                Save Parameters
              </Button>
            )}
          </Box>
        )}

        {hasChanges && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            You have unsaved changes. Click "Save Parameters" to apply them.
          </Alert>
        )}

        {Object.values(validationErrors).some(error => error !== '') && (
          <Alert severity="error" sx={{ mt: 2 }}>
            Please fix the validation errors above before saving.
          </Alert>
        )}
      </Paper>
    </Box>
  );
};

export default StrategyParameters;
