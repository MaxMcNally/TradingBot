import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Tabs,
  Tab,
} from '@mui/material';
import {
  Info,
  TrendingUp,
  Refresh,
  Public as PublicIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { getAvailableStrategies, TradingStrategy } from '../../../api/tradingApi';
import { usePublicStrategies, useStrategies } from '../../../hooks';
import { EnhancedStrategySelectorProps, TabPanelProps } from './types';


function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`enhanced-strategy-tabpanel-${index}`}
      aria-labelledby={`enhanced-strategy-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

const EnhancedStrategySelector: React.FC<EnhancedStrategySelectorProps> = ({
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
  const [activeTab, setActiveTab] = useState(0);

  const {
    strategies: publicStrategies,
    isLoading: publicStrategiesLoading,
    isError: publicStrategiesError,
    error: publicStrategiesErrorMsg,
    refetch: refetchPublicStrategies
  } = usePublicStrategies();

  const {
    strategies: apiStrategies,
    isLoading: apiStrategiesLoading
  } = useStrategies();

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
      name: 'SentimentAnalysis',
      description: 'News sentiment-based strategy using recent articles to generate BUY/SELL signals.',
      parameters: {
        lookbackDays: 3,
        pollIntervalMinutes: 0,
        minArticles: 2,
        buyThreshold: 0.4,
        sellThreshold: -0.4,
        titleWeight: 2.0,
        recencyHalfLifeHours: 12,
        // backend controls news source; default set server-side
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

  // Track if we've already processed strategies to prevent infinite loops
  const hasProcessedRef = useRef(false);
  const processedStrategiesLengthRef = useRef(0);

  // Handle prop strategies (highest priority) - only run once when propStrategies changes
  useEffect(() => {
    if (propStrategies) {
      setStrategies(propStrategies);
      setLoading(false);
      hasProcessedRef.current = true;
      processedStrategiesLengthRef.current = propStrategies.length;
    }
  }, [propStrategies]);

  // Handle API strategies - only when propStrategies is not provided
  useEffect(() => {
    // Skip if prop strategies are provided
    if (propStrategies) {
      return;
    }

    // Skip if we've already processed these strategies (check by length)
    const currentLength = apiStrategies?.length || 0;
    if (hasProcessedRef.current && currentLength === processedStrategiesLengthRef.current) {
      return;
    }

    // Only process when loading is complete
    if (apiStrategiesLoading) {
      setLoading(true);
      return;
    }

    // Process API strategies
    if (apiStrategies && apiStrategies.length > 0) {
      try {
        setLoading(true);
        setError(null);
        
        const convertedStrategies: TradingStrategy[] = apiStrategies.map(strategy => ({
          name: strategy.name,
          description: strategy.description || 'No description available',
          parameters: strategy.parameters ? Object.fromEntries(
            Object.entries(strategy.parameters).map(([key, param]) => [key, { default: param.default }])
          ) : {},
          enabled: true,
          symbols: [],
        }));
        
        setStrategies(convertedStrategies);
        hasProcessedRef.current = true;
        processedStrategiesLengthRef.current = apiStrategies.length;
        setLoading(false);
      } catch (err) {
        console.error('Error processing strategies:', err);
        setError('Failed to process strategies');
        setLoading(false);
      }
    } else if (!hasProcessedRef.current) {
      // Fallback to trading API only if we haven't processed anything yet
      const fetchFromApi = async () => {
        try {
          setLoading(true);
          setError(null);
          const response = await getAvailableStrategies();
          setStrategies(response.data.strategies || defaultStrategies);
          hasProcessedRef.current = true;
          processedStrategiesLengthRef.current = response.data.strategies?.length || 0;
        } catch (err) {
          console.error('Error fetching strategies:', err);
          setStrategies(defaultStrategies);
          setError('Failed to load strategies, using defaults');
          hasProcessedRef.current = true;
          processedStrategiesLengthRef.current = defaultStrategies.length;
        } finally {
          setLoading(false);
        }
      };
      fetchFromApi();
    }
  }, [propStrategies, apiStrategiesLoading, apiStrategies?.length]);

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

  const handlePublicStrategyChange = (strategyType: string) => {
    onStrategyChange(strategyType);
    // Find the public strategy and use its actual config
    const publicStrategy = publicStrategies.find(s => s.strategy_type === strategyType);
    if (publicStrategy && publicStrategy.config) {
      onParametersChange(publicStrategy.config);
    } else {
      // Fallback to default parameters if no config is available
      const defaultParams: Record<string, any> = {
        window: 20,
        threshold: 0.05,
        shortWindow: 10,
        longWindow: 30
      };
      onParametersChange(defaultParams);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const renderStrategyCard = (strategy: TradingStrategy, isPublic: boolean = false) => {
    // Find the corresponding API strategy to get the display name
    const apiStrategy = apiStrategies.find(api => api.name === strategy.name);
    const displayName = apiStrategy?.displayName || strategy.name;
    
    return (
      <Card 
        key={strategy.name} 
        sx={{ 
          mb: 2, 
          border: selectedStrategy === strategy.name ? 2 : 1, 
          borderColor: selectedStrategy === strategy.name ? 'primary.main' : 'divider' 
        }}
      >
        <CardContent>
          <Box display="flex" alignItems="center" width="100%" mb={2}>
            <FormControlLabel
              value={strategy.name}
              control={<Radio />}
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="subtitle1">{displayName}</Typography>
                  {isPublic && (
                    <Tooltip title="Public Strategy">
                      <PublicIcon color="primary" fontSize="small" />
                    </Tooltip>
                  )}
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
    );
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

      {/* Strategy Selection with Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="strategy type tabs">
          <Tab 
            icon={<SettingsIcon />} 
            label="Basic Strategies" 
            iconPosition="start"
            id="enhanced-strategy-tab-0"
            aria-controls="enhanced-strategy-tabpanel-0"
          />
          <Tab 
            icon={<PublicIcon />} 
            label="Public Strategies" 
            iconPosition="start"
            id="enhanced-strategy-tab-1"
            aria-controls="enhanced-strategy-tabpanel-1"
          />
        </Tabs>
      </Box>

      {/* Basic Strategies Tab */}
      <TabPanel value={activeTab} index={0}>
        <FormControl component="fieldset" fullWidth>
          <FormLabel component="legend">Basic Strategies</FormLabel>
          <RadioGroup
            value={selectedStrategy}
            onChange={(e) => handleStrategyChange(e.target.value)}
          >
            {strategies.map((strategy) => renderStrategyCard(strategy, false))}
          </RadioGroup>
        </FormControl>
      </TabPanel>

      {/* Public Strategies Tab */}
      <TabPanel value={activeTab} index={1}>
        {publicStrategiesLoading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress />
          </Box>
        ) : publicStrategiesError ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            Error loading public strategies: {publicStrategiesErrorMsg?.message || 'Unknown error'}
            <Box sx={{ mt: 1 }}>
              <IconButton onClick={() => refetchPublicStrategies()} size="small">
                <Refresh />
              </IconButton>
            </Box>
          </Alert>
        ) : publicStrategies.length === 0 ? (
          <Alert severity="info">
            No public strategies are available at the moment. Check back later or create your own public strategy.
          </Alert>
        ) : (
          <FormControl component="fieldset" fullWidth>
            <FormLabel component="legend">Public Strategies</FormLabel>
            <RadioGroup
              value={selectedStrategy}
              onChange={(e) => handlePublicStrategyChange(e.target.value)}
            >
              {publicStrategies.map((strategy) => {
                // Find the corresponding API strategy to get the display name
                const apiStrategy = apiStrategies.find(api => api.name === strategy.strategy_type);
                const displayName = apiStrategy?.displayName || strategy.name;
                
                return (
                  <Card 
                    key={strategy.id}
                    sx={{ 
                      mb: 2, 
                      border: selectedStrategy === strategy.strategy_type ? 2 : 1, 
                      borderColor: selectedStrategy === strategy.strategy_type ? 'primary.main' : 'divider' 
                    }}
                  >
                    <CardContent>
                      <Box display="flex" alignItems="center" width="100%" mb={2}>
                        <FormControlLabel
                          value={strategy.strategy_type} // Use strategy_type as the value for API compatibility
                          control={<Radio />}
                          label={
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography variant="subtitle1">{displayName}</Typography>
                              {selectedStrategy === strategy.strategy_type && (
                                <Chip label="Selected" size="small" color="primary" />
                              )}
                            </Box>
                          }
                        />
                        <Chip 
                          label="Public" 
                          size="small" 
                          color="primary" 
                          sx={{ ml: 1 }}
                          icon={<PublicIcon />}
                        />
                      </Box>
                      <Typography variant="body2" color="textSecondary">
                        {strategy.description || 'No description available'}
                      </Typography>
                    </CardContent>
                  </Card>
                );
              })}
            </RadioGroup>
          </FormControl>
        )}
      </TabPanel>

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

export default EnhancedStrategySelector;

