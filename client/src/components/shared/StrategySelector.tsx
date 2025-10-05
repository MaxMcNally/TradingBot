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
  Alert,
  CircularProgress,
  Chip,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  Info,
  TrendingUp,
  Refresh,
} from '@mui/icons-material';
import { getAvailableStrategies, TradingStrategy } from '../../api/tradingApi';

interface StrategySelectorProps {
  selectedStrategy: string;
  onStrategyChange: (strategy: string) => void;
  onParametersChange: (parameters: Record<string, any>) => void;
  title?: string;
  description?: string;
  showTips?: boolean;
  compact?: boolean;
  availableStrategies?: TradingStrategy[];
}


const StrategySelector: React.FC<StrategySelectorProps> = ({
  selectedStrategy,
  onStrategyChange,
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
    if (strategy && strategy.parameters) {
      // Extract default values from parameter info objects
      const defaultParameters: Record<string, any> = {};
      Object.entries(strategy.parameters).forEach(([paramName, paramInfo]) => {
        if (typeof paramInfo === 'object' && paramInfo !== null && 'default' in paramInfo) {
          defaultParameters[paramName] = paramInfo.default;
        }
      });
      onParametersChange(defaultParameters);
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
            <Card key={strategy.name} sx={{ mb: 2, border: selectedStrategy === strategy.name ? 2 : 1, borderColor: selectedStrategy === strategy.name ? 'primary.main' : 'divider' }}>
              <CardContent>
                <Box display="flex" alignItems="center" width="100%" mb={2}>
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
                  />
                </Box>
                
                <Typography variant="body2" color="textSecondary">
                  {strategy.description}
                </Typography>
              </CardContent>
            </Card>
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
