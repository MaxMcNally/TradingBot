import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  TextField,
  Alert,
  CircularProgress,
  Chip,
  Divider,
  Paper,
} from '@mui/material';
import {
  PlayArrow,
  CheckCircle,
  Info,
  TrendingUp,
  AccountBalance,
} from '@mui/icons-material';
import { runBacktest } from '../../api';
import { BacktestRequest } from '../../api';
import { UnifiedStrategy } from '../../components/shared';
import { BacktestResponse } from './Backtesting.types';

interface BacktestSessionControlsProps {
  selectedStocks: string[];
  selectedBot: UnifiedStrategy | null;
  strategyParameters: Record<string, any>;
  onBacktestStarted: () => void;
  onBacktestCompleted: (results: any) => void;
}

const BacktestSessionControls: React.FC<BacktestSessionControlsProps> = ({
  selectedStocks,
  selectedBot,
  strategyParameters,
  onBacktestStarted,
  onBacktestCompleted,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Backtest configuration
  const [startDate, setStartDate] = useState('2023-01-01');
  const [endDate, setEndDate] = useState('2023-12-31');
  const [initialCapital, setInitialCapital] = useState(10000);
  const [sharesPerTrade, setSharesPerTrade] = useState(100);

  const handleRunBacktest = async () => {
    if (selectedStocks.length === 0) {
      setError('Please select at least one stock to test');
      return;
    }

    if (!selectedBot) {
      setError('Please select a bot to test');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      onBacktestStarted();

      // Build backtest request
      // For user strategies, use strategy_type; for custom strategies, we can't backtest them directly
      // as the API only supports predefined strategy types
      let strategyType: string;
      if (selectedBot.type === 'user' && selectedBot.strategy_type) {
        strategyType = selectedBot.strategy_type;
      } else if (selectedBot.type === 'custom') {
        throw new Error('Custom strategies cannot be backtested directly. Please use a predefined strategy type.');
      } else {
        throw new Error('Invalid bot type for backtesting');
      }

      const backtestRequest: BacktestRequest = {
        strategy: strategyType,
        symbols: selectedStocks,
        startDate,
        endDate,
        initialCapital,
        sharesPerTrade,
        // Include strategy parameters
        ...strategyParameters,
      };

      const response = await runBacktest(backtestRequest);
      
      // The API returns ApiResponse<BacktestResponse>
      // response.data = { success: boolean, data: {...}, error?: string }
      // The data contains: { strategy, symbols, results, totalReturn, finalPortfolioValue, winRate, totalTrades, maxDrawdown, config }
      // But BacktestResponse type expects { success, data: {...} }
      // So we wrap it to match the expected structure
      if (response.data.success && response.data.data) {
        setSuccess('Backtest completed successfully!');
        // Wrap the response to match BacktestResponse structure expected by the results page
        const backtestResponse: BacktestResponse = {
          success: true,
          data: response.data.data
        };
        onBacktestCompleted(backtestResponse);
      } else {
        setError(response.data.error || 'Failed to run backtest');
      }
    } catch (err: any) {
      console.error('Error running backtest:', err);
      setError(err.response?.data?.error || err.message || 'Failed to run backtest');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent>
        {/* Session Requirements */}
        <Box mt={3} p={2} bgcolor="grey.50" borderRadius={1}>
          <Typography variant="subtitle2" gutterBottom>
            <Info sx={{ mr: 1, verticalAlign: 'middle' }} />
            Backtest Requirements
          </Typography>
          <Box display="flex" flexDirection="column" gap={1}>
            <Box display="flex" alignItems="center" gap={1}>
              <CheckCircle color={selectedStocks.length > 0 ? 'success' : 'disabled'} fontSize="small" />
              <Typography variant="body2">
                Select stocks to test ({selectedStocks.length} selected)
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
              <CheckCircle color={selectedBot ? 'success' : 'disabled'} fontSize="small" />
              <Typography variant="body2">
                Choose bot to test ({selectedBot ? selectedBot.name : 'None selected'})
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Backtest Configuration */}
        <Box mt={3}>
          <Typography variant="h6" gutterBottom>
            Backtest Configuration
          </Typography>
          
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Start Date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                fullWidth
                InputLabelProps={{
                  shrink: true,
                }}
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="End Date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                fullWidth
                InputLabelProps={{
                  shrink: true,
                }}
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Initial Capital"
                type="number"
                value={initialCapital}
                onChange={(e) => setInitialCapital(parseFloat(e.target.value))}
                fullWidth
                inputProps={{ min: 1000, max: 1000000, step: 1000 }}
                helperText="Starting capital for the backtest"
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Shares Per Trade"
                type="number"
                value={sharesPerTrade}
                onChange={(e) => setSharesPerTrade(parseInt(e.target.value))}
                fullWidth
                inputProps={{ min: 1, max: 10000, step: 1 }}
                helperText="Number of shares per trade"
                disabled={loading}
              />
            </Grid>
          </Grid>
        </Box>

        {/* Configuration Summary */}
        {(selectedStocks.length > 0 || selectedBot) && (
          <Box mt={3}>
            <Typography variant="subtitle2" gutterBottom>
              Configuration Summary
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Grid container spacing={2}>
                {selectedBot && (
                  <Grid item xs={12} sm={6}>
                    <Box>
                      <Typography variant="body2" color="textSecondary">
                        <TrendingUp sx={{ mr: 1, verticalAlign: 'middle', fontSize: 16 }} />
                        Bot
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {selectedBot.name}
                      </Typography>
                    </Box>
                  </Grid>
                )}
                {selectedStocks.length > 0 && (
                  <Grid item xs={12} sm={6}>
                    <Box>
                      <Typography variant="body2" color="textSecondary">
                        <AccountBalance sx={{ mr: 1, verticalAlign: 'middle', fontSize: 16 }} />
                        Stocks ({selectedStocks.length})
                      </Typography>
                      <Box display="flex" flexWrap="wrap" gap={0.5} mt={0.5}>
                        {selectedStocks.map((stock) => (
                          <Chip key={stock} label={stock} size="small" />
                        ))}
                      </Box>
                    </Box>
                  </Grid>
                )}
                <Grid item xs={12} sm={6}>
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      Date Range
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {startDate} to {endDate}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      Initial Capital
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      ${initialCapital.toLocaleString()}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Box>
        )}

        {/* Error/Success Messages */}
        {error && (
          <Alert severity="error" sx={{ mt: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mt: 3 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {/* Custom Strategy Warning */}
        {selectedBot && selectedBot.type === 'custom' && (
          <Alert severity="warning" sx={{ mt: 3 }}>
            Custom strategies cannot be backtested with the current API. Please select a predefined strategy bot.
          </Alert>
        )}

        <Divider sx={{ my: 3 }} />

        {/* Run Backtest Button */}
        <Box display="flex" justifyContent="center">
          <Button
            variant="contained"
            size="large"
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PlayArrow />}
            onClick={handleRunBacktest}
            disabled={loading || selectedStocks.length === 0 || !selectedBot || selectedBot.type === 'custom'}
            sx={{ minWidth: 200 }}
          >
            {loading ? 'Running Backtest...' : 'Run Backtest'}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default BacktestSessionControls;

