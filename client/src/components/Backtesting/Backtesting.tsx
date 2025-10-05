import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
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
  Autocomplete,
  Divider,
  Stack,
  LinearProgress,
  SelectChangeEvent
} from "@mui/material";
import {
  PlayArrow,
  Assessment,
  Timeline
} from "@mui/icons-material";
import { runBacktest, getStrategies, searchSymbols, searchWithYahoo, getPopularSymbols } from "../../api";
import { 
  BacktestFormData, 
  BacktestResponse, 
  Strategy, 
  SymbolOption, 
  SearchSource 
} from "./Backtesting.types";
import StrategyParamsSelector from "./strategyComponents/StrategyParamsSelector";

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

  const [availableStrategies, setAvailableStrategies] = useState<Strategy[]>([]);
  const [symbolOptions, setSymbolOptions] = useState<SymbolOption[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [results, setResults] = useState<BacktestResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [symbolSearchQuery, setSymbolSearchQuery] = useState<string>("");
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchSource, setSearchSource] = useState<SearchSource>("yahoo-finance");
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  // Load available strategies on component mount
  useEffect(() => {
    loadStrategies();
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  const loadStrategies = async (): Promise<void> => {
    try {
      const response = await getStrategies();
      setAvailableStrategies(response.data.data.strategies);
    } catch (err) {
      console.error("Failed to load strategies:", err);
    }
  };

  const handleSymbolSearch = async (query: string): Promise<void> => {
    if (query.length < 1) {
      // Load popular symbols when query is empty
      try {
        const response = await getPopularSymbols();
        setSymbolOptions(response.data.data.symbols);
        setSearchSource("static");
        setSearchError(null);
      } catch (err) {
        console.error("Failed to load popular symbols:", err);
        setSearchError("Failed to load popular symbols");
      }
      return;
    }
    
    setIsSearching(true);
    setSearchError(null);
    
    try {
      let response;
      if (searchSource === "yahoo-finance") {
        // Try Yahoo Finance search first
        try {
          response = await searchWithYahoo(query);
          setSearchSource("yahoo-finance");
        } catch (yahooError) {
          console.warn("Yahoo Finance search failed, falling back to static search:", yahooError);
          // Fallback to static search
          response = await searchSymbols(query, false);
          setSearchSource("static");
        }
      } else {
        // Use static search
        response = await searchSymbols(query, false);
        setSearchSource("static");
      }
      
      setSymbolOptions(response.data.data.symbols);
    } catch (err) {
      console.error("Failed to search symbols:", err);
      setSearchError("Failed to search symbols. Please try again.");
      setSymbolOptions([]);
    } finally {
      setIsSearching(false);
    }
  };

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

  const handleAddSymbol = (symbol: string): void => {
    if (symbol && !formData.symbols.includes(symbol)) {
      setFormData(prev => ({
        ...prev,
        symbols: [...prev.symbols, symbol]
      }));
      setSymbolSearchQuery("");
    }
  };

  const handleRemoveSymbol = (symbolToRemove: string): void => {
    setFormData(prev => ({
      ...prev,
      symbols: prev.symbols.filter(symbol => symbol !== symbolToRemove)
    }));
  };

  const handleRunBacktest = async (): Promise<void> => {
    if (formData.symbols.length === 0) {
      setError("Please select at least one symbol");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await runBacktest({
        ...formData,
        symbols: formData.symbols.length === 1 ? formData.symbols[0] : formData.symbols
      });
      
      setResults(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to run backtest");
    } finally {
      setIsLoading(false);
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
  
  if(availableStrategies.length === 0) {
    return <CircularProgress />;
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
              <FormControl fullWidth>
                <InputLabel>Strategy</InputLabel>
                <Select
                  value={formData.strategy}
                  label="Strategy"
                  onChange={(e: SelectChangeEvent) => handleInputChange('strategy', e.target.value)}
                >
                  {availableStrategies.map((strategy) => (
                    <MenuItem key={strategy.name} value={strategy.name}>
                      {strategy.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Symbol Selection */}
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle2">
                    Symbols
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                      label={searchSource === "yahoo-finance" ? "Live Data" : "Static"}
                      size="small"
                      color={searchSource === "yahoo-finance" ? "success" : "default"}
                      variant="outlined"
                    />
                    {isSearching && <CircularProgress size={16} />}
                  </Box>
                </Box>
                
                {searchError && (
                  <Alert severity="warning" sx={{ mb: 1 }}>
                    {searchError}
                  </Alert>
                )}
                
                <Autocomplete<SymbolOption, false, false, true>
                  freeSolo
                  options={symbolOptions}
                  getOptionLabel={(option) => typeof option === 'string' ? option : option.symbol}
                  value={symbolSearchQuery}
                  loading={isSearching}
                  onInputChange={(_, newValue) => {
                    setSymbolSearchQuery(newValue || "");
                    // Debounce search to avoid too many API calls
                    if (searchTimeout) {
                      clearTimeout(searchTimeout);
                    }
                    const timeoutId = setTimeout(() => {
                      handleSymbolSearch(newValue || "");
                    }, 300);
                    setSearchTimeout(timeoutId);
                  }}
                  onChange={(_, newValue) => {
                    if (newValue && typeof newValue === 'object') {
                      handleAddSymbol(newValue.symbol);
                    }
                  }}
                  renderOption={(props, option) => (
                    <li {...props}>
                      <Box sx={{ width: '100%' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2" fontWeight="bold">
                            {option.symbol}
                          </Typography>
                          {option.type && (
                            <Chip
                              label={option.type}
                              size="small"
                              variant="outlined"
                              sx={{ ml: 1 }}
                            />
                          )}
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {option.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          {option.exchange} {option.market && `• ${option.market}`}
                        </Typography>
                      </Box>
                    </li>
                  )}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Search symbols (e.g., AAPL, Tesla, Microsoft)"
                      size="small"
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {isSearching ? <CircularProgress color="inherit" size={20} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />
                
                <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {formData.symbols.map((symbol) => (
                    <Chip
                      key={symbol}
                      label={symbol}
                      onDelete={() => handleRemoveSymbol(symbol)}
                      color="primary"
                      size="small"
                    />
                  ))}
                </Box>
                
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  {searchSource === "yahoo-finance" 
                    ? "🔴 Live search powered by Yahoo Finance" 
                    : "📊 Using static symbol database"
                  }
                </Typography>
              </Box>

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

              {/* Strategy Parameters */}
              <StrategyParamsSelector 
                strategy={formData.strategy}
                formData={formData}
                onInputChange={handleInputChange}
              />

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
                disabled={isLoading || formData.symbols.length === 0}
                startIcon={isLoading ? <CircularProgress size={20} /> : <PlayArrow />}
                fullWidth
              >
                {isLoading ? 'Running Backtest...' : 'Run Backtest'}
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

          {isLoading && (
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

          {!results && !isLoading && !error && (
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
