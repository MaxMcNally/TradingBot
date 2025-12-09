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
  Divider,
  Stack,
  LinearProgress,
  Tabs,
  Tab,
  Grid,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
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
  AccountBalance,
  DataUsage,
  Refresh,
  Info,
} from "@mui/icons-material";
import { 
  BacktestFormData, 
  BacktestResponse, 
  Strategy
} from "./Backtesting.types";
import { StockPicker, StrategySelector } from "../../components/shared";
import { useStrategies, useBacktest } from "../../hooks";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`backtest-tabpanel-${index}`}
      aria-labelledby={`backtest-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const BacktestingNew: React.FC = () => {
  // Tab state
  const [activeTab, setActiveTab] = useState(0);
  
  // State management
  const [formData, setFormData] = useState<BacktestFormData>({
    strategy: "meanReversion",
    symbols: [],
    startDate: "2023-01-01",
    endDate: "2023-12-31",
    // Common parameters
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
    confirmationPeriod: 2
  });

  const [results, setResults] = useState<BacktestResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Strategy parameters for the reusable StrategySelector
  const [strategyParameters, setStrategyParameters] = useState<Record<string, any>>({
    shortWindow: 5,
    longWindow: 10,
  });

  // Use hooks for strategies and backtesting
  const { strategies: availableStrategies, isLoading: strategiesLoading, isError: strategiesError } = useStrategies();
  const { runBacktest: runBacktestMutation, isLoading: backtestLoading, isError: backtestError, data: backtestData } = useBacktest();

  const handleInputChange = (field: keyof BacktestFormData, value: string | number): void => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
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
        parameters: {
          ...strategyParameters,
          // Include strategy-specific parameters
          window: formData.window,
          threshold: formData.threshold,
          fastWindow: formData.fastWindow,
          slowWindow: formData.slowWindow,
          maType: formData.maType,
          rsiWindow: formData.rsiWindow,
          rsiOverbought: formData.rsiOverbought,
          rsiOversold: formData.rsiOversold,
          momentumWindow: formData.momentumWindow,
          momentumThreshold: formData.momentumThreshold,
          multiplier: formData.multiplier,
          lookbackWindow: formData.lookbackWindow,
          breakoutThreshold: formData.breakoutThreshold,
          minVolumeRatio: formData.minVolumeRatio,
          confirmationPeriod: formData.confirmationPeriod,
        }
      });

      if (response) {
        setResults(response);
        setActiveTab(3); // Switch to results tab
      }
    } catch (err: any) {
      setError(err.message || "Failed to run backtest");
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPercentage = (value: number): string => {
    return `${(value * 100).toFixed(2)}%`;
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
              label="Select a Bot"
              id="backtest-tab-0"
              aria-controls="backtest-tabpanel-0"
            />
            <Tab
              icon={<Settings />}
              label="Parameters"
              id="backtest-tab-1"
              aria-controls="backtest-tabpanel-1"
            />
            <Tab
              icon={<DataUsage />}
              label="Data & Settings"
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

        {/* Strategy Selection Tab */}
        <TabPanel value={activeTab} index={0}>
          <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', lg: 'row' } }}>
            <Box sx={{ flex: 2 }}>
              <StrategySelector
                selectedStrategy={formData.strategy}
                onStrategyChange={(strategy) => handleInputChange('strategy', strategy)}
                strategyParameters={strategyParameters}
                onParametersChange={setStrategyParameters}
                title="Select Strategy for Backtesting"
                description="Choose a trading strategy to test against historical data."
                compact={false}
                showTips={true}
                availableStrategies={availableStrategies.map(s => ({
                  name: s.name,
                  description: s.description || '',
                  parameters: s.parameters || {},
                  enabled: true,
                  symbols: []
                }))}
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Paper sx={{ p: 2, height: 'fit-content' }}>
                <Typography variant="h6" gutterBottom>
                  Strategy Summary
                </Typography>
                <Typography variant="body2" color="textSecondary" paragraph>
                  Selected strategy: <strong>{formData.strategy}</strong>
                </Typography>
                <Typography variant="body2" color="textSecondary" paragraph>
                  {availableStrategies.find(s => s.name === formData.strategy)?.description || 'No description available'}
                </Typography>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Current Parameters:
                  </Typography>
                  {Object.entries(strategyParameters).map(([key, value]) => (
                    <Box key={key} display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2">{key}:</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {value}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Paper>
            </Box>
          </Box>
        </TabPanel>

        {/* Parameters Tab */}
        <TabPanel value={activeTab} index={1}>
          <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', lg: 'row' } }}>
            <Box sx={{ flex: 2 }}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  <Settings sx={{ mr: 1, verticalAlign: 'middle' }} />
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
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Window"
                            type="number"
                            value={formData.window}
                            onChange={(e) => handleInputChange('window', parseInt(e.target.value))}
                            size="small"
                            fullWidth
                            helperText="Number of periods for mean calculation"
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Threshold"
                            type="number"
                            step="0.01"
                            value={formData.threshold}
                            onChange={(e) => handleInputChange('threshold', parseFloat(e.target.value))}
                            size="small"
                            fullWidth
                            helperText="Number of standard deviations for signal generation"
                          />
                        </Grid>
                      </Grid>
                    </Box>
                  )}

                  {formData.strategy === 'movingAverage' && (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Moving Average Parameters
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={4}>
                          <TextField
                            label="Fast Window"
                            type="number"
                            value={formData.fastWindow}
                            onChange={(e) => handleInputChange('fastWindow', parseInt(e.target.value))}
                            size="small"
                            fullWidth
                            helperText="Short-term moving average periods"
                          />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <TextField
                            label="Slow Window"
                            type="number"
                            value={formData.slowWindow}
                            onChange={(e) => handleInputChange('slowWindow', parseInt(e.target.value))}
                            size="small"
                            fullWidth
                            helperText="Long-term moving average periods"
                          />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <FormControl size="small" fullWidth>
                            <InputLabel>MA Type</InputLabel>
                            <Select
                              value={formData.maType}
                              onChange={(e) => handleInputChange('maType', e.target.value)}
                              label="MA Type"
                            >
                              <MenuItem value="SMA">Simple Moving Average</MenuItem>
                              <MenuItem value="EMA">Exponential Moving Average</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                      </Grid>
                    </Box>
                  )}

                  {formData.strategy === 'momentum' && (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Momentum Parameters
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="RSI Window"
                            type="number"
                            value={formData.rsiWindow}
                            onChange={(e) => handleInputChange('rsiWindow', parseInt(e.target.value))}
                            size="small"
                            fullWidth
                            helperText="Periods for RSI calculation"
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Momentum Window"
                            type="number"
                            value={formData.momentumWindow}
                            onChange={(e) => handleInputChange('momentumWindow', parseInt(e.target.value))}
                            size="small"
                            fullWidth
                            helperText="Periods for momentum calculation"
                          />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <TextField
                            label="RSI Overbought"
                            type="number"
                            value={formData.rsiOverbought}
                            onChange={(e) => handleInputChange('rsiOverbought', parseInt(e.target.value))}
                            size="small"
                            fullWidth
                            helperText="RSI level considered overbought"
                          />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <TextField
                            label="RSI Oversold"
                            type="number"
                            value={formData.rsiOversold}
                            onChange={(e) => handleInputChange('rsiOversold', parseInt(e.target.value))}
                            size="small"
                            fullWidth
                            helperText="RSI level considered oversold"
                          />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <TextField
                            label="Momentum Threshold"
                            type="number"
                            step="0.01"
                            value={formData.momentumThreshold}
                            onChange={(e) => handleInputChange('momentumThreshold', parseFloat(e.target.value))}
                            size="small"
                            fullWidth
                            helperText="Minimum momentum change for signals"
                          />
                        </Grid>
                      </Grid>
                    </Box>
                  )}

                  {formData.strategy === 'bollingerBands' && (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Bollinger Bands Parameters
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Window"
                            type="number"
                            value={formData.window}
                            onChange={(e) => handleInputChange('window', parseInt(e.target.value))}
                            size="small"
                            fullWidth
                            helperText="Periods for moving average calculation"
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Multiplier"
                            type="number"
                            step="0.1"
                            value={formData.multiplier}
                            onChange={(e) => handleInputChange('multiplier', parseFloat(e.target.value))}
                            size="small"
                            fullWidth
                            helperText="Standard deviation multiplier for bands"
                          />
                        </Grid>
                      </Grid>
                    </Box>
                  )}

                  {formData.strategy === 'breakout' && (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Breakout Parameters
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Lookback Window"
                            type="number"
                            value={formData.lookbackWindow}
                            onChange={(e) => handleInputChange('lookbackWindow', parseInt(e.target.value))}
                            size="small"
                            fullWidth
                            helperText="Periods for support/resistance calculation"
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Breakout Threshold"
                            type="number"
                            step="0.01"
                            value={formData.breakoutThreshold}
                            onChange={(e) => handleInputChange('breakoutThreshold', parseFloat(e.target.value))}
                            size="small"
                            fullWidth
                            helperText="Minimum breakout percentage for signals"
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Min Volume Ratio"
                            type="number"
                            step="0.1"
                            value={formData.minVolumeRatio}
                            onChange={(e) => handleInputChange('minVolumeRatio', parseFloat(e.target.value))}
                            size="small"
                            fullWidth
                            helperText="Minimum volume increase for breakout confirmation"
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Confirmation Period"
                            type="number"
                            value={formData.confirmationPeriod}
                            onChange={(e) => handleInputChange('confirmationPeriod', parseInt(e.target.value))}
                            size="small"
                            fullWidth
                            helperText="Periods to wait for breakout confirmation"
                          />
                        </Grid>
                      </Grid>
                    </Box>
                  )}
                </Stack>
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
                        {value}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Paper>
            </Box>
          </Box>
        </TabPanel>

        {/* Data & Settings Tab */}
        <TabPanel value={activeTab} index={2}>
          <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', lg: 'row' } }}>
            <Box sx={{ flex: 2 }}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  <DataUsage sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Data & Settings Configuration
                </Typography>
                <Typography variant="body2" color="textSecondary" paragraph>
                  Configure the symbols, date range, and other settings for your backtest.
                </Typography>

                <Stack spacing={3}>
                  {/* Symbol Selection */}
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Symbol Selection
                    </Typography>
                    <StockPicker
                      selectedStocks={formData.symbols}
                      onStocksChange={(symbols) => handleInputChange('symbols', symbols)}
                      maxStocks={10}
                    />
                  </Box>

                  {/* Date Range */}
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Date Range
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Start Date"
                          type="date"
                          value={formData.startDate}
                          onChange={(e) => handleInputChange('startDate', e.target.value)}
                          InputLabelProps={{ shrink: true }}
                          size="small"
                          fullWidth
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="End Date"
                          type="date"
                          value={formData.endDate}
                          onChange={(e) => handleInputChange('endDate', e.target.value)}
                          InputLabelProps={{ shrink: true }}
                          size="small"
                          fullWidth
                        />
                      </Grid>
                    </Grid>
                  </Box>

                  {/* Common Parameters */}
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Trading Parameters
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Initial Capital"
                          type="number"
                          value={formData.initialCapital}
                          onChange={(e) => handleInputChange('initialCapital', parseFloat(e.target.value))}
                          size="small"
                          fullWidth
                          helperText="Starting capital for backtest"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Shares Per Trade"
                          type="number"
                          value={formData.sharesPerTrade}
                          onChange={(e) => handleInputChange('sharesPerTrade', parseInt(e.target.value))}
                          size="small"
                          fullWidth
                          helperText="Number of shares to trade per signal"
                        />
                      </Grid>
                    </Grid>
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
              </Paper>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Paper sx={{ p: 2, height: 'fit-content' }}>
                <Typography variant="h6" gutterBottom>
                  Configuration Summary
                </Typography>
                <Typography variant="body2" color="textSecondary" paragraph>
                  Review your backtest configuration before running.
                </Typography>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Selected Symbols:
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                    {formData.symbols.map((symbol) => (
                      <Chip key={symbol} label={symbol} size="small" />
                    ))}
                  </Box>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">Start Date:</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {formData.startDate}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">End Date:</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {formData.endDate}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">Initial Capital:</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {formatCurrency(formData.initialCapital)}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">Shares Per Trade:</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {formData.sharesPerTrade}
                    </Typography>
                  </Box>
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
                <Tooltip title="Refresh Results">
                  <IconButton onClick={() => window.location.reload()}>
                    <Refresh />
                  </IconButton>
                </Tooltip>
              </Box>
              
              <Stack spacing={3}>
                {/* Summary Stats */}
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Summary Statistics
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6} sm={3}>
                      <Card variant="outlined">
                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                          <Typography color="textSecondary" gutterBottom>
                            Total Return
                          </Typography>
                          <Typography variant="h6" color={results.totalReturn >= 0 ? 'success.main' : 'error.main'}>
                            {formatPercentage(results.totalReturn)}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Card variant="outlined">
                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                          <Typography color="textSecondary" gutterBottom>
                            Win Rate
                          </Typography>
                          <Typography variant="h6">
                            {formatPercentage(results.winRate)}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Card variant="outlined">
                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                          <Typography color="textSecondary" gutterBottom>
                            Total Trades
                          </Typography>
                          <Typography variant="h6">
                            {results.totalTrades}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Card variant="outlined">
                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                          <Typography color="textSecondary" gutterBottom>
                            Max Drawdown
                          </Typography>
                          <Typography variant="h6" color="error.main">
                            {formatPercentage(results.maxDrawdown)}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </Box>

                {/* Results Table */}
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Symbol Results
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Symbol</TableCell>
                          <TableCell align="right">Total Return</TableCell>
                          <TableCell align="right">Win Rate</TableCell>
                          <TableCell align="right">Total Trades</TableCell>
                          <TableCell align="right">Max Drawdown</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {results.results.map((result) => (
                          <TableRow key={result.symbol}>
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
          ) : (
            <Alert severity="info">
              <Typography variant="subtitle2" gutterBottom>
                No backtest results available
              </Typography>
              <Typography variant="body2">
                Configure your strategy and run a backtest to see results here.
              </Typography>
            </Alert>
          )}
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default BacktestingNew;
