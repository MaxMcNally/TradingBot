import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Grid,
  Chip,
  Button,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Stack,
  Badge
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  Public as PublicIcon,
  ContentCopy as CopyIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import { usePublicStrategies, useUser } from '../../hooks';
import { UserStrategy, copyPublicStrategy } from '../../api';

interface StrategyDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  strategy: UserStrategy | null;
  onCopyStrategy: (strategy: UserStrategy) => void;
  isCopying: boolean;
}

const StrategyDetailsDialog: React.FC<StrategyDetailsDialogProps> = ({
  open,
  onClose,
  strategy,
  onCopyStrategy,
  isCopying
}) => {
  if (!strategy) return null;

  const getBacktestResults = (strategy: UserStrategy) => {
    if (!strategy.backtest_results) return null;
    
    try {
      const results = typeof strategy.backtest_results === 'string' 
        ? JSON.parse(strategy.backtest_results) 
        : strategy.backtest_results;
      
      return {
        totalReturn: results.totalReturn || 0,
        winRate: results.winRate || 0,
        maxDrawdown: results.maxDrawdown || 0,
        finalPortfolioValue: results.finalPortfolioValue || 0,
        totalTrades: results.totalTrades || 0,
        sharpeRatio: results.sharpeRatio || 0
      };
    } catch {
      return null;
    }
  };

  const getStrategyTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      'movingAverageCrossover': 'Moving Average Crossover',
      'bollingerBands': 'Bollinger Bands',
      'meanReversion': 'Mean Reversion',
      'momentum': 'Momentum',
      'breakout': 'Breakout'
    };
    return typeMap[type] || type;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const backtestResults = getBacktestResults(strategy);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={2}>
          <PublicIcon color="primary" />
          <Typography variant="h5" component="div">
            {strategy.name}
          </Typography>
          <Chip label="Public Strategy" color="primary" size="small" />
        </Box>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3}>
          {/* Strategy Info */}
          <Box>
            <Typography variant="h6" gutterBottom>
              Strategy Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Type:</strong> {getStrategyTypeLabel(strategy.strategy_type)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Created:</strong> {formatDate(strategy.created_at)}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Description:</strong>
                </Typography>
                <Typography variant="body1" sx={{ mt: 1 }}>
                  {strategy.description || 'No description provided'}
                </Typography>
              </Grid>
            </Grid>
          </Box>

          <Divider />

          {/* Backtest Results */}
          {backtestResults ? (
            <Box>
              <Typography variant="h6" gutterBottom>
                <AssessmentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Backtest Results
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center', py: 2 }}>
                      <Typography variant="h4" color={backtestResults.totalReturn > 0 ? 'success.main' : 'error.main'}>
                        {(backtestResults.totalReturn * 100).toFixed(1)}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Return
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center', py: 2 }}>
                      <Typography variant="h4" color="primary.main">
                        {(backtestResults.winRate * 100).toFixed(1)}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Win Rate
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center', py: 2 }}>
                      <Typography variant="h4" color="error.main">
                        {(backtestResults.maxDrawdown * 100).toFixed(1)}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Max Drawdown
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center', py: 2 }}>
                      <Typography variant="h4" color="primary.main">
                        {backtestResults.totalTrades}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Trades
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center', py: 2 }}>
                      <Typography variant="h4" color="primary.main">
                        {backtestResults.sharpeRatio.toFixed(2)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Sharpe Ratio
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center', py: 2 }}>
                      <Typography variant="h4" color="primary.main">
                        ${backtestResults.finalPortfolioValue.toLocaleString()}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Final Portfolio Value
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          ) : (
            <Alert severity="info">
              No backtest results available for this strategy.
            </Alert>
          )}

          <Divider />

          {/* Strategy Configuration */}
          <Box>
            <Typography variant="h6" gutterBottom>
              Strategy Configuration
            </Typography>
            <Box sx={{ 
              p: 2, 
              bgcolor: 'InfoBackground', 
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'grey.200'
            }}>
              <Typography variant="body2" component="pre" sx={{ 
                fontFamily: 'monospace',
                fontSize: '0.875rem',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                margin: 0
              }}>
                {JSON.stringify(strategy.config, null, 2)}
              </Typography>
            </Box>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>
          Close
        </Button>
        <Button
          variant="contained"
          startIcon={<CopyIcon />}
          onClick={() => onCopyStrategy(strategy)}
          disabled={isCopying}
        >
          {isCopying ? 'Copying...' : 'Copy to My Strategies'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const StrategiesMarketplace: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [selectedStrategy, setSelectedStrategy] = useState<UserStrategy | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [isCopying, setIsCopying] = useState(false);

  const {
    strategies: publicStrategies,
    isLoading,
    isError,
    error,
    refetch
  } = usePublicStrategies();

  const { user } = useUser();

  const filteredAndSortedStrategies = useMemo(() => {
    let filtered = publicStrategies;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(strategy =>
        strategy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        strategy.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        strategy.strategy_type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(strategy => strategy.strategy_type === filterType);
    }

    // Sort strategies
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'created_at':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'strategy_type':
          return a.strategy_type.localeCompare(b.strategy_type);
        default:
          return 0;
      }
    });

    return filtered;
  }, [publicStrategies, searchTerm, filterType, sortBy]);

  const handleViewDetails = (strategy: UserStrategy) => {
    setSelectedStrategy(strategy);
    setDetailsDialogOpen(true);
  };

  const handleCopyStrategy = async (strategy: UserStrategy) => {
    if (!user?.id) {
      console.error('User not found');
      return;
    }

    try {
      setIsCopying(true);
      
      // Use the API to copy the public strategy
      await copyPublicStrategy(parseInt(user.id), strategy.id);
      
      // Close the dialog
      setDetailsDialogOpen(false);
      setSelectedStrategy(null);
      
      // You could show a success message here
    } catch (error) {
      console.error('Error copying strategy:', error);
      // You could show an error message here
    } finally {
      setIsCopying(false);
    }
  };

  const getStrategyTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      'movingAverageCrossover': 'Moving Average Crossover',
      'bollingerBands': 'Bollinger Bands',
      'meanReversion': 'Mean Reversion',
      'momentum': 'Momentum',
      'breakout': 'Breakout'
    };
    return typeMap[type] || type;
  };

  const getBacktestResults = (strategy: UserStrategy) => {
    if (!strategy.backtest_results) return null;
    
    try {
      const results = typeof strategy.backtest_results === 'string' 
        ? JSON.parse(strategy.backtest_results) 
        : strategy.backtest_results;
      
      return {
        totalReturn: results.totalReturn || 0,
        winRate: results.winRate || 0,
        maxDrawdown: results.maxDrawdown || 0
      };
    } catch {
      return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box p={3}>
        <Alert severity="error">
          Error loading public strategies: {error?.message || 'Unknown error'}
        </Alert>
        <Button onClick={() => refetch()} sx={{ mt: 2 }}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            <PublicIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
            Strategies Marketplace
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Discover and use trading strategies created by the community
          </Typography>
        </Box>
        <Badge badgeContent={publicStrategies.length} color="primary">
          <PublicIcon color="primary" sx={{ fontSize: 40 }} />
        </Badge>
      </Box>

      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search strategies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Strategy Type</InputLabel>
                <Select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  label="Strategy Type"
                >
                  <MenuItem value="all">All Types</MenuItem>
                  <MenuItem value="movingAverageCrossover">Moving Average Crossover</MenuItem>
                  <MenuItem value="bollingerBands">Bollinger Bands</MenuItem>
                  <MenuItem value="meanReversion">Mean Reversion</MenuItem>
                  <MenuItem value="momentum">Momentum</MenuItem>
                  <MenuItem value="breakout">Breakout</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  label="Sort By"
                >
                  <MenuItem value="created_at">Newest First</MenuItem>
                  <MenuItem value="name">Name</MenuItem>
                  <MenuItem value="strategy_type">Type</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<FilterIcon />}
                onClick={() => {
                  setSearchTerm('');
                  setFilterType('all');
                  setSortBy('created_at');
                }}
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Strategies Grid */}
      {filteredAndSortedStrategies.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <PublicIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {searchTerm || filterType !== 'all' 
                ? 'No strategies match your search criteria'
                : 'No public strategies available'
              }
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              {searchTerm || filterType !== 'all'
                ? 'Try adjusting your search terms or filters.'
                : 'Be the first to share a public strategy!'
              }
            </Typography>
            {(searchTerm || filterType !== 'all') && (
              <Button
                variant="contained"
                onClick={() => {
                  setSearchTerm('');
                  setFilterType('all');
                }}
              >
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {filteredAndSortedStrategies.map((strategy) => {
            const backtestResults = getBacktestResults(strategy);
            
            return (
              <Grid item xs={12} md={6} lg={4} key={strategy.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Typography variant="h6" component="h2" noWrap>
                        {strategy.name}
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Tooltip title="Public Strategy">
                          <PublicIcon color="primary" fontSize="small" />
                        </Tooltip>
                        <Chip
                          label={getStrategyTypeLabel(strategy.strategy_type)}
                          variant="outlined"
                          size="small"
                        />
                      </Box>
                    </Box>

                    <Typography variant="body2" color="text.secondary" mb={2}>
                      {strategy.description || 'No description provided'}
                    </Typography>

                    {backtestResults && (
                      <Box mb={2}>
                        <Typography variant="subtitle2" gutterBottom>
                          Performance
                        </Typography>
                        <Box display="flex" flexWrap="wrap" gap={1}>
                          <Chip
                            icon={<TrendingUpIcon />}
                            label={`${(backtestResults.totalReturn * 100).toFixed(1)}% Return`}
                            color={backtestResults.totalReturn > 0 ? 'success' : 'error'}
                            size="small"
                          />
                          <Chip
                            icon={<AssessmentIcon />}
                            label={`${(backtestResults.winRate * 100).toFixed(1)}% Win Rate`}
                            variant="outlined"
                            size="small"
                          />
                        </Box>
                      </Box>
                    )}

                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <PersonIcon fontSize="small" color="action" />
                      <Typography variant="caption" color="text.secondary">
                        Created by User #{strategy.user_id}
                      </Typography>
                    </Box>

                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      <CalendarIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                      {formatDate(strategy.created_at)}
                    </Typography>
                  </CardContent>

                  <CardActions>
                    <Button
                      size="small"
                      startIcon={<ViewIcon />}
                      onClick={() => handleViewDetails(strategy)}
                    >
                      View Details
                    </Button>
                    <Button
                      size="small"
                      startIcon={<CopyIcon />}
                      onClick={() => handleCopyStrategy(strategy)}
                      variant="outlined"
                    >
                      Copy
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Strategy Details Dialog */}
      <StrategyDetailsDialog
        open={detailsDialogOpen}
        onClose={() => {
          setDetailsDialogOpen(false);
          setSelectedStrategy(null);
        }}
        strategy={selectedStrategy}
        onCopyStrategy={handleCopyStrategy}
        isCopying={isCopying}
      />
    </Box>
  );
};

export default StrategiesMarketplace;
