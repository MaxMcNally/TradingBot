import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tabs,
  Tab,
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
} from '@mui/material';
import {
  Edit,
  Assessment,
  Timeline,
  TrendingUp,
  Close,
} from '@mui/icons-material';
import { BotCard, UnifiedStrategy } from '../../components/shared';
import { useUserStrategies } from '../../hooks/useUserStrategies/useUserStrategies';
import { useCustomStrategies } from '../../hooks/useCustomStrategies/useCustomStrategies';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../hooks';
import { TabPanel } from '../../components/shared';
import { 
  formatCurrency, 
  formatPercentage, 
  formatDate,
  getSessionStatusColor,
  TradingSession,
  getTradesBySession,
  Trade,
} from '../../api/tradingApi';
import { useTradingSessions } from '../../hooks';
import type { StrategyPerformanceData } from '../../api';
import { getStrategyPerformance } from '../../api';

interface BotDetailsProps {
  bot: UnifiedStrategy;
  onClose: () => void;
  userId: number;
}

const BotDetails: React.FC<BotDetailsProps> = ({ bot, onClose, userId }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [testSessions, setTestSessions] = useState<StrategyPerformanceData[]>([]);
  const [tradingSessions, setTradingSessions] = useState<TradingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const { sessions } = useTradingSessions(userId, 100);

  React.useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Filter trading sessions by strategy name
        const botSessions = sessions.filter(s => 
          s.strategy === bot.name || 
          (bot.type === 'user' && bot.original && 'strategy_type' in bot.original && bot.original.strategy_type === s.strategy)
        );
        setTradingSessions(botSessions);

        // Load test sessions (backtest results) from strategy_performance table
        try {
          const response = await getStrategyPerformance(bot.name, 100);
          if (response.data.success && response.data.data && response.data.data.performances) {
            // Filter for backtest results only
            const backtests = response.data.data.performances.filter(
              (p: StrategyPerformanceData) => 
                p.execution_type === 'backtest' || 
                p.execution_type === 'BACKTEST' ||
                (p as any).execution_type === 'backtest'
            );
            setTestSessions(backtests);
          }
        } catch (error) {
          console.error('Error loading test sessions:', error);
          // If admin endpoint fails, try user endpoint (if available)
        }
      } catch (error) {
        console.error('Error loading bot details:', error);
      } finally {
        setLoading(false);
      }
    };

    if (bot) {
      loadData();
    }
  }, [bot, sessions, userId]);

  // Calculate accumulated stats
  const accumulatedStats = React.useMemo(() => {
    const allSessions = [...tradingSessions];
    const totalTrades = allSessions.reduce((sum, s) => sum + (s.total_trades || 0), 0);
    const winningTrades = allSessions.reduce((sum, s) => sum + (s.winning_trades || 0), 0);
    const totalPnL = allSessions.reduce((sum, s) => sum + (s.total_pnl || 0), 0);
    const activeSessions = allSessions.filter(s => s.status === 'ACTIVE').length;
    
    // Calculate from test sessions
    const testTotalReturn = testSessions.reduce((sum, s) => sum + (s.total_return || 0), 0);
    const testTrades = testSessions.reduce((sum, s) => sum + (s.total_trades || 0), 0);
    const testWins = testSessions.reduce((sum, s) => sum + (s.winning_trades || 0), 0);

    return {
      totalSessions: allSessions.length + testSessions.length,
      activeSessions,
      totalTrades: totalTrades + testTrades,
      winningTrades: winningTrades + testWins,
      winRate: (totalTrades + testTrades) > 0 
        ? ((winningTrades + testWins) / (totalTrades + testTrades)) * 100 
        : 0,
      totalPnL,
      testTotalReturn,
    };
  }, [tradingSessions, testSessions]);

  return (
    <Dialog open={true} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            {bot.name} - Details
          </Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        {loading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : (
          <Box>
            {/* Accumulated Stats */}
            <Box mb={3}>
              <Typography variant="h6" gutterBottom>
                Accumulated Statistics
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="body2" color="textSecondary">
                        Total Sessions
                      </Typography>
                      <Typography variant="h6">
                        {accumulatedStats.totalSessions}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="body2" color="textSecondary">
                        Active Sessions
                      </Typography>
                      <Typography variant="h6" color="success.main">
                        {accumulatedStats.activeSessions}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="body2" color="textSecondary">
                        Total Trades
                      </Typography>
                      <Typography variant="h6">
                        {accumulatedStats.totalTrades}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="body2" color="textSecondary">
                        Win Rate
                      </Typography>
                      <Typography variant="h6">
                        {formatPercentage(accumulatedStats.winRate / 100)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                {accumulatedStats.totalPnL !== 0 && (
                  <Grid item xs={6} sm={3}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="body2" color="textSecondary">
                          Total P&L
                        </Typography>
                        <Typography 
                          variant="h6"
                          color={accumulatedStats.totalPnL >= 0 ? 'success.main' : 'error.main'}
                        >
                          {formatCurrency(accumulatedStats.totalPnL)}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
                {accumulatedStats.testTotalReturn !== 0 && (
                  <Grid item xs={6} sm={3}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="body2" color="textSecondary">
                          Test Return
                        </Typography>
                        <Typography 
                          variant="h6"
                          color={accumulatedStats.testTotalReturn >= 0 ? 'success.main' : 'error.main'}
                        >
                          {formatPercentage(accumulatedStats.testTotalReturn)}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
              </Grid>
            </Box>

            {/* Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
                <Tab label="Test Sessions" icon={<Assessment />} />
                <Tab label="Trading Sessions" icon={<Timeline />} />
              </Tabs>
            </Box>

            {/* Test Sessions Tab */}
            <TabPanel value={activeTab} index={0}>
              {testSessions.length > 0 ? (
                <TableContainer component={Paper} sx={{ mt: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Symbols</TableCell>
                        <TableCell>Total Return</TableCell>
                        <TableCell>Win Rate</TableCell>
                        <TableCell>Trades</TableCell>
                        <TableCell>Max Drawdown</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {testSessions.map((session) => (
                        <TableRow key={session.id}>
                          <TableCell>{formatDate(session.start_date)}</TableCell>
                          <TableCell>
                            {Array.isArray(session.symbols) 
                              ? session.symbols.join(', ')
                              : typeof session.symbols === 'string'
                              ? session.symbols
                              : '-'}
                          </TableCell>
                          <TableCell>
                            <Typography
                              variant="body2"
                              color={session.total_return >= 0 ? 'success.main' : 'error.main'}
                              fontWeight="bold"
                            >
                              {formatPercentage(session.total_return)}
                            </Typography>
                          </TableCell>
                          <TableCell>{formatPercentage(session.win_rate || 0)}</TableCell>
                          <TableCell>{session.total_trades || 0}</TableCell>
                          <TableCell>
                            <Typography variant="body2" color="error.main">
                              {formatPercentage(session.max_drawdown || 0)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Alert severity="info" sx={{ mt: 2 }}>
                  No test sessions found for this bot. Run a backtest to see results here.
                </Alert>
              )}
            </TabPanel>

            {/* Trading Sessions Tab */}
            <TabPanel value={activeTab} index={1}>
              {tradingSessions.length > 0 ? (
                <TableContainer component={Paper} sx={{ mt: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Session ID</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Mode</TableCell>
                        <TableCell>Start Time</TableCell>
                        <TableCell>Trades</TableCell>
                        <TableCell>P&L</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {tradingSessions.map((session) => (
                        <TableRow key={session.id}>
                          <TableCell>{session.id}</TableCell>
                          <TableCell>
                            <Chip
                              label={session.status}
                              size="small"
                              style={{
                                backgroundColor: getSessionStatusColor(session.status),
                                color: 'white',
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip label={session.mode} size="small" variant="outlined" />
                          </TableCell>
                          <TableCell>{formatDate(session.start_time)}</TableCell>
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
                              <IconButton size="small">
                                <Timeline fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Alert severity="info" sx={{ mt: 2 }}>
                  No trading sessions found for this bot. Start a trading session to see results here.
                </Alert>
              )}
            </TabPanel>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

const MyBots: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const userId = user?.id ? parseInt(user.id) : 0;
  const { strategies: userStrategies, isLoading: userStrategiesLoading } = useUserStrategies(false);
  const { strategies: customStrategies, isLoading: customStrategiesLoading } = useCustomStrategies(false);
  const [selectedBot, setSelectedBot] = useState<UnifiedStrategy | null>(null);

  // Combine strategies into unified format
  const allBots: UnifiedStrategy[] = React.useMemo(() => {
    const user: UnifiedStrategy[] = (userStrategies || []).map(s => ({
      id: s.id,
      name: s.name,
      description: s.description,
      type: 'user' as const,
      strategy_type: s.strategy_type,
      is_active: s.is_active,
      is_public: s.is_public,
      avatar: s.avatar,
      config: s.config,
      original: s,
    }));

    const custom: UnifiedStrategy[] = (customStrategies || []).map(s => ({
      id: s.id,
      name: s.name,
      description: s.description,
      type: 'custom' as const,
      is_active: s.is_active,
      is_public: s.is_public,
      avatar: s.avatar,
      buy_conditions: s.buy_conditions,
      sell_conditions: s.sell_conditions,
      original: s,
    }));

    return [...user, ...custom];
  }, [userStrategies, customStrategies]);

  const isLoading = userStrategiesLoading || customStrategiesLoading;

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (allBots.length === 0) {
    return (
      <Box p={3}>
        <Alert severity="info">
          <Typography variant="h6" gutterBottom>
            No Bots Found
          </Typography>
          <Typography variant="body2" paragraph>
            You haven't created any trading bots yet. Create your first bot in the Program Bot page.
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/strategies')}
            startIcon={<Edit />}
          >
            Create Bot
          </Button>
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">
          My Bots
        </Typography>
        <Button
          variant="contained"
          startIcon={<Edit />}
          onClick={() => navigate('/strategies')}
        >
          Create New Bot
        </Button>
      </Box>

      <Grid container spacing={3}>
        {allBots.map((bot) => (
          <Grid item xs={12} sm={6} md={4} key={`${bot.type}-${bot.id}`}>
            <BotCard
              bot={bot}
              onClick={() => setSelectedBot(bot)}
              onEdit={() => navigate('/strategies')}
            />
          </Grid>
        ))}
      </Grid>

      {selectedBot && (
        <BotDetails
          bot={selectedBot}
          onClose={() => setSelectedBot(null)}
          userId={userId}
        />
      )}
    </Box>
  );
};

export default MyBots;

