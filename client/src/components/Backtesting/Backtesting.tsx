import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  CircularProgress,
  Stack,
  LinearProgress,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  PlayArrow,
  Assessment,
  Timeline,
  TrendingUp,
  Settings,
  Refresh,
  Tune,
  Save as SaveIcon,
} from "@mui/icons-material";
import { 
  BacktestFormData, 
  BacktestResponse
} from "./Backtesting.types";
import { 
  TabPanel,
  StockSelectionSection,
  StrategySelectionSection
} from "../shared";
import { useStrategies, useBacktest, useUserStrategies } from "../../hooks";
import SaveStrategyDialog from "./SaveStrategyDialog";

// Utility functions
const formatPercentage = (value: number | undefined | null): string => {
  if (value === undefined || value === null || isNaN(value)) {
    return "0.00%";
  }
  return `${(value * 100).toFixed(2)}%`;
};



const BacktestingSimple: React.FC = () => {
  // Tab state
  const [activeTab, setActiveTab] = useState(0);
  
  // State management
  const [formData, setFormData] = useState<BacktestFormData>({
    strategy: "meanReversion",
    symbols: [],
    startDate: "2023-01-01",
    endDate: "2023-12-31",
    initialCapital: 10000,
    sharesPerTrade: 100,
    // Mean Reversion parameters
    window: 20,
    threshold: 0.05,
    // Moving Average Crossover parameters
    fastWindow: 10,
    slowWindow: 30,
    maType: 'SMA',
    // Momentum parameters
    rsiWindow: 14,
    rsiOverbought: 70,
    rsiOversold: 30,
    momentumWindow: 10,
    momentumThreshold: 0.02,
    // Bollinger Bands parameters
    multiplier: 2.0,
    // Breakout parameters
    lookbackWindow: 20,
    breakoutThreshold: 0.01,
    minVolumeRatio: 1.5,
    confirmationPeriod: 2,
  });

  const [results, setResults] = useState<BacktestResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Strategy parameters for the reusable StrategySelector
  const [strategyParameters, setStrategyParameters] = useState<Record<string, any>>({});
  
  // Save strategy dialog state
  const [saveStrategyDialogOpen, setSaveStrategyDialogOpen] = useState(false);

  // Use hooks for strategies and backtesting
  const { strategies: availableStrategies, isLoading: strategiesLoading, isError: strategiesError } = useStrategies();
  const { runBacktest: runBacktestMutation, isLoading: backtestLoading } = useBacktest();
  const { saveFromBacktest, isCreating: isSavingStrategy } = useUserStrategies();

  // Reset strategy parameters when strategy changes
  useEffect(() => {
    if (formData.strategy) {
      // Clear existing parameters and set defaults for the selected strategy
      const defaultParams: Record<string, any> = {};
      
      switch (formData.strategy) {
        case 'meanReversion':
          defaultParams.window = 20;
          defaultParams.threshold = 0.05;
          break;
        case 'movingAverage':
          defaultParams.shortWindow = 5;
          defaultParams.longWindow = 10;
          break;
        case 'movingAverageCrossover':
          defaultParams.fastWindow = 10;
          defaultParams.slowWindow = 30;
          defaultParams.maType = 'SMA';
          break;
        case 'momentum':
          defaultParams.rsiWindow = 14;
          defaultParams.rsiOverbought = 70;
          defaultParams.rsiOversold = 30;
          break;
        case 'bollingerBands':
          defaultParams.window = 20;
          defaultParams.multiplier = 2.0;
          break;
        case 'breakout':
          defaultParams.lookbackWindow = 20;
          defaultParams.breakoutThreshold = 0.01;
          break;
        default:
          break;
      }
      
      setStrategyParameters(defaultParams);
    }
  }, [formData.strategy]);

  const handleInputChange = (field: keyof BacktestFormData, value: string | number): void => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleRunBacktest = async (): Promise<void> => {
    if (formData.symbols.length === 0) {
      setError("Please select at least one symbol");
      return;
    }

    try {
      setError(null);
      const response = await runBacktestMutation({
        strategy: formData.strategy,
        symbols: formData.symbols,
        startDate: formData.startDate,
        endDate: formData.endDate,
        initialCapital: formData.initialCapital,
        sharesPerTrade: formData.sharesPerTrade,
        ...strategyParameters  // Spread the parameters at the top level
      });

      if (response) {
        setResults(response);
        setActiveTab(3); // Switch to results tab
      }
    } catch (err: any) {
      setError(err.message || "Failed to run backtest");
    }
  };

  const handleSaveStrategy = async (strategyData: any) => {
    try {
      await saveFromBacktest(strategyData);
      setSaveStrategyDialogOpen(false);
    } catch (error) {
      console.error('Error saving strategy:', error);
      throw error;
    }
  };

  
  if (strategiesLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (strategiesError) {
    return (
      <Box p={3}>
        <Alert severity="error">Failed to load strategies</Alert>
      </Box>
    );
  }
  
  return (
    <Box>
      {/* Header */}
      <Box mb={3}>
        <Typography variant="h4" component="h1" gutterBottom>
          <Assessment sx={{ mr: 1, verticalAlign: 'middle' }} />
          Strategy Backtesting
        </Typography>
        <Typography variant="subtitle1" color="textSecondary">
          Test your trading strategies against historical data to evaluate performance.
        </Typography>
      </Box>

      {/* Main Content */}
      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange} aria-label="backtest tabs">
            <Tab
              icon={<TrendingUp />}
              label="Stock Selection"
              id="backtest-tab-0"
              aria-controls="backtest-tabpanel-0"
            />
            <Tab
              icon={<Settings />}
              label="Strategy Selection"
              id="backtest-tab-1"
              aria-controls="backtest-tabpanel-1"
            />
            <Tab
              icon={<Tune />}
              label="Strategy Parameters"
              id="backtest-tab-2"
              aria-controls="backtest-tabpanel-2"
            />
            <Tab
              icon={<Timeline />}
              label="Results"
              id="backtest-tab-3"
              aria-controls="backtest-tabpanel-3"
            />
          </Tabs>
        </Box>

        {/* Stock Selection Tab */}
        <TabPanel value={activeTab} index={0}>
          <StockSelectionSection
            selectedStocks={formData.symbols}
            onStocksChange={(symbols) => setFormData(prev => ({ ...prev, symbols }))}
            maxStocks={10}
            title="Stock Selection"
            description="Select the stocks you want to include in your backtest. You can choose up to {maxStocks} stocks."
            showSummary={true}
            summaryTitle="Selection Summary"
          />
        </TabPanel>

        {/* Strategy Selection Tab */}
        <TabPanel value={activeTab} index={1}>
          <StrategySelectionSection
            selectedStrategy={formData.strategy}
            onStrategyChange={(strategy) => handleInputChange('strategy', strategy)}
            onParametersChange={setStrategyParameters}
            strategyParameters={strategyParameters}
            title="Select Strategy for Backtesting"
            description="Choose a trading strategy to test against historical data. You can select from basic strategies or public strategies shared by other users."
            showSummary={true}
            summaryTitle="Strategy Summary"
            availableStrategies={availableStrategies.map(s => ({
              name: s.name,
              description: s.description || '',
              parameters: s.parameters || {},
              enabled: true,
              symbols: []
            }))}
          />
        </TabPanel>

        {/* Strategy Parameters Tab */}
        <TabPanel value={activeTab} index={2}>
          <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', lg: 'row' } }}>
            <Box sx={{ flex: 2 }}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  <Tune sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Strategy Parameters
                </Typography>
                <Typography variant="body2" color="textSecondary" paragraph>
                  Configure the parameters for your selected strategy. These settings will determine how the strategy behaves during backtesting.
                </Typography>

                <Stack spacing={3}>
                  {/* Strategy-Specific Parameters */}
                  {formData.strategy === 'meanReversion' && (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Mean Reversion Parameters
                      </Typography>
                      <Stack spacing={2}>
                        <TextField
                          label="Window"
                          type="number"
                          value={strategyParameters.window || 20}
                          onChange={(e) => setStrategyParameters(prev => ({ ...prev, window: parseInt(e.target.value) }))}
                          size="small"
                          fullWidth
                          helperText="Number of periods for mean calculation"
                        />
                        <TextField
                          label="Threshold"
                          type="number"
                          inputProps={{ step: "0.01" }}
                          value={strategyParameters.threshold || 0.05}
                          onChange={(e) => setStrategyParameters(prev => ({ ...prev, threshold: parseFloat(e.target.value) }))}
                          size="small"
                          fullWidth
                          helperText="Number of standard deviations for signal generation"
                        />
                      </Stack>
                    </Box>
                  )}

                  {formData.strategy === 'movingAverage' && (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Moving Average Parameters
                      </Typography>
                      <Stack spacing={2}>
                        <TextField
                          label="Short Window"
                          type="number"
                          value={strategyParameters.shortWindow || 5}
                          onChange={(e) => setStrategyParameters(prev => ({ ...prev, shortWindow: parseInt(e.target.value) }))}
                          size="small"
                          fullWidth
                          helperText="Short-term moving average periods"
                        />
                        <TextField
                          label="Long Window"
                          type="number"
                          value={strategyParameters.longWindow || 10}
                          onChange={(e) => setStrategyParameters(prev => ({ ...prev, longWindow: parseInt(e.target.value) }))}
                          size="small"
                          fullWidth
                          helperText="Long-term moving average periods"
                        />
                        <FormControl size="small" fullWidth>
                          <InputLabel>MA Type</InputLabel>
                          <Select
                            value={strategyParameters.maType || 'SMA'}
                            onChange={(e) => setStrategyParameters(prev => ({ ...prev, maType: e.target.value }))}
                            label="MA Type"
                          >
                            <MenuItem value="SMA">Simple Moving Average</MenuItem>
                            <MenuItem value="EMA">Exponential Moving Average</MenuItem>
                          </Select>
                        </FormControl>
                      </Stack>
                    </Box>
                  )}

                  {formData.strategy === 'movingAverageCrossover' && (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Moving Average Crossover Parameters
                      </Typography>
                      <Stack spacing={2}>
                        <TextField
                          label="Fast Window"
                          type="number"
                          value={strategyParameters.fastWindow || 10}
                          onChange={(e) => setStrategyParameters(prev => ({ ...prev, fastWindow: parseInt(e.target.value) }))}
                          size="small"
                          fullWidth
                          helperText="Fast moving average window in days"
                          inputProps={{ min: 5, max: 50 }}
                        />
                        <TextField
                          label="Slow Window"
                          type="number"
                          value={strategyParameters.slowWindow || 30}
                          onChange={(e) => setStrategyParameters(prev => ({ ...prev, slowWindow: parseInt(e.target.value) }))}
                          size="small"
                          fullWidth
                          helperText="Slow moving average window in days"
                          inputProps={{ min: 10, max: 200 }}
                        />
                        <FormControl size="small" fullWidth>
                          <InputLabel>Moving Average Type</InputLabel>
                          <Select
                            value={strategyParameters.maType || 'SMA'}
                            onChange={(e) => setStrategyParameters(prev => ({ ...prev, maType: e.target.value }))}
                            label="Moving Average Type"
                          >
                            <MenuItem value="SMA">Simple Moving Average (SMA)</MenuItem>
                            <MenuItem value="EMA">Exponential Moving Average (EMA)</MenuItem>
                          </Select>
                        </FormControl>
                      </Stack>
                    </Box>
                  )}

                  {formData.strategy === 'momentum' && (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Momentum Parameters
                      </Typography>
                      <Stack spacing={2}>
                        <TextField
                          label="RSI Window"
                          type="number"
                          value={formData.rsiWindow}
                          onChange={(e) => handleInputChange('rsiWindow', parseInt(e.target.value))}
                          size="small"
                          fullWidth
                          helperText="Periods for RSI calculation"
                        />
                        <TextField
                          label="Momentum Window"
                          type="number"
                          value={formData.momentumWindow}
                          onChange={(e) => handleInputChange('momentumWindow', parseInt(e.target.value))}
                          size="small"
                          fullWidth
                          helperText="Periods for momentum calculation"
                        />
                        <TextField
                          label="RSI Overbought"
                          type="number"
                          value={formData.rsiOverbought}
                          onChange={(e) => handleInputChange('rsiOverbought', parseInt(e.target.value))}
                          size="small"
                          fullWidth
                          helperText="RSI level considered overbought"
                        />
                        <TextField
                          label="RSI Oversold"
                          type="number"
                          value={formData.rsiOversold}
                          onChange={(e) => handleInputChange('rsiOversold', parseInt(e.target.value))}
                          size="small"
                          fullWidth
                          helperText="RSI level considered oversold"
                        />
                        <TextField
                          label="Momentum Threshold"
                          type="number"
                          inputProps={{ step: "0.01" }}
                          value={formData.momentumThreshold}
                          onChange={(e) => handleInputChange('momentumThreshold', parseFloat(e.target.value))}
                          size="small"
                          fullWidth
                          helperText="Minimum momentum change for signals"
                        />
                      </Stack>
                    </Box>
                  )}

                  {formData.strategy === 'bollingerBands' && (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Bollinger Bands Parameters
                      </Typography>
                      <Stack spacing={2}>
                        <TextField
                          label="Window"
                          type="number"
                          value={formData.window}
                          onChange={(e) => handleInputChange('window', parseInt(e.target.value))}
                          size="small"
                          fullWidth
                          helperText="Periods for moving average calculation"
                        />
                        <TextField
                          label="Multiplier"
                          type="number"
                          inputProps={{ step: "0.1" }}
                          value={formData.multiplier}
                          onChange={(e) => handleInputChange('multiplier', parseFloat(e.target.value))}
                          size="small"
                          fullWidth
                          helperText="Standard deviation multiplier for bands"
                        />
                      </Stack>
                    </Box>
                  )}

                  {formData.strategy === 'breakout' && (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Breakout Parameters
                      </Typography>
                      <Stack spacing={2}>
                        <TextField
                          label="Lookback Window"
                          type="number"
                          value={formData.lookbackWindow}
                          onChange={(e) => handleInputChange('lookbackWindow', parseInt(e.target.value))}
                          size="small"
                          fullWidth
                          helperText="Periods for support/resistance calculation"
                        />
                        <TextField
                          label="Breakout Threshold"
                          type="number"
                          inputProps={{ step: "0.01" }}
                          value={formData.breakoutThreshold}
                          onChange={(e) => handleInputChange('breakoutThreshold', parseFloat(e.target.value))}
                          size="small"
                          fullWidth
                          helperText="Minimum breakout percentage for signals"
                        />
                        <TextField
                          label="Min Volume Ratio"
                          type="number"
                          inputProps={{ step: "0.1" }}
                          value={formData.minVolumeRatio}
                          onChange={(e) => handleInputChange('minVolumeRatio', parseFloat(e.target.value))}
                          size="small"
                          fullWidth
                          helperText="Minimum volume increase for breakout confirmation"
                        />
                        <TextField
                          label="Confirmation Period"
                          type="number"
                          value={formData.confirmationPeriod}
                          onChange={(e) => handleInputChange('confirmationPeriod', parseInt(e.target.value))}
                          size="small"
                          fullWidth
                          helperText="Periods to wait for breakout confirmation"
                        />
                      </Stack>
                    </Box>
                  )}
                </Stack>

                {/* Backtest Controls */}
                <Box sx={{ mt: 4, pt: 3, borderTop: 1, borderColor: 'divider' }}>
                  <Typography variant="h6" gutterBottom>
                    Backtest Configuration
                  </Typography>
                  <Typography variant="body2" color="textSecondary" paragraph>
                    Configure the date range and trading parameters for your backtest.
                  </Typography>

                  <Stack spacing={3}>
                    {/* Date Range */}
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Date Range
                      </Typography>
                      <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }}>
                        <TextField
                          label="Start Date"
                          type="date"
                          value={formData.startDate}
                          onChange={(e) => handleInputChange('startDate', e.target.value)}
                          InputLabelProps={{ shrink: true }}
                          size="small"
                          fullWidth
                        />
                        <TextField
                          label="End Date"
                          type="date"
                          value={formData.endDate}
                          onChange={(e) => handleInputChange('endDate', e.target.value)}
                          InputLabelProps={{ shrink: true }}
                          size="small"
                          fullWidth
                        />
                      </Stack>
                    </Box>

                    {/* Trading Parameters */}
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Trading Parameters
                      </Typography>
                      <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }}>
                        <TextField
                          label="Initial Capital"
                          type="number"
                          value={formData.initialCapital}
                          onChange={(e) => handleInputChange('initialCapital', parseFloat(e.target.value))}
                          size="small"
                          fullWidth
                          helperText="Starting capital for backtest"
                        />
                        <TextField
                          label="Shares Per Trade"
                          type="number"
                          value={formData.sharesPerTrade}
                          onChange={(e) => handleInputChange('sharesPerTrade', parseInt(e.target.value))}
                          size="small"
                          fullWidth
                          helperText="Number of shares to trade per signal"
                        />
                      </Stack>
                    </Box>

                    {/* Run Backtest Button */}
                    <Box>
                      <Button
                        variant="contained"
                        startIcon={<PlayArrow />}
                        onClick={handleRunBacktest}
                        disabled={backtestLoading || formData.symbols.length === 0}
                        fullWidth
                        size="large"
                      >
                        {backtestLoading ? 'Running Backtest...' : 'Run Backtest'}
                      </Button>
                    </Box>

                    {/* Error Display */}
                    {error && (
                      <Alert severity="error" onClose={() => setError(null)}>
                        {error}
                      </Alert>
                    )}
                  </Stack>
                </Box>
              </Paper>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Paper sx={{ p: 2, height: 'fit-content' }}>
                <Typography variant="h6" gutterBottom>
                  Parameter Summary
                </Typography>
                <Typography variant="body2" color="textSecondary" paragraph>
                  Review your parameter settings before running the backtest.
                </Typography>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Current Settings:
                  </Typography>
                  {Object.entries(strategyParameters).map(([key, value]) => (
                    <Box key={key} display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2">{key}:</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {typeof value === 'object' ? JSON.stringify(value) : value}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Paper>
            </Box>
          </Box>
        </TabPanel>


        {/* Results Tab */}
        <TabPanel value={activeTab} index={3}>
          {backtestLoading && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Running Backtest...
              </Typography>
              <LinearProgress />
            </Paper>
          )}

          {results ? (
            <Paper sx={{ p: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6">
                  <Timeline sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Backtest Results
                </Typography>
                <Box display="flex" gap={1}>
                  <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={() => setSaveStrategyDialogOpen(true)}
                    color="primary"
                    size="small"
                  >
                    Save Strategy
                  </Button>
                  <Tooltip title="Refresh Results">
                    <IconButton onClick={() => window.location.reload()}>
                      <Refresh />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
              
              <Stack spacing={3}>
                {/* Backtest Configuration */}
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Backtest Configuration
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Stack spacing={2}>
                      <Box display="flex" flexWrap="wrap" gap={2}>
                        <Box>
                          <Typography variant="body2" color="textSecondary">
                            Strategy
                          </Typography>
                          <Typography variant="body1" fontWeight="medium">
                            {formData.strategy}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" color="textSecondary">
                            Date Range
                          </Typography>
                          <Typography variant="body1" fontWeight="medium">
                            {formData.startDate} to {formData.endDate}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" color="textSecondary">
                            Initial Capital
                          </Typography>
                          <Typography variant="body1" fontWeight="medium">
                            ${formData.initialCapital.toLocaleString()}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" color="textSecondary">
                            Symbols
                          </Typography>
                          <Typography variant="body1" fontWeight="medium">
                            {formData.symbols.join(', ')}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Strategy Parameters */}
                      <Box>
                        <Typography variant="body2" color="textSecondary" gutterBottom>
                          Strategy Parameters
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
                      </Box>
                    </Stack>
                  </Paper>
                </Box>

                {/* Summary Statistics */}
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Overall Performance
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
                    <Card variant="outlined" sx={{ flex: 1 }}>
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Typography color="textSecondary" gutterBottom>
                          Total Return
                        </Typography>
                        <Typography
                          variant="h6"
                          color={(results.data as any).totalReturn >= 0 ? 'success.main' : 'error.main'}
                        >
                          {formatPercentage((results.data as any).totalReturn)}
                        </Typography>
                      </CardContent>
                    </Card>
                    <Card variant="outlined" sx={{ flex: 1 }}>
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Typography color="textSecondary" gutterBottom>
                          Final Portfolio Value
                        </Typography>
                        <Typography variant="h6">
                          ${((results.data as any).finalPortfolioValue || 0).toLocaleString()}
                        </Typography>
                      </CardContent>
                    </Card>
                    <Card variant="outlined" sx={{ flex: 1 }}>
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Typography color="textSecondary" gutterBottom>
                          Win Rate
                        </Typography>
                        <Typography variant="h6">
                          {formatPercentage((results.data as any).winRate)}
                        </Typography>
                      </CardContent>
                    </Card>
                    <Card variant="outlined" sx={{ flex: 1 }}>
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Typography color="textSecondary" gutterBottom>
                          Total Trades
                        </Typography>
                        <Typography variant="h6">
                          {(results.data as any).totalTrades}
                        </Typography>
                      </CardContent>
                    </Card>
                    <Card variant="outlined" sx={{ flex: 1 }}>
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Typography color="textSecondary" gutterBottom>
                          Max Drawdown
                        </Typography>
                        <Typography variant="h6" color="error.main">
                          {formatPercentage((results.data as any).maxDrawdown)}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Box>
                </Box>

                {/* Results Table */}
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Results Per Symbol
                  </Typography>
                  <TableContainer component={Paper}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Symbol</TableCell>
                          <TableCell align="right">Total Return</TableCell>
                          <TableCell align="right">Final Value</TableCell>
                          <TableCell align="right">Win Rate</TableCell>
                          <TableCell align="right">Total Trades</TableCell>
                          <TableCell align="right">Max Drawdown</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {results.data.results.map((result: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Typography variant="subtitle2" fontWeight="bold">
                                {result.symbol}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography
                                variant="body2"
                                color={result.totalReturn >= 0 ? 'success.main' : 'error.main'}
                                fontWeight="bold"
                              >
                                {formatPercentage(result.totalReturn)}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              ${(result.finalPortfolioValue || 0).toLocaleString()}
                            </TableCell>
                            <TableCell align="right">
                              {formatPercentage(result.winRate)}
                            </TableCell>
                            <TableCell align="right">
                              {result.totalTrades}
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" color="error.main">
                                {formatPercentage(result.maxDrawdown)}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              </Stack>
            </Paper>
          ) : !backtestLoading && (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary">
                Configure your backtest and click "Run Backtest" to see results
              </Typography>
            </Paper>
          )}
        </TabPanel>

      </Paper>

      {/* Save Strategy Dialog */}
      <SaveStrategyDialog
        open={saveStrategyDialogOpen}
        onClose={() => setSaveStrategyDialogOpen(false)}
        onSave={handleSaveStrategy}
        formData={formData}
        results={results}
        isLoading={isSavingStrategy}
      />
    </Box>
  );
};

export default BacktestingSimple;
