import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Tooltip
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Person as PersonIcon,
  Star as StarIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';
import { useSubscription, useUser } from '../../hooks';
import { LeaderboardGate } from '../../components/shared';

interface LeaderboardEntry {
  rank: number;
  username: string;
  strategyName: string;
  strategyType: string;
  totalReturn: number;
  winRate: number;
  totalTrades: number;
  maxDrawdown: number;
  sharpeRatio: number;
  lastUpdated: string;
}

// Mock leaderboard data - in production, this would come from an API
const generateMockLeaderboard = (count: number): LeaderboardEntry[] => {
  const strategyTypes = ['moving_average_crossover', 'momentum', 'mean_reversion', 'bollinger_bands', 'breakout'];
  const names = ['AlphaTrader', 'QuantMaster', 'SwingKing', 'TrendFollower', 'MomentumPro', 'ValueHunter', 'ScalpMaster', 'DayTrader', 'PatternPro', 'RiskManager'];
  
  return Array.from({ length: count }, (_, i) => ({
    rank: i + 1,
    username: names[i % names.length] + (Math.floor(i / names.length) || ''),
    strategyName: `Strategy ${i + 1}`,
    strategyType: strategyTypes[i % strategyTypes.length],
    totalReturn: Math.random() * 0.5 - 0.1 + (0.3 / (i + 1)), // Higher returns for top ranks
    winRate: 0.4 + Math.random() * 0.3,
    totalTrades: Math.floor(50 + Math.random() * 200),
    maxDrawdown: Math.random() * 0.2,
    sharpeRatio: 0.5 + Math.random() * 2,
    lastUpdated: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
  })).sort((a, b) => b.totalReturn - a.totalReturn).map((entry, i) => ({ ...entry, rank: i + 1 }));
};

