import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  LinearProgress,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
} from '@mui/material';
import {
  AccountBalance,
  TrendingUp,
  TrendingDown,
  PieChart,
  AttachMoney,
} from '@mui/icons-material';
import { usePortfolioSummary, usePortfolioHistory } from '../../hooks/useTrading/useTrading';
import { formatCurrency, formatPercentage, formatDate } from '../../api/tradingApi';

interface PortfolioOverviewProps {
  userId: number;
}

interface Position {
  shares: number;
  avgPrice: number;
}

interface PortfolioSnapshot {
  id: number;
  user_id: number;
  timestamp: string;
  total_value: number;
  cash: number;
  positions: string; // JSON string
  mode: 'PAPER' | 'LIVE';
  created_at: string;
}

const PortfolioOverview: React.FC<PortfolioOverviewProps> = ({ userId }) => {
  const { portfolio, isLoading: portfolioLoading, isError: portfolioError } = usePortfolioSummary(userId);
  const { history, isLoading: historyLoading, isError: historyError } = usePortfolioHistory(userId, 10);

  if (portfolioLoading || historyLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (portfolioError || historyError) {
    return (
      <Alert severity="error">
        Failed to load portfolio data. Please try again later.
      </Alert>
    );
  }

  if (!portfolio) {
    return (
      <Alert severity="info">
        No portfolio data available. Start a trading session to see your portfolio.
      </Alert>
    );
  }

  // Parse positions from the latest portfolio snapshot
  const latestSnapshot = history && history.length > 0 ? history[0] : null;
  const positions: Record<string, Position> = latestSnapshot 
    ? JSON.parse(latestSnapshot.positions) 
    : {};

  // Calculate position values and percentages
  const positionData = Object.entries(positions)
    .filter(([_, position]) => position.shares > 0)
    .map(([symbol, position]) => {
      const currentValue = position.shares * position.avgPrice;
      const percentage = portfolio.currentValue > 0 ? (currentValue / portfolio.currentValue) * 100 : 0;
      return {
        symbol,
        shares: position.shares,
        avgPrice: position.avgPrice,
        currentValue,
        percentage,
      };
    })
    .sort((a, b) => b.currentValue - a.currentValue);

  const totalInvestedValue = positionData.reduce((sum, pos) => sum + pos.currentValue, 0);
  const cashPercentage = portfolio.currentValue > 0 ? (portfolio.cash / portfolio.currentValue) * 100 : 0;

  // Calculate portfolio performance
  const previousValue = history && history.length > 1 ? history[1].total_value : portfolio.currentValue;
  const portfolioChange = portfolio.currentValue - previousValue;
  const portfolioChangePercent = previousValue > 0 ? (portfolioChange / previousValue) * 100 : 0;

  return (
    <Box p={3}>
      <Typography variant="h6" gutterBottom>
        Portfolio Overview
      </Typography>
      
      {/* Portfolio Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Total Value
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {formatCurrency(portfolio.currentValue)}
                  </Typography>
                  <Box display="flex" alignItems="center" mt={1}>
                    {portfolioChange >= 0 ? (
                      <TrendingUp color="success" sx={{ fontSize: 16, mr: 0.5 }} />
                    ) : (
                      <TrendingDown color="error" sx={{ fontSize: 16, mr: 0.5 }} />
                    )}
                    <Typography 
                      variant="body2" 
                      color={portfolioChange >= 0 ? "success.main" : "error.main"}
                    >
                      {formatCurrency(Math.abs(portfolioChange))} ({formatPercentage(Math.abs(portfolioChangePercent))})
                    </Typography>
                  </Box>
                </Box>
                <AccountBalance color="primary" sx={{ fontSize: 40 }} />
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
                    Cash
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {formatCurrency(portfolio.cash)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" mt={1}>
                    {formatPercentage(cashPercentage)} of portfolio
                  </Typography>
                </Box>
                <AttachMoney color="success" sx={{ fontSize: 40 }} />
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
                    Positions
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {portfolio.totalPositions}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" mt={1}>
                    Active holdings
                  </Typography>
                </Box>
                <PieChart color="primary" sx={{ fontSize: 40 }} />
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
                    Mode
                  </Typography>
                  <Chip 
                    label={portfolio.mode} 
                    color={portfolio.mode === 'LIVE' ? 'error' : 'primary'}
                    size="small"
                    sx={{ mt: 1 }}
                  />
                  <Typography variant="body2" color="textSecondary" mt={1}>
                    Last updated: {formatDate(portfolio.lastUpdate)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Asset Allocation */}
      {positionData.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Asset Allocation
            </Typography>
            <Box sx={{ mb: 2 }}>
              {positionData.map((position) => (
                <Box key={position.symbol} sx={{ mb: 2 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body2" fontWeight="bold">
                      {position.symbol}
                    </Typography>
                    <Typography variant="body2">
                      {formatCurrency(position.currentValue)} ({formatPercentage(position.percentage)})
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={position.percentage}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
              ))}
              {cashPercentage > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body2" fontWeight="bold">
                      Cash
                    </Typography>
                    <Typography variant="body2">
                      {formatCurrency(portfolio.cash)} ({formatPercentage(cashPercentage)})
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={cashPercentage}
                    color="success"
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Holdings Table */}
      {positionData.length > 0 ? (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Current Holdings
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Symbol</TableCell>
                    <TableCell align="right">Shares</TableCell>
                    <TableCell align="right">Avg Price</TableCell>
                    <TableCell align="right">Current Value</TableCell>
                    <TableCell align="right">% of Portfolio</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {positionData.map((position) => (
                    <TableRow key={position.symbol}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {position.symbol}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        {position.shares.toLocaleString()}
                      </TableCell>
                      <TableCell align="right">
                        {formatCurrency(position.avgPrice)}
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="bold">
                          {formatCurrency(position.currentValue)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        {formatPercentage(position.percentage)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent>
            <Box textAlign="center" py={4}>
              <AccountBalance sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="textSecondary" gutterBottom>
                No Active Positions
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Your portfolio currently consists of {formatCurrency(portfolio.cash)} in cash.
                Start trading to build your portfolio.
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Portfolio History */}
      {history && history.length > 0 && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Recent Portfolio History
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell align="right">Total Value</TableCell>
                    <TableCell align="right">Cash</TableCell>
                    <TableCell align="right">Positions</TableCell>
                    <TableCell align="right">Mode</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {history.slice(0, 5).map((snapshot) => (
                    <TableRow key={snapshot.id}>
                      <TableCell>
                        {formatDate(snapshot.timestamp)}
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="bold">
                          {formatCurrency(snapshot.total_value)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        {formatCurrency(snapshot.cash)}
                      </TableCell>
                      <TableCell align="right">
                        {Object.keys(JSON.parse(snapshot.positions)).length}
                      </TableCell>
                      <TableCell align="right">
                        <Chip 
                          label={snapshot.mode} 
                          color={snapshot.mode === 'LIVE' ? 'error' : 'primary'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default PortfolioOverview;

