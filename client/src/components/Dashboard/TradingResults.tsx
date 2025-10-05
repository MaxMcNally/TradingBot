import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AccountBalance,
  Assessment,
  Refresh,
  Visibility,
  PlayArrow,
  Stop,
  Pause,
} from '@mui/icons-material';
import {
  formatCurrency,
  formatPercentage,
  formatDate,
  calculatePnLColor,
  getTradeActionColor,
  getSessionStatusColor,
  Trade,
  TradingSession,
  UserTradingStats,
  UserPortfolioSummary,
} from '../../api/tradingApi';
import { 
  useTradingStats, 
  usePortfolioSummary, 
  useTrades, 
  useTradingSessions,
  useActiveTradingSession 
} from '../../hooks';
import { getMarketStatus, formatMarketTime } from '../../utils/marketHours';

interface TradingResultsProps {
  userId: number;
}

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
      id={`trading-tabpanel-${index}`}
      aria-labelledby={`trading-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const TradingResults: React.FC<TradingResultsProps> = ({ userId }) => {
  const [activeTab, setActiveTab] = useState(0);
  
  // Dialog states
  const [sessionDetailsOpen, setSessionDetailsOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<TradingSession | null>(null);
  
  // Market status
  const [marketStatus, setMarketStatus] = useState(getMarketStatus());

  // Use hooks for data fetching
  const { stats, isLoading: statsLoading, isError: statsError } = useTradingStats(userId);
  const { portfolio, isLoading: portfolioLoading, isError: portfolioError } = usePortfolioSummary(userId);
  const { trades: recentTrades, isLoading: tradesLoading, isError: tradesError } = useTrades(userId);
  const { sessions, isLoading: sessionsLoading, isError: sessionsError } = useTradingSessions(userId);
  const { data: activeSession, isLoading: activeSessionLoading, isError: activeSessionError } = useActiveTradingSession(userId);

  // Combined loading and error states
  const loading = statsLoading || portfolioLoading || tradesLoading || sessionsLoading || activeSessionLoading;
  const error = statsError || portfolioError || tradesError || sessionsError || activeSessionError;

  // Update market status every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setMarketStatus(getMarketStatus());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Safety check for userId
  if (!userId || isNaN(userId)) {
    return (
      <Alert severity="error">
        Invalid user ID. Please log in again.
      </Alert>
    );
  }

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleViewSessionDetails = (session: TradingSession) => {
    setSelectedSession(session);
    setSessionDetailsOpen(true);
  };

  const handleCloseSessionDetails = () => {
    setSessionDetailsOpen(false);
    setSelectedSession(null);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" action={
        <Button color="inherit" size="small" onClick={() => window.location.reload()}>
          Retry
        </Button>
      }>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header with refresh button */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" component="h2">
          Trading Results
        </Typography>
        <Tooltip title="Refresh Data">
          <IconButton onClick={() => window.location.reload()} color="primary">
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Active Session Alert */}
      {activeSession && (
        <Alert 
          severity="info" 
          sx={{ mb: 3 }}
          action={
            <Box>
              <Tooltip title="Pause Session">
                <IconButton size="small" color="inherit">
                  <Pause />
                </IconButton>
              </Tooltip>
              <Tooltip title="Stop Session">
                <IconButton size="small" color="inherit">
                  <Stop />
                </IconButton>
              </Tooltip>
            </Box>
          }
        >
          Active trading session running in {activeSession.mode} mode since {formatDate(activeSession.start_time)}
        </Alert>
      )}

      {/* Market Status Alert */}
      {!marketStatus.isOpen && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="subtitle2">
            Market is currently closed
          </Typography>
          <Typography variant="body2">
            {marketStatus.nextOpen 
              ? `Market opens ${formatMarketTime(marketStatus.nextOpen)}`
              : 'Market is closed'
            }
          </Typography>
        </Alert>
      )}

      {/* Stats Cards */}
      {stats && portfolio && (
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <AccountBalance color="primary" sx={{ mr: 1 }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Portfolio Value
                    </Typography>
                    <Typography variant="h6">
                      {formatCurrency(portfolio.currentValue)}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <TrendingUp color="success" sx={{ mr: 1 }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Total P&L
                    </Typography>
                    <Typography 
                      variant="h6" 
                      color={stats.totalPnL >= 0 ? 'success.main' : 'error.main'}
                    >
                      {formatCurrency(stats.totalPnL)}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <Assessment color="info" sx={{ mr: 1 }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Win Rate
                    </Typography>
                    <Typography variant="h6">
                      {formatPercentage(stats.winRate)}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <TrendingDown color="warning" sx={{ mr: 1 }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Total Trades
                    </Typography>
                    <Typography variant="h6">
                      {stats.totalTrades}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Recent Trades" />
          <Tab label="Trading Sessions" />
          <Tab label="Portfolio Details" />
        </Tabs>
      </Box>

      {/* Recent Trades Tab */}
      <TabPanel value={activeTab} index={0}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Symbol</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Quantity</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>P&L</TableCell>
                <TableCell>Strategy</TableCell>
                <TableCell>Timestamp</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recentTrades.map((trade) => (
                <TableRow key={trade.id}>
                  <TableCell>
                    <Typography variant="subtitle2" fontWeight="bold">
                      {trade.symbol}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={trade.action}
                      size="small"
                      style={{ 
                        backgroundColor: getTradeActionColor(trade.action),
                        color: 'white'
                      }}
                    />
                  </TableCell>
                  <TableCell>{trade.quantity}</TableCell>
                  <TableCell>{formatCurrency(trade.price)}</TableCell>
                  <TableCell>
                    {trade.pnl !== null && trade.pnl !== undefined ? (
                      <Typography
                        variant="body2"
                        color={calculatePnLColor(trade.pnl)}
                        fontWeight="bold"
                      >
                        {formatCurrency(trade.pnl)}
                      </Typography>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>{trade.strategy}</TableCell>
                  <TableCell>{formatDate(trade.timestamp)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Trading Sessions Tab */}
      <TabPanel value={activeTab} index={1}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Session ID</TableCell>
                <TableCell>Mode</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Start Time</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Trades</TableCell>
                <TableCell>P&L</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sessions.map((session) => (
                <TableRow key={session.id}>
                  <TableCell>{session.id}</TableCell>
                  <TableCell>
                    <Chip
                      label={session.mode}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={session.status}
                      size="small"
                      style={{ 
                        backgroundColor: getSessionStatusColor(session.status),
                        color: 'white'
                      }}
                    />
                  </TableCell>
                  <TableCell>{formatDate(session.start_time)}</TableCell>
                  <TableCell>
                    {session.end_time ? (
                      `${Math.round((new Date(session.end_time).getTime() - new Date(session.start_time).getTime()) / (1000 * 60))} min`
                    ) : (
                      'Active'
                    )}
                  </TableCell>
                  <TableCell>{session.total_trades}</TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      color={session.total_pnl && session.total_pnl >= 0 ? 'success.main' : 'error.main'}
                      fontWeight="bold"
                    >
                      {session.total_pnl ? formatCurrency(session.total_pnl) : '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Tooltip title="View Details">
                      <IconButton
                        size="small"
                        onClick={() => handleViewSessionDetails(session)}
                      >
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Portfolio Details Tab */}
      <TabPanel value={activeTab} index={2}>
        {portfolio && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Portfolio Summary
                  </Typography>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography>Total Value:</Typography>
                    <Typography fontWeight="bold">
                      {formatCurrency(portfolio.currentValue)}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography>Cash:</Typography>
                    <Typography fontWeight="bold">
                      {formatCurrency(portfolio.cash)}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography>Positions:</Typography>
                    <Typography fontWeight="bold">
                      {portfolio.totalPositions}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography>Mode:</Typography>
                    <Chip
                      label={portfolio.mode}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography>Last Update:</Typography>
                    <Typography variant="body2">
                      {formatDate(portfolio.lastUpdate)}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Performance Metrics
                  </Typography>
                  {stats && (
                    <>
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography>Win Rate:</Typography>
                        <Typography fontWeight="bold">
                          {formatPercentage(stats.winRate)}
                        </Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography>Winning Trades:</Typography>
                        <Typography fontWeight="bold">
                          {stats.winningTrades} / {stats.totalTrades}
                        </Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography>Active Sessions:</Typography>
                        <Typography fontWeight="bold">
                          {stats.activeSessions}
                        </Typography>
                      </Box>
                      {stats.lastTradeDate && (
                        <Box display="flex" justifyContent="space-between">
                          <Typography>Last Trade:</Typography>
                          <Typography variant="body2">
                            {formatDate(stats.lastTradeDate)}
                          </Typography>
                        </Box>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </TabPanel>

      {/* Session Details Dialog */}
      <Dialog
        open={sessionDetailsOpen}
        onClose={handleCloseSessionDetails}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Session Details - {selectedSession?.id}
        </DialogTitle>
        <DialogContent>
          {selectedSession && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Mode:</Typography>
                  <Chip label={selectedSession.mode} size="small" />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Status:</Typography>
                  <Chip
                    label={selectedSession.status}
                    size="small"
                    style={{ 
                      backgroundColor: getSessionStatusColor(selectedSession.status),
                      color: 'white'
                    }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Start Time:</Typography>
                  <Typography>{formatDate(selectedSession.start_time)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">End Time:</Typography>
                  <Typography>
                    {selectedSession.end_time ? formatDate(selectedSession.end_time) : 'Active'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Initial Cash:</Typography>
                  <Typography>{formatCurrency(selectedSession.initial_cash)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Final Cash:</Typography>
                  <Typography>
                    {selectedSession.final_cash ? formatCurrency(selectedSession.final_cash) : '-'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Total Trades:</Typography>
                  <Typography>{selectedSession.total_trades}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Winning Trades:</Typography>
                  <Typography>{selectedSession.winning_trades}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Total P&L:</Typography>
                  <Typography
                    variant="h6"
                    color={selectedSession.total_pnl && selectedSession.total_pnl >= 0 ? 'success.main' : 'error.main'}
                    fontWeight="bold"
                  >
                    {selectedSession.total_pnl ? formatCurrency(selectedSession.total_pnl) : '-'}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSessionDetails}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TradingResults;