const LeaderboardPage: React.FC = () => {
  const { user } = useUser();
  const { subscription } = useSubscription({ enabled: Boolean(user) });
  const [timeframe, setTimeframe] = useState('all');
  const [strategyFilter, setStrategyFilter] = useState('all');
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  const currentTier = subscription?.planTier || user?.plan_tier || 'FREE';
  const isFreeTier = currentTier === 'FREE';

  useEffect(() => {
    // Simulate API call
    setLoading(true);
    setTimeout(() => {
      setLeaderboard(generateMockLeaderboard(50));
      setLoading(false);
    }, 1000);
  }, [timeframe, strategyFilter]);

  const getStrategyTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      'moving_average_crossover': 'Moving Average',
      'bollinger_bands': 'Bollinger Bands',
      'mean_reversion': 'Mean Reversion',
      'momentum': 'Momentum',
      'breakout': 'Breakout'
    };
    return typeMap[type] || type;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'gold';
    if (rank === 2) return 'silver';
    if (rank === 3) return '#CD7F32'; // Bronze
    return 'grey.500';
  };

  const getRankIcon = (rank: number) => {
    if (rank <= 3) {
      return <TrophyIcon sx={{ color: getRankColor(rank), fontSize: 24 }} />;
    }
    return null;
  };

  const formatPercentage = (value: number) => {
    const percent = value * 100;
    return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  // Show upsell gate for free users
  if (isFreeTier) {
    return (
      <Box p={3}>
        <Box mb={4} textAlign="center">
          <Typography variant="h4" gutterBottom>
            <TrophyIcon sx={{ mr: 2, verticalAlign: 'middle', color: 'warning.main' }} />
            Leaderboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            See how top traders are performing
          </Typography>
        </Box>
        
        <LeaderboardGate currentTier={currentTier as any} />
      </Box>
    );
  }

  // Filter leaderboard based on selected strategy type
  const filteredLeaderboard = strategyFilter === 'all' 
    ? leaderboard 
    : leaderboard.filter(entry => entry.strategyType === strategyFilter);

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            <TrophyIcon sx={{ mr: 2, verticalAlign: 'middle', color: 'warning.main' }} />
            Leaderboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Top performing strategies ranked by total return
          </Typography>
        </Box>
        <Chip 
          label={`${currentTier} Member`} 
          color="primary" 
          icon={<StarIcon />}
        />
      </Box>

      {/* Top 3 Podium */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
        {leaderboard.slice(0, 3).map((entry) => (
          <Box key={entry.rank} sx={{ flex: '1 1 300px', maxWidth: { xs: '100%', md: 'calc(33.33% - 16px)' } }}>
            <Card 
              sx={{ 
                textAlign: 'center',
                border: '2px solid',
                borderColor: getRankColor(entry.rank),
                position: 'relative',
                overflow: 'visible',
                pt: 3,
                height: '100%'
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: -20,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  bgcolor: getRankColor(entry.rank),
                  borderRadius: '50%',
                  width: 40,
                  height: 40,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Typography variant="h6" color="white" fontWeight="bold">
                  {entry.rank}
                </Typography>
              </Box>
              <CardContent>
                <Avatar sx={{ width: 60, height: 60, mx: 'auto', mb: 2, bgcolor: 'primary.main' }}>
                  <PersonIcon sx={{ fontSize: 32 }} />
                </Avatar>
                <Typography variant="h6" gutterBottom>
                  {entry.username}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {entry.strategyName}
                </Typography>
                <Chip 
                  label={getStrategyTypeLabel(entry.strategyType)} 
                  size="small" 
                  sx={{ mb: 2 }}
                />
                <Typography 
                  variant="h4" 
                  color={entry.totalReturn >= 0 ? 'success.main' : 'error.main'}
                  fontWeight="bold"
                >
                  {formatPercentage(entry.totalReturn)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Total Return
                </Typography>
                <Box display="flex" justifyContent="center" gap={2} mt={2}>
                  <Box textAlign="center">
                    <Typography variant="body2" fontWeight="bold">
                      {(entry.winRate * 100).toFixed(0)}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Win Rate
                    </Typography>
                  </Box>
                  <Box textAlign="center">
                    <Typography variant="body2" fontWeight="bold">
                      {entry.sharpeRatio.toFixed(2)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Sharpe
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
            <Box sx={{ flex: '1 1 200px', maxWidth: { xs: '100%', md: 'calc(33.33% - 16px)' } }}>
              <FormControl fullWidth size="small">
                <InputLabel>Timeframe</InputLabel>
                <Select
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value)}
                  label="Timeframe"
                >
                  <MenuItem value="all">All Time</MenuItem>
                  <MenuItem value="month">This Month</MenuItem>
                  <MenuItem value="week">This Week</MenuItem>
                  <MenuItem value="day">Today</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ flex: '1 1 200px', maxWidth: { xs: '100%', md: 'calc(33.33% - 16px)' } }}>
              <FormControl fullWidth size="small">
                <InputLabel>Strategy Type</InputLabel>
                <Select
                  value={strategyFilter}
                  onChange={(e) => setStrategyFilter(e.target.value)}
                  label="Strategy Type"
                >
                  <MenuItem value="all">All Types</MenuItem>
                  <MenuItem value="moving_average_crossover">Moving Average</MenuItem>
                  <MenuItem value="momentum">Momentum</MenuItem>
                  <MenuItem value="mean_reversion">Mean Reversion</MenuItem>
                  <MenuItem value="bollinger_bands">Bollinger Bands</MenuItem>
                  <MenuItem value="breakout">Breakout</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ flex: '1 1 200px', maxWidth: { xs: '100%', md: 'calc(33.33% - 16px)' } }}>
              <Tabs 
                value={activeTab} 
                onChange={(_, v) => setActiveTab(v)}
                variant="fullWidth"
              >
                <Tab label="Returns" icon={<TrendingUpIcon />} iconPosition="start" />
                <Tab label="Win Rate" icon={<TimelineIcon />} iconPosition="start" />
              </Tabs>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Leaderboard Table */}
      {loading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                <TableCell width={80}>Rank</TableCell>
                <TableCell>Trader</TableCell>
                <TableCell>Strategy</TableCell>
                <TableCell align="right">Total Return</TableCell>
                <TableCell align="right">Win Rate</TableCell>
                <TableCell align="right">Trades</TableCell>
                <TableCell align="right">Max Drawdown</TableCell>
                <TableCell align="right">Sharpe Ratio</TableCell>
                <TableCell align="right">Updated</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredLeaderboard.map((entry) => (
                <TableRow 
                  key={entry.rank}
                  sx={{ 
                    '&:hover': { bgcolor: 'action.hover' },
                    bgcolor: entry.rank <= 3 ? 'warning.50' : 'inherit'
                  }}
                >
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      {getRankIcon(entry.rank)}
                      <Typography 
                        fontWeight={entry.rank <= 3 ? 'bold' : 'normal'}
                        color={entry.rank <= 10 ? 'primary.main' : 'text.primary'}
                      >
                        #{entry.rank}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.light' }}>
                        <PersonIcon fontSize="small" />
                      </Avatar>
                      <Typography variant="body2" fontWeight="medium">
                        {entry.username}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2">{entry.strategyName}</Typography>
                      <Chip 
                        label={getStrategyTypeLabel(entry.strategyType)} 
                        size="small" 
                        variant="outlined"
                        sx={{ mt: 0.5 }}
                      />
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Typography 
                      color={entry.totalReturn >= 0 ? 'success.main' : 'error.main'}
                      fontWeight="bold"
                    >
                      {entry.totalReturn >= 0 ? <TrendingUpIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} /> : <TrendingDownIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />}
                      {formatPercentage(entry.totalReturn)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography color={entry.winRate >= 0.5 ? 'success.main' : 'warning.main'}>
                      {(entry.winRate * 100).toFixed(1)}%
                    </Typography>
                  </TableCell>
                  <TableCell align="right">{entry.totalTrades}</TableCell>
                  <TableCell align="right">
                    <Typography color="error.main">
                      -{(entry.maxDrawdown * 100).toFixed(1)}%
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Risk-adjusted return metric">
                      <Typography color={entry.sharpeRatio >= 1 ? 'success.main' : 'text.primary'}>
                        {entry.sharpeRatio.toFixed(2)}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(entry.lastUpdated)}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Info Alert */}
      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="body2">
          Rankings are updated daily based on strategy performance. Only strategies with at least 10 trades are eligible for the leaderboard.
        </Typography>
      </Alert>
    </Box>
  );
};

export default LeaderboardPage;
