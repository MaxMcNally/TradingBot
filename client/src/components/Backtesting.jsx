import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Card,
  CardContent,
  CardActions,
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
  LinearProgress
} from "@mui/material";
import {
  PlayArrow,
  Refresh,
  TrendingUp,
  TrendingDown,
  Assessment,
  Timeline
} from "@mui/icons-material";
import { runBacktest, getStrategies, searchSymbols, searchWithYahoo, getPopularSymbols } from "../api";

const Backtesting = () => {
  // State management
  const [formData, setFormData] = useState({
    strategy: "meanReversion",
    symbols: [],
    startDate: "2023-01-01",
    endDate: "2023-12-31",
    window: 20,
    threshold: 0.05,
    initialCapital: 10000,
    sharesPerTrade: 100
  });

  const [availableStrategies, setAvailableStrategies] = useState([]);
  const [symbolOptions, setSymbolOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [symbolSearchQuery, setSymbolSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchSource, setSearchSource] = useState("yahoo-finance");
  const [searchError, setSearchError] = useState(null);
  const [searchTimeout, setSearchTimeout] = useState(null);

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

  const loadStrategies = async () => {
    try {
      const response = await getStrategies();
      setAvailableStrategies(response.data.data.strategies);
    } catch (err) {
      console.error("Failed to load strategies:", err);
    }
  };

  const handleSymbolSearch = async (query) => {
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

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddSymbol = (symbol) => {
    if (symbol && !formData.symbols.includes(symbol)) {
      setFormData(prev => ({
        ...prev,
        symbols: [...prev.symbols, symbol]
      }));
      setSymbolSearchQuery("");
    }
  };

  const handleRemoveSymbol = (symbolToRemove) => {
    setFormData(prev => ({
      ...prev,
      symbols: prev.symbols.filter(symbol => symbol !== symbolToRemove)
    }));
  };

  const handleRunBacktest = async () => {
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
    } catch (err) {
      setError(err.response?.data?.error || "Failed to run backtest");
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPercentage = (value) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        <Assessment sx={{ mr: 1, verticalAlign: 'middle' }} />
        Strategy Backtesting
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Test your trading strategies against historical data to evaluate performance.
      </Typography>

      <Grid container spacing={3}>
        {/* Configuration Panel */}
        <Grid item xs={12} md={4}>
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
                  onChange={(e) => handleInputChange('strategy', e.target.value)}
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
                
                <Autocomplete
                  freeSolo
                  options={symbolOptions}
                  getOptionLabel={(option) => option.symbol || option}
                  value={symbolSearchQuery}
                  loading={isSearching}
                  onInputChange={(event, newValue) => {
                    setSymbolSearchQuery(newValue);
                    // Debounce search to avoid too many API calls
                    if (searchTimeout) {
                      clearTimeout(searchTimeout);
                    }
                    const timeoutId = setTimeout(() => {
                      handleSymbolSearch(newValue);
                    }, 300);
                    setSearchTimeout(timeoutId);
                  }}
                  onChange={(event, newValue) => {
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
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Start Date"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="End Date"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => handleInputChange('endDate', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>

              {/* Strategy Parameters */}
              <Divider />
              <Typography variant="subtitle2">Strategy Parameters</Typography>
              
              <TextField
                fullWidth
                label="Moving Average Window (days)"
                type="number"
                value={formData.window}
                onChange={(e) => handleInputChange('window', parseInt(e.target.value))}
                inputProps={{ min: 5, max: 200 }}
              />

              <TextField
                fullWidth
                label="Threshold (%)"
                type="number"
                value={formData.threshold * 100}
                onChange={(e) => handleInputChange('threshold', parseFloat(e.target.value) / 100)}
                inputProps={{ min: 1, max: 20, step: 0.1 }}
                helperText="Percentage deviation from moving average"
              />

              <TextField
                fullWidth
                label="Initial Capital ($)"
                type="number"
                value={formData.initialCapital}
                onChange={(e) => handleInputChange('initialCapital', parseInt(e.target.value))}
                inputProps={{ min: 1000 }}
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
        </Grid>

        {/* Results Panel */}
        <Grid item xs={12} md={8}>
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
              <Grid container spacing={2} sx={{ mb: 3 }}>
                {results.data.results.map((result, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
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
                  </Grid>
                ))}
              </Grid>

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
        </Grid>
      </Grid>
    </Box>
  );
};

export default Backtesting;
