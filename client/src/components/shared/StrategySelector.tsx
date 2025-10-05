import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  CircularProgress,
  Chip,
  Tooltip,
  IconButton,
  Divider,
} from '@mui/material';
import {
  ExpandMore,
  Info,
  TrendingUp,
  Assessment,
  Settings,
  Refresh,
} from '@mui/icons-material';
import { getAvailableStrategies, TradingStrategy } from '../../api/tradingApi';

interface StrategySelectorProps {
  selectedStrategy: string;
  onStrategyChange: (strategy: string) => void;
  strategyParameters: Record<string, any>;
  onParametersChange: (parameters: Record<string, any>) => void;
  title?: string;
  description?: string;
  showTips?: boolean;
  compact?: boolean;
  availableStrategies?: TradingStrategy[];
}

interface StrategyParameter {
  name: string;
  type: 'number' | 'string' | 'boolean';
  min?: number;
  max?: number;
  step?: number;
  description: string;
  default: any;
}

const StrategySelector: React.FC<StrategySelectorProps> = ({
  selectedStrategy,
  onStrategyChange,
  strategyParameters,
  onParametersChange,
  title = "Select Trading Strategy",
  description = "Choose a trading strategy that will determine when to buy and sell stocks. Each strategy has different parameters that you can customize.",
  showTips = true,
  compact = false,
  availableStrategies: propStrategies,
}) => {
  const [strategies, setStrategies] = useState<TradingStrategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedStrategy, setExpandedStrategy] = useState<string | false>(false);

  // Default strategies with their parameters
  const defaultStrategies: TradingStrategy[] = [
    {
      name: 'MovingAverage',
      description: 'Uses moving average crossover to generate buy/sell signals. When short-term moving average crosses above long-term, buy. When it crosses below, sell.',
      parameters: {
        shortWindow: 5,
        longWindow: 10,
      },
      enabled: true,
      symbols: [],
    },
    {
      name: 'BollingerBands',
      description: 'Uses Bollinger Bands to identify overbought/oversold conditions. Buy when price touches lower band, sell when it touches upper band.',
      parameters: {
        window: 20,
        numStdDev: 2,
      },
      enabled: true,
      symbols: [],
    },
    {
      name: 'MeanReversion',
      description: 'Identifies when prices deviate significantly from their mean and expects them to revert. Good for range-bound markets.',
      parameters: {
        window: 20,
        threshold: 2,
      },
      enabled: true,
      symbols: [],
    },
    {
      name: 'Momentum',
      description: 'Follows the trend by buying when momentum is positive and selling when it turns negative. Good for trending markets.',
      parameters: {
        window: 10,
        threshold: 0.02,
      },
      enabled: true,
      symbols: [],
    },
    {
      name: 'Breakout',
      description: 'Identifies when prices break through resistance or support levels. Buy on upward breakouts, sell on downward breakouts.',
      parameters: {
        window: 20,
        threshold: 0.05,
      },
      enabled: true,
      symbols: [],
    },
  ];

  useEffect(() => {
    if (propStrategies) {
      setStrategies(propStrategies);
      setLoading(false);
    } else {
      fetchStrategies();
    }
  }, [propStrategies]);

  const fetchStrategies = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAvailableStrategies();
      setStrategies(response.data.strategies || defaultStrategies);
    } catch (err) {
      console.error('Error fetching strategies:', err);
      setStrategies(defaultStrategies);
      setError('Failed to load strategies, using defaults');
    } finally {
      setLoading(false);
    }
  };

  const handleStrategyChange = (strategyName: string) => {
    onStrategyChange(strategyName);
    const strategy = strategies.find(s => s.name === strategyName);
    if (strategy) {
      onParametersChange(strategy.parameters);
    }
  };

  const handleParameterChange = (paramName: string, value: any) => {
    onParametersChange({
      ...strategyParameters,
      [paramName]: value,
    });
  };

  const getParameterInfo = (strategyName: string): Record<string, StrategyParameter> => {
    const parameterInfo: Record<string, Record<string, StrategyParameter>> = {
      MovingAverage: {
        shortWindow: {
          name: 'Short Window',
          type: 'number',
          min: 2,
          max: 50,
          step: 1,
          description: 'Number of periods for short-term moving average',
          default: 5,
        },
        longWindow: {
          name: 'Long Window',
          type: 'number',
          min: 5,
          max: 200,
          step: 1,
          description: 'Number of periods for long-term moving average',
          default: 10,
        },
      },
      BollingerBands: {
        window: {
          name: 'Window',
          type: 'number',
          min: 5,
          max: 50,
          step: 1,
          description: 'Number of periods for moving average calculation',
          default: 20,
        },
        numStdDev: {
          name: 'Standard Deviations',
          type: 'number',
          min: 1,
          max: 3,
          step: 0.1,
          description: 'Number of standard deviations for band calculation',
          default: 2,
        },
      },
      MeanReversion: {
        window: {
          name: 'Window',
          type: 'number',
          min: 5,
          max: 50,
          step: 1,
          description: 'Number of periods for mean calculation',
          default: 20,
        },
        threshold: {
          name: 'Threshold',
          type: 'number',
          min: 1,
          max: 5,
          step: 0.1,
          description: 'Number of standard deviations for signal generation',
          default: 2,
        },
      },
      Momentum: {
        window: {
          name: 'Window',
          type: 'number',
          min: 5,
          max: 50,
          step: 1,
          description: 'Number of periods for momentum calculation',
          default: 10,
        },
        threshold: {
          name: 'Threshold',
          type: 'number',
          min: 0.01,
          max: 0.1,
          step: 0.01,
          description: 'Minimum momentum change for signal generation',
          default: 0.02,
        },
      },
      Breakout: {
        window: {
          name: 'Window',
          type: 'number',
          min: 5,
          max: 50,
          step: 1,
          description: 'Number of periods for support/resistance calculation',
          default: 20,
        },
        threshold: {
          name: 'Threshold',
          type: 'number',
          min: 0.01,
          max: 0.2,
          step: 0.01,
          description: 'Minimum breakout percentage for signal generation',
          default: 0.05,
        },
      },
    };

    return parameterInfo[strategyName] || {};
  };

  const renderParameterInput = (paramName: string, paramInfo: StrategyParameter) => {
    const value = strategyParameters[paramName] ?? paramInfo.default;

    switch (paramInfo.type) {
      case 'number':
        return (
          <TextField
            type="number"
            label={paramInfo.name}
            value={value}
            onChange={(e) => handleParameterChange(paramName, parseFloat(e.target.value))}
            inputProps={{
              min: paramInfo.min,
              max: paramInfo.max,
              step: paramInfo.step,
            }}
            size="small"
            fullWidth
            helperText={paramInfo.description}
          />
        );
      case 'string':
        return (
          <TextField
            label={paramInfo.name}
            value={value}
            onChange={(e) => handleParameterChange(paramName, e.target.value)}
            size="small"
            fullWidth
            helperText={paramInfo.description}
          />
        );
      case 'boolean':
        return (
          <FormControlLabel
            control={
              <Radio
                checked={value}
                onChange={(e) => handleParameterChange(paramName, e.target.checked)}
              />
            }
            label={paramInfo.name}
          />
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  const content = (
    <Box>
      {/* Header */}
      {!compact && (
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" component="h3">
            {title}
          </Typography>
          <Tooltip title="Refresh Strategies">
            <IconButton onClick={fetchStrategies} size="small">
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
      )}

      {/* Description */}
      {!compact && description && (
        <Typography variant="body2" color="textSecondary" mb={3}>
          {description}
        </Typography>
      )}

      {/* Error Alert */}
      {error && (
        <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Strategy Selection */}
      <FormControl component="fieldset" fullWidth>
        {!compact && <FormLabel component="legend">Available Strategies</FormLabel>}
        <RadioGroup
          value={selectedStrategy}
          onChange={(e) => handleStrategyChange(e.target.value)}
        >
          {strategies.map((strategy) => (
            <Accordion
              key={strategy.name}
              expanded={expandedStrategy === strategy.name}
              onChange={(_, isExpanded) => setExpandedStrategy(isExpanded ? strategy.name : false)}
              sx={{ mb: 1 }}
            >
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box display="flex" alignItems="center" width="100%">
                  <FormControlLabel
                    value={strategy.name}
                    control={<Radio />}
                    label={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="subtitle1">{strategy.name}</Typography>
                        {selectedStrategy === strategy.name && (
                          <Chip label="Selected" size="small" color="primary" />
                        )}
                      </Box>
                    }
                    onClick={(e) => e.stopPropagation()}
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Box>
                  <Typography variant="body2" color="textSecondary" mb={2}>
                    {strategy.description}
                  </Typography>
                  
                  {/* Strategy Parameters */}
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      <Settings sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Parameters
                    </Typography>
                    <Grid container spacing={2}>
                      {Object.entries(getParameterInfo(strategy.name)).map(([paramName, paramInfo]) => (
                        <Grid item xs={12} sm={6} key={paramName}>
                          {renderParameterInput(paramName, paramInfo)}
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                </Box>
              </AccordionDetails>
            </Accordion>
          ))}
        </RadioGroup>
      </FormControl>

      {/* Strategy Info */}
      {selectedStrategy && !compact && (
        <Box mt={3} p={2} bgcolor="grey.50" borderRadius={1}>
          <Box display="flex" alignItems="flex-start" gap={1}>
            <Info color="info" fontSize="small" />
            <Box>
              <Typography variant="body2" color="textSecondary">
                <strong>Selected Strategy:</strong> {selectedStrategy}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                <strong>Parameters:</strong> {Object.entries(strategyParameters).map(([key, value]) => `${key}: ${value}`).join(', ')}
              </Typography>
            </Box>
          </Box>
        </Box>
      )}

      {/* Strategy Tips */}
      {showTips && !compact && (
        <Box mt={2} p={2} bgcolor="primary.50" borderRadius={1}>
          <Typography variant="subtitle2" gutterBottom>
            <TrendingUp sx={{ mr: 1, verticalAlign: 'middle' }} />
            Strategy Tips
          </Typography>
          <Typography variant="body2" color="textSecondary">
            • <strong>Moving Average:</strong> Best for trending markets. Shorter windows = more signals, longer windows = fewer but more reliable signals.
          </Typography>
          <Typography variant="body2" color="textSecondary">
            • <strong>Bollinger Bands:</strong> Good for range-bound markets. Lower standard deviations = more signals.
          </Typography>
          <Typography variant="body2" color="textSecondary">
            • <strong>Mean Reversion:</strong> Works well in sideways markets. Higher thresholds = fewer but stronger signals.
          </Typography>
          <Typography variant="body2" color="textSecondary">
            • <strong>Momentum:</strong> Best for strong trending markets. Lower thresholds = more sensitive to price changes.
          </Typography>
          <Typography variant="body2" color="textSecondary">
            • <strong>Breakout:</strong> Good for volatile markets. Lower thresholds = more breakout signals.
          </Typography>
        </Box>
      )}
    </Box>
  );

  if (compact) {
    return content;
  }

  return (
    <Card>
      <CardContent>
        {content}
      </CardContent>
    </Card>
  );
};

export default StrategySelector;
