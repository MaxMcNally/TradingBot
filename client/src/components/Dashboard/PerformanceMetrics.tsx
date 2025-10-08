import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  Divider,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  ShowChart,
  Assessment,
  Speed,
  Warning,
  CheckCircle,
  Cancel,
} from '@mui/icons-material';
import { usePerformanceMetrics } from '../../hooks/useTrading/useTrading';
import { formatCurrency, formatPercentage, formatDate } from '../../api/tradingApi';
import { PerformanceMetrics as PerformanceMetricsType } from '../../api/tradingApi';

interface PerformanceMetricsProps {
  userId: number;
}

const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({ userId }) => {
  const { metrics, isLoading, isError, error } = usePerformanceMetrics(userId, 20);

  // Calculate aggregate metrics
  const aggregateMetrics = useMemo(() => {
    if (!metrics || metrics.length === 0) {
      return {
        totalExecutions: 0,
        avgReturn: 0,
        bestReturn: 0,
        worstReturn: 0,
        avgSharpeRatio: 0,
        avgMaxDrawdown: 0,
        avgWinRate: 0,
        totalTrades: 0,
        avgVolatility: 0,
        avgProfitFactor: 0,
        successRate: 0,
      };
    }

    const totalExecutions = metrics.length;
    const returns = metrics.map(m => m.total_return);
    const sharpeRatios = metrics.filter(m => m.sharpe_ratio !== null && m.sharpe_ratio !== undefined).map(m => m.sharpe_ratio!);
    const maxDrawdowns = metrics.map(m => m.max_drawdown);
    const winRates = metrics.map(m => m.win_rate);
    const volatilities = metrics.map(m => m.volatility);
    const profitFactors = metrics.map(m => m.profit_factor);
    
    const profitableExecutions = metrics.filter(m => m.total_return > 0).length;

    return {
      totalExecutions,
      avgReturn: returns.reduce((sum, r) => sum + r, 0) / totalExecutions,
      bestReturn: Math.max(...returns),
      worstReturn: Math.min(...returns),
      avgSharpeRatio: sharpeRatios.length > 0 ? sharpeRatios.reduce((sum, r) => sum + r, 0) / sharpeRatios.length : 0,
      avgMaxDrawdown: maxDrawdowns.reduce((sum, d) => sum + d, 0) / totalExecutions,
      avgWinRate: winRates.reduce((sum, w) => sum + w, 0) / totalExecutions,
      totalTrades: metrics.reduce((sum, m) => sum + m.total_trades, 0),
      avgVolatility: volatilities.reduce((sum, v) => sum + v, 0) / totalExecutions,
      avgProfitFactor: profitFactors.reduce((sum, p) => sum + p, 0) / totalExecutions,
      successRate: (profitableExecutions / totalExecutions) * 100,
    };
  }, [metrics]);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Alert severity="error">
        Failed to load performance metrics. {error?.message}
      </Alert>
    );
  }

  if (!metrics || metrics.length === 0) {
    return (
      <Alert severity="info">
        No performance metrics available. Start trading or run backtests to see performance analytics.
      </Alert>
    );
  }

  const getPerformanceColor = (value: number, isPositive: boolean = true) => {
    if (isPositive) {
      return value > 0 ? 'success.main' : value < 0 ? 'error.main' : 'text.secondary';
    } else {
      return value < 0 ? 'success.main' : value > 0 ? 'error.main' : 'text.secondary';
    }
  };

  const getPerformanceIcon = (value: number, isPositive: boolean = true) => {
    if (isPositive) {
      return value > 0 ? <TrendingUp color="success" /> : value < 0 ? <TrendingDown color="error" /> : <ShowChart color="disabled" />;
    } else {
      return value < 0 ? <TrendingUp color="success" /> : value > 0 ? <TrendingDown color="error" /> : <ShowChart color="disabled" />;
    }
  };

  return (
    <Box p={3}>
      <Typography variant="h6" gutterBottom>
        Performance Metrics
      </Typography>
      
      {/* Aggregate Performance Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Total Executions
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {aggregateMetrics.totalExecutions}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" mt={1}>
                    {aggregateMetrics.successRate.toFixed(1)}% success rate
                  </Typography>
                </Box>
                <Assessment color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Average Return
                  </Typography>
                  <Typography 
                    variant="h5" 
                    fontWeight="bold"
                    color={getPerformanceColor(aggregateMetrics.avgReturn)}
                  >
                    {formatPercentage(aggregateMetrics.avgReturn)}
                  </Typography>
                  <Box display="flex" alignItems="center" mt={1}>
                    {getPerformanceIcon(aggregateMetrics.avgReturn)}
                    <Typography variant="body2" color="textSecondary" ml={1}>
                      Best: {formatPercentage(aggregateMetrics.bestReturn)}
                    </Typography>
                  </Box>
                </Box>
                <TrendingUp sx={{ fontSize: 40, color: getPerformanceColor(aggregateMetrics.avgReturn) }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Sharpe Ratio
                  </Typography>
                  <Typography 
                    variant="h5" 
                    fontWeight="bold"
                    color={getPerformanceColor(aggregateMetrics.avgSharpeRatio)}
                  >
                    {aggregateMetrics.avgSharpeRatio.toFixed(2)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" mt={1}>
                    Risk-adjusted return
                  </Typography>
                </Box>
                <ShowChart sx={{ fontSize: 40, color: getPerformanceColor(aggregateMetrics.avgSharpeRatio) }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Max Drawdown
                  </Typography>
                  <Typography 
                    variant="h5" 
                    fontWeight="bold"
                    color={getPerformanceColor(aggregateMetrics.avgMaxDrawdown, false)}
                  >
                    {formatPercentage(aggregateMetrics.avgMaxDrawdown)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" mt={1}>
                    Average risk
                  </Typography>
                </Box>
                <Warning sx={{ fontSize: 40, color: getPerformanceColor(aggregateMetrics.avgMaxDrawdown, false) }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Additional Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Win Rate
              </Typography>
              <Typography variant="h6" fontWeight="bold">
                {formatPercentage(aggregateMetrics.avgWinRate)}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={aggregateMetrics.avgWinRate}
                sx={{ mt: 1, height: 8, borderRadius: 4 }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Total Trades
              </Typography>
              <Typography variant="h6" fontWeight="bold">
                {aggregateMetrics.totalTrades.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="textSecondary" mt={1}>
                Across all executions
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Profit Factor
              </Typography>
              <Typography variant="h6" fontWeight="bold">
                {aggregateMetrics.avgProfitFactor.toFixed(2)}
              </Typography>
              <Typography variant="body2" color="textSecondary" mt={1}>
                Wins vs losses ratio
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Performance History Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Performance History
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Strategy</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell align="right">Return</TableCell>
                  <TableCell align="right">Sharpe</TableCell>
                  <TableCell align="right">Max DD</TableCell>
                  <TableCell align="right">Win Rate</TableCell>
                  <TableCell align="right">Trades</TableCell>
                  <TableCell align="right">Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {metrics.slice(0, 10).map((metric) => (
                  <TableRow key={metric.id}>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {metric.strategy_name}
                        </Typography>
                        <Chip 
                          label={metric.execution_type} 
                          size="small"
                          color={metric.execution_type === 'LIVE_TRADING' ? 'error' : 'primary'}
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {metric.strategy_type}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography 
                        variant="body2" 
                        fontWeight="bold"
                        color={getPerformanceColor(metric.total_return)}
                      >
                        {formatPercentage(metric.total_return)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {metric.sharpe_ratio ? metric.sharpe_ratio.toFixed(2) : 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography 
                        variant="body2"
                        color={getPerformanceColor(metric.max_drawdown, false)}
                      >
                        {formatPercentage(metric.max_drawdown)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {formatPercentage(metric.win_rate)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {metric.total_trades}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" color="textSecondary">
                        {formatDate(metric.created_at)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Risk Metrics */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Risk Analysis
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box mb={2}>
                <Typography variant="subtitle2" gutterBottom>
                  Volatility (Annualized)
                </Typography>
                <Typography variant="h6" color="warning.main">
                  {formatPercentage(aggregateMetrics.avgVolatility)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Average price volatility across all strategies
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box mb={2}>
                <Typography variant="subtitle2" gutterBottom>
                  Risk-Adjusted Performance
                </Typography>
                <Box display="flex" alignItems="center" gap={1}>
                  {aggregateMetrics.avgSharpeRatio > 1 ? (
                    <CheckCircle color="success" />
                  ) : (
                    <Cancel color="error" />
                  )}
                  <Typography 
                    variant="h6" 
                    color={aggregateMetrics.avgSharpeRatio > 1 ? 'success.main' : 'error.main'}
                  >
                    {aggregateMetrics.avgSharpeRatio > 1 ? 'Good' : 'Poor'}
                  </Typography>
                </Box>
                <Typography variant="body2" color="textSecondary">
                  Sharpe ratio above 1.0 indicates good risk-adjusted returns
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default PerformanceMetrics;

