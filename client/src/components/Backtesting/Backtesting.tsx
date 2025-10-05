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
} from "@mui/material";
import {
  PlayArrow,
  Assessment,
  Timeline
} from "@mui/icons-material";
import { 
  BacktestFormData, 
  BacktestResponse, 
  Strategy
} from "./Backtesting.types";
import { StockPicker, StrategySelector } from "../shared";
import { useStrategies, useBacktest } from "../../hooks";

const Backtesting: React.FC = () => {
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
    console.log("Input changed");
    console.log(field);
    console.log(value);

    setFormData(prev => {
      const newFormData = {
        ...prev,
        [field]: value
      };

      // If strategy is changing, reset all strategy-specific parameters to defaults
      if (field === 'strategy') {
        const strategyDefaults: Partial<BacktestFormData> = {
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
        };

        return {
          ...newFormData,
          ...strategyDefaults
        };
      }

      return newFormData;
    });
  };


  const handleRunBacktest = async (): Promise<void> => {
    if (formData.symbols.length === 0) {
      setError("Please select at least one symbol");
      return;
    }

    setError(null);
    setResults(null);

    try {
      // Merge strategy parameters from the reusable component with form data
      const backtestData = {
        ...formData,
        ...strategyParameters,
        symbols: formData.symbols.length === 1 ? formData.symbols[0] : formData.symbols
      };
      
      const response = await runBacktestMutation(backtestData);
      setResults(response);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "Failed to run backtest");
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
    return <CircularProgress />;
  }

  if (strategiesError) {
    return (
      <Box p={3}>
        <Alert severity="error">Failed to load strategies</Alert>
      </Box>
    );
  }
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        <Assessment sx={{ mr: 1, verticalAlign: 'middle' }} />
        Strategy Backtesting
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Test your trading strategies against historical data to evaluate performance.
      </Typography>

      <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
        {/* Configuration Panel */}
        <Box sx={{ flex: { xs: 1, md: '0 0 33.333%' } }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Backtest Configuration
            </Typography>

            <Stack spacing={3}>
              {/* Strategy Selection */}
              <StrategySelector
                selectedStrategy={formData.strategy}
                onStrategyChange={(strategy) => handleInputChange('strategy', strategy)}
                strategyParameters={strategyParameters}
                onParametersChange={setStrategyParameters}
                title="Select Strategy for Backtesting"
                description="Choose a trading strategy to test against historical data."
                compact={true}
                showTips={false}
                availableStrategies={availableStrategies.map(s => ({
                  name: s.name,
                  description: s.description || '',
                  parameters: s.parameters || {},
                  enabled: true,
                  symbols: []
                }))}
              />

              {/* Symbol Selection */}
              <StockPicker
                selectedStocks={formData.symbols}
                onStocksChange={(stocks) => setFormData(prev => ({ ...prev, symbols: stocks }))}
                maxStocks={10}
                title="Select Symbols for Backtesting"
                description="Choose stocks to test your strategy against. You can search for specific symbols or select from popular options."
                compact={true}
                showTips={false}
              />

              {/* Date Range */}
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  label="Start Date"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  fullWidth
                  label="End Date"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Box>


              {/* Common Parameters */}
              <Divider sx={{ mt: 2, mb: 2 }} />
              <Typography variant="subtitle2">Common Parameters</Typography>
              
              <TextField
                fullWidth
                label="Initial Capital ($)"
                type="number"
                value={formData.initialCapital}
                onChange={(e) => handleInputChange('initialCapital', parseInt(e.target.value))}
                inputProps={{ min: 1000 }}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Shares Per Trade"
                type="number"
                value={formData.sharesPerTrade}
                onChange={(e) => handleInputChange('sharesPerTrade', parseInt(e.target.value))}
                inputProps={{ min: 1 }}
              />

              {/* Run Button */}
              <Button
                variant="contained"
                size="large"
                onClick={handleRunBacktest}
                disabled={backtestLoading || formData.symbols.length === 0}
                startIcon={backtestLoading ? <CircularProgress size={20} /> : <PlayArrow />}
                fullWidth
              >
                {backtestLoading ? 'Running Backtest...' : 'Run Backtest'}
              </Button>
            </Stack>
          </Paper>
        </Box>

        {/* Results Panel */}
        <Box sx={{ flex: { xs: 1, md: '0 0 66.666%' } }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {backtestLoading && (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <CircularProgress sx={{ mb: 2 }} />
              <Typography>Running backtest...</Typography>
              <LinearProgress sx={{ mt: 2 }} />
            </Paper>
          )}

          {results && (
            <Box>
              <Typography variant="h6" gutterBottom>
                <Timeline sx={{ mr: 1, verticalAlign: 'middle' }} />
                Backtest Results
              </Typography>

              {/* Summary Cards */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
                {results.data.results.map((result, index) => (
                  <Box key={index} sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '1 1 calc(33.333% - 11px)' } }}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" color="primary">
                          {result.symbol}
                        </Typography>
                        <Typography variant="h4" color={result.totalReturn >= 0 ? 'success.main' : 'error.main'}>
                          {formatPercentage(result.totalReturn)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Total Return
                        </Typography>
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2">
                            Final Value: {formatCurrency(result.finalPortfolioValue)}
                          </Typography>
                          <Typography variant="body2">
                            Win Rate: {formatPercentage(result.winRate)}
                          </Typography>
                          <Typography variant="body2">
                            Max Drawdown: {formatPercentage(result.maxDrawdown)}
                          </Typography>
                          <Typography variant="body2">
                            Total Trades: {result.totalTrades}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Box>
                ))}
              </Box>

              {/* Detailed Results Table */}
              <Paper>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Symbol</TableCell>
                        <TableCell align="right">Total Return</TableCell>
                        <TableCell align="right">Final Value</TableCell>
                        <TableCell align="right">Win Rate</TableCell>
                        <TableCell align="right">Max Drawdown</TableCell>
                        <TableCell align="right">Total Trades</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {results.data.results.map((result, index) => (
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
                            {formatCurrency(result.finalPortfolioValue)}
                          </TableCell>
                          <TableCell align="right">
                            {formatPercentage(result.winRate)}
                          </TableCell>
                          <TableCell align="right">
                            <Typography color="error">
                              {formatPercentage(result.maxDrawdown)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            {result.totalTrades}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Box>
          )}

          {!results && !backtestLoading && !error && (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary">
                Configure your backtest and click "Run Backtest" to see results
              </Typography>
            </Paper>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default Backtesting;
