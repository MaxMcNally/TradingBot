import React, { useState, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import {
  Box,
  Typography,
  Paper,
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
  Chip,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
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
  StrategySelectionSection,
  SessionSummary,
  StrategyParameters
} from "../../components/shared";
import { useStrategies, useBacktest, useUserStrategies } from "../../hooks";
import SaveStrategyDialog from "./SaveStrategyDialog";

// Utility functions
const formatPercentage = (value: number | undefined | null): string => {
  if (value === undefined || value === null || isNaN(value)) {
    return "0.00%";
  }
  return `${(value * 100).toFixed(2)}%`;
};



const BacktestingPage: React.FC = () => {
  // Tab state
  const [activeTab, setActiveTab] = useState(0);
  
  // Form management with react-hook-form
  const methods = useForm<BacktestFormData>({
    defaultValues: {
      strategy: "meanReversion",
      symbols: [],
      startDate: "2023-01-01",
      endDate: "2023-12-31",
      initialCapital: 10000,
      sharesPerTrade: 100,
      // Sentiment Analysis parameters (defaults)
      lookbackDays: 3,
      pollIntervalMinutes: 0,
      minArticles: 2,
      buyThreshold: 0.4,
      sellThreshold: -0.4,
      titleWeight: 2.0,
      recencyHalfLifeHours: 12,
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
    }
  });
  const { watch, setValue, getValues } = methods;
  const watchedFields = watch([
    'strategy',
    'symbols',
    'startDate',
    'endDate',
    'initialCapital',
    'sharesPerTrade',
  ]);
  
  const formData = {
    strategy: watchedFields[0],
    symbols: watchedFields[1],
    startDate: watchedFields[2],
    endDate: watchedFields[3],
    initialCapital: watchedFields[4],
    sharesPerTrade: watchedFields[5],
  };
  

  const [results, setResults] = useState<BacktestResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Local state for selected stocks (similar to Trading component)
  const [selectedStocks, setSelectedStocks] = useState<string[]>([]);
  
  // Strategy parameters for the reusable StrategySelector
  const [strategyParameters, setStrategyParameters] = useState<Record<string, any>>({});
  
  // Sync local state with form data on mount
  useEffect(() => {
    const formSymbols = getValues('symbols');
    if (formSymbols && Array.isArray(formSymbols)) {
      setSelectedStocks(formSymbols);
    }
  }, [getValues]);
  
  // Save strategy dialog state
  const [saveStrategyDialogOpen, setSaveStrategyDialogOpen] = useState(false);

  // Use hooks for strategies and backtesting
  const { strategies: availableStrategies, isLoading: strategiesLoading, isError: strategiesError } = useStrategies();
  const { runBacktest: runBacktestMutation, isLoading: backtestLoading } = useBacktest();
  const { saveFromBacktest, isCreating: isSavingStrategy } = useUserStrategies();

  // Reset strategy parameters when strategy changes
  useEffect(() => {
    if (availableStrategies && formData.strategy) {
      const strategy = availableStrategies.find(s => s.name === formData.strategy);
      if (strategy && strategy.parameters) {
      const defaultParams: Record<string, any> = {};
        Object.entries(strategy.parameters).forEach(([key, param]) => {
          if (typeof param === 'object' && param !== null && 'default' in param) {
            defaultParams[key] = param.default;
          }
        });
        setStrategyParameters(defaultParams);
      }
    }
  }, [formData.strategy, availableStrategies]);


  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
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
    <FormProvider {...methods}>
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
      <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', lg: 'row' } }}>
        {/* Main Content Area */}
        <Box sx={{ flex: 2 }}>
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
                selectedStocks={selectedStocks}
                onStocksChange={(symbols) => {
                  setSelectedStocks(symbols);
                  setValue('symbols', symbols);
                }}
                maxStocks={10}
                title="Stock Selection"
                description="Select the stocks you want to include in your backtest. You can choose up to {maxStocks} stocks."
                showSummary={false}
              />
            </TabPanel>

            {/* Strategy Selection Tab */}
            <TabPanel value={activeTab} index={1}>
              <StrategySelectionSection
                selectedStrategy={formData.strategy}
                onStrategyChange={(strategy) => setValue('strategy', strategy)}
                onParametersChange={setStrategyParameters}
                strategyParameters={strategyParameters}
                title="Select Strategy for Backtesting"
                description="Choose a trading strategy to test against historical data. You can select from basic strategies or public strategies shared by other users."
                showSummary={false}
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
              <StrategyParameters
                selectedStrategy={formData.strategy}
                strategyParameters={strategyParameters}
                onParametersChange={setStrategyParameters}
                showSaveButton={false}
                showResetButton={false}
                compact={false}
                showCurrentValues={false}
                title="Strategy Parameters"
                description="Configure the parameters for your selected strategy. These settings will determine how the strategy behaves during backtesting."
              />
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
                            {(formData.symbols || []).join(', ')}
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
        </Box>

        {/* Persistent Sidebar */}
        <Box sx={{ flex: 1, minWidth: 300 }}>
          <SessionSummary
            title="Backtest Configuration"
            selectedStocks={selectedStocks}
            selectedStrategy={formData.strategy}
            strategyParameters={strategyParameters}
            mode="backtesting"
            maxStocks={10}
          />
        </Box>
      </Box>

      {/* Save Strategy Dialog */}
      <SaveStrategyDialog
        open={saveStrategyDialogOpen}
        onClose={() => setSaveStrategyDialogOpen(false)}
        onSave={handleSaveStrategy}
        formData={getValues()}
        results={results}
        isLoading={isSavingStrategy}
      />
    </Box>
    </FormProvider>
  );
};

export default BacktestingPage;
