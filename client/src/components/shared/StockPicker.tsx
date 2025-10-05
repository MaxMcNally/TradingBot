import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Autocomplete,
  Chip,
  Button,
  Grid,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
} from '@mui/material';
import {
  Add,
  Remove,
  Search,
  TrendingUp,
  Info,
  Refresh,
} from '@mui/icons-material';
import { searchSymbols, getPopularSymbols, SymbolOption } from '../../api';

interface StockPickerProps {
  selectedStocks: string[];
  onStocksChange: (stocks: string[]) => void;
  maxStocks?: number;
  title?: string;
  description?: string;
  showQuickAdd?: boolean;
  showPopularStocks?: boolean;
  showTips?: boolean;
  compact?: boolean;
}

const StockPicker: React.FC<StockPickerProps> = ({
  selectedStocks,
  onStocksChange,
  maxStocks = 10,
  title = "Select Stocks to Trade",
  description = "Choose up to {maxStocks} stocks for your trading session. You can search for specific symbols or select from popular options.",
  showQuickAdd = true,
  showPopularStocks = true,
  showTips = true,
  compact = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SymbolOption[]>([]);
  const [popularSymbols, setPopularSymbols] = useState<SymbolOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);

  // Popular symbols to show by default
  const defaultSymbols: SymbolOption[] = [
    { symbol: 'SPY', name: 'SPDR S&P 500 ETF Trust', exchange: 'NYSE' },
    { symbol: 'QQQ', name: 'Invesco QQQ Trust', exchange: 'NASDAQ' },
    { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ' },
    { symbol: 'TSLA', name: 'Tesla Inc.', exchange: 'NASDAQ' },
    { symbol: 'MSFT', name: 'Microsoft Corporation', exchange: 'NASDAQ' },
    { symbol: 'GOOGL', name: 'Alphabet Inc. Class A', exchange: 'NASDAQ' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', exchange: 'NASDAQ' },
    { symbol: 'NVDA', name: 'NVIDIA Corporation', exchange: 'NASDAQ' },
    { symbol: 'META', name: 'Meta Platforms Inc.', exchange: 'NASDAQ' },
    { symbol: 'NFLX', name: 'Netflix Inc.', exchange: 'NASDAQ' },
  ];

  useEffect(() => {
    if (showPopularStocks) {
      fetchPopularSymbols();
    }
  }, [showPopularStocks]);

  const fetchPopularSymbols = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getPopularSymbols();
      setPopularSymbols(response.data.symbols || defaultSymbols);
    } catch (err) {
      console.error('Error fetching popular symbols:', err);
      setPopularSymbols(defaultSymbols);
      setError('Failed to load popular symbols');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setSearchLoading(true);
      setError(null);
      const response = await searchSymbols(query, true);
      setSearchResults(response.data.symbols || []);
    } catch (err) {
      console.error('Error searching symbols:', err);
      setError('Failed to search symbols');
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleAddStock = (symbol: string) => {
    if (selectedStocks.includes(symbol)) {
      return; // Already selected
    }
    
    if (selectedStocks.length >= maxStocks) {
      setError(`Maximum ${maxStocks} stocks allowed`);
      return;
    }

    onStocksChange([...selectedStocks, symbol]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleRemoveStock = (symbol: string) => {
    onStocksChange(selectedStocks.filter(s => s !== symbol));
  };

  const handleSearchInputChange = (event: React.SyntheticEvent, value: string) => {
    setSearchQuery(value);
    if (value.length >= 2) {
      handleSearch(value);
    } else {
      setSearchResults([]);
    }
  };

  const getSymbolInfo = (symbol: string): SymbolOption | undefined => {
    return [...popularSymbols, ...searchResults].find(s => s.symbol === symbol);
  };

  const content = (
    <Box>
      {/* Header */}
      {!compact && (
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" component="h3">
            {title}
          </Typography>
          {showPopularStocks && (
            <Tooltip title="Refresh Popular Symbols">
              <IconButton onClick={fetchPopularSymbols} size="small">
                <Refresh />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      )}

      {/* Description */}
      {!compact && description && (
        <Typography variant="body2" color="textSecondary" mb={2}>
          {description.replace('{maxStocks}', maxStocks.toString())}
        </Typography>
      )}

      {/* Selected Stocks */}
      {selectedStocks.length > 0 && (
        <Box mb={3}>
          {!compact && (
            <Typography variant="subtitle2" gutterBottom>
              Selected Stocks ({selectedStocks.length}/{maxStocks})
            </Typography>
          )}
          <Box display="flex" flexWrap="wrap" gap={1}>
            {selectedStocks.map((symbol) => {
              const symbolInfo = getSymbolInfo(symbol);
              return (
                <Chip
                  key={symbol}
                  label={symbol}
                  onDelete={() => handleRemoveStock(symbol)}
                  color="primary"
                  variant="outlined"
                  icon={<TrendingUp />}
                  title={symbolInfo?.name || symbol}
                />
              );
            })}
          </Box>
        </Box>
      )}

      {/* Search */}
      <Box mb={3}>
        <Autocomplete
          freeSolo
          options={searchResults}
          getOptionLabel={(option) => typeof option === 'string' ? option : option.symbol}
          renderOption={(props, option) => (
            <Box component="li" {...props}>
              <Box>
                <Typography variant="subtitle2">{option.symbol}</Typography>
                <Typography variant="body2" color="textSecondary">
                  {option.name} ({option.exchange})
                </Typography>
              </Box>
            </Box>
          )}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Search for stocks"
              placeholder="Type symbol or company name..."
              InputProps={{
                ...params.InputProps,
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
                endAdornment: (
                  <>
                    {searchLoading && <CircularProgress color="inherit" size={20} />}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
          value={searchQuery}
          onInputChange={handleSearchInputChange}
          onChange={(event, value) => {
            if (value && typeof value === 'object') {
              handleAddStock(value.symbol);
            }
          }}
          loading={searchLoading}
          noOptionsText={searchQuery.length < 2 ? "Type at least 2 characters to search" : "No stocks found"}
        />
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Popular Symbols */}
      {showPopularStocks && (
        <Box>
          {!compact && (
            <Typography variant="subtitle2" gutterBottom>
              Popular Stocks
            </Typography>
          )}
          <Paper variant="outlined" sx={{ maxHeight: compact ? 200 : 300, overflow: 'auto' }}>
            <List dense>
              {popularSymbols.map((symbol, index) => (
                <React.Fragment key={symbol.symbol}>
                  <ListItem
                    button
                    onClick={() => handleAddStock(symbol.symbol)}
                    disabled={selectedStocks.includes(symbol.symbol) || selectedStocks.length >= maxStocks}
                  >
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="subtitle2">{symbol.symbol}</Typography>
                          {selectedStocks.includes(symbol.symbol) && (
                            <Chip label="Selected" size="small" color="primary" />
                          )}
                        </Box>
                      }
                      secondary={
                        !compact && (
                          <Typography variant="body2" color="textSecondary">
                            {symbol.name} • {symbol.exchange}
                          </Typography>
                        )
                      }
                    />
                    <ListItemSecondaryAction>
                      {selectedStocks.includes(symbol.symbol) ? (
                        <Tooltip title="Remove">
                          <IconButton
                            edge="end"
                            onClick={() => handleRemoveStock(symbol.symbol)}
                            size="small"
                          >
                            <Remove />
                          </IconButton>
                        </Tooltip>
                      ) : (
                        <Tooltip title="Add">
                          <IconButton
                            edge="end"
                            onClick={() => handleAddStock(symbol.symbol)}
                            disabled={selectedStocks.length >= maxStocks}
                            size="small"
                          >
                            <Add />
                          </IconButton>
                        </Tooltip>
                      )}
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < popularSymbols.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Box>
      )}

      {/* Quick Add Buttons */}
      {showQuickAdd && (
        <Box mt={2}>
          {!compact && (
            <Typography variant="subtitle2" gutterBottom>
              Quick Add
            </Typography>
          )}
          <Box display="flex" flexWrap="wrap" gap={1}>
            {['SPY', 'QQQ', 'AAPL', 'TSLA'].map((symbol) => (
              <Button
                key={symbol}
                variant="outlined"
                size="small"
                onClick={() => handleAddStock(symbol)}
                disabled={selectedStocks.includes(symbol) || selectedStocks.length >= maxStocks}
                startIcon={<Add />}
              >
                {symbol}
              </Button>
            ))}
          </Box>
        </Box>
      )}

      {/* Info */}
      {showTips && !compact && (
        <Box mt={2} p={2} bgcolor="grey.50" borderRadius={1}>
          <Box display="flex" alignItems="flex-start" gap={1}>
            <Info color="info" fontSize="small" />
            <Box>
              <Typography variant="body2" color="textSecondary">
                <strong>Tips:</strong>
              </Typography>
              <Typography variant="body2" color="textSecondary">
                • Search by symbol (e.g., "AAPL") or company name (e.g., "Apple")
              </Typography>
              <Typography variant="body2" color="textSecondary">
                • Popular ETFs like SPY and QQQ provide broad market exposure
              </Typography>
              <Typography variant="body2" color="textSecondary">
                • Individual stocks offer more volatility and potential returns
              </Typography>
            </Box>
          </Box>
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

export default StockPicker;
