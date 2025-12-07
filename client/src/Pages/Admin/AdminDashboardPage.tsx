import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
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
  Button,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TablePagination,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Assessment,
  Timeline,
  Delete,
  Refresh,
  ExpandMore
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface StrategyPerformanceSummary {
  strategy_name: string;
  strategy_type: string;
  total_executions: number;
  avg_return: number;
  best_return: number;
  worst_return: number;
  avg_max_drawdown: number;
  avg_win_rate: number;
  avg_sharpe_ratio: number;
  total_trades: number;
  success_rate: number;
  last_execution: string;
}

interface PerformanceRecord {
  id: number;
  strategy_name: string;
  strategy_type: string;
  execution_type: 'BACKTEST' | 'LIVE_TRADING';
  total_return: number;
  win_rate: number;
  max_drawdown: number;
  total_trades: number;
  created_at: string;
  symbols: string | string[];
  start_date: string;
  end_date: string;
  initial_capital: number;
  final_capital: number;
  total_return_dollar: number;
  sharpe_ratio: number | null;
  sortino_ratio: number | null;
  volatility: number | null;
  beta: number | null;
  alpha: number | null;
  winning_trades: number;
  losing_trades: number;
  avg_win: number | null;
  avg_loss: number | null;
  profit_factor: number | null;
  largest_win: number | null;
  largest_loss: number | null;
}

interface AnalyticsData {
  timeframe: string;
  analytics: {
    totalExecutions: number;
    totalStrategies: number;
    avgReturn: number;
    bestReturn: number;
    worstReturn: number;
    avgWinRate: number;
    avgMaxDrawdown: number;
    totalTrades: number;
    profitableExecutions: number;
    successRate: number;
  };
  strategyBreakdown: Record<string, { count: number; avgReturn: number; totalReturn: number }>;
  recentTrends: Array<{
    date: string;
    strategy: string;
    return: number;
    winRate: number;
  }>;
}


const AdminDashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [summaries, setSummaries] = useState<StrategyPerformanceSummary[]>([]);
  const [recentExecutions, setRecentExecutions] = useState<PerformanceRecord[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<number | null>(null);
  const [timeframe, setTimeframe] = useState('30d');
  const [strategyTypeFilter, setStrategyTypeFilter] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchData();
  }, [timeframe, strategyTypeFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch overview data
      const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8001/api";
      const overviewResponse = await fetch(`${API_BASE}/admin/performance/overview`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (!overviewResponse.ok) {
        throw new Error('Failed to fetch overview data');
      }

      const overviewData = await overviewResponse.json();
      setSummaries(overviewData.data.summaries);
      setRecentExecutions(overviewData.data.recentExecutions);

      // Fetch analytics data
      const analyticsResponse = await fetch(`${API_BASE}/admin/performance/analytics?timeframe=${timeframe}&strategyType=${strategyTypeFilter}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json();
        setAnalytics(analyticsData.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRecord = async (id: number) => {
    try {
      const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8001/api";
      const response = await fetch(`${API_BASE}/admin/performance/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.ok) {
        await fetchData(); // Refresh data
        setDeleteDialogOpen(false);
        setRecordToDelete(null);
      } else {
        throw new Error('Failed to delete record');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete record');
    }
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleToggleRow = (executionId: number) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(executionId)) {
      newExpandedRows.delete(executionId);
    } else {
      newExpandedRows.add(executionId);
    }
    setExpandedRows(newExpandedRows);
  };

  const formatPercentage = (value: number) => `${(value * 100).toFixed(2)}%`;
  const formatCurrency = (value: number) => `$${value.toFixed(2)}`;
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString();

  const renderOverviewTab = () => {
    // Filter summaries based on strategy type filter
    const filteredSummaries = summaries.filter(summary => 
      !strategyTypeFilter || 
      summary.strategy_type.toLowerCase() === strategyTypeFilter.toLowerCase()
    );

    return (
      <Box>
        <Grid container spacing={3}>
          {/* Key Metrics Cards */}
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <Assessment color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Total Strategies</Typography>
                </Box>
                <Typography variant="h4">{filteredSummaries.length}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <TrendingUp color="success" sx={{ mr: 1 }} />
                  <Typography variant="h6">Avg Return</Typography>
                </Box>
                <Typography variant="h4" color="success.main">
                  {filteredSummaries.length > 0 ? formatPercentage(filteredSummaries.reduce((sum, s) => sum + s.avg_return, 0) / filteredSummaries.length) : '0%'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <Timeline color="info" sx={{ mr: 1 }} />
                  <Typography variant="h6">Total Executions</Typography>
                </Box>
                <Typography variant="h4">
                  {filteredSummaries.reduce((sum, s) => sum + s.total_executions, 0)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <TrendingDown color="error" sx={{ mr: 1 }} />
                  <Typography variant="h6">Avg Drawdown</Typography>
                </Box>
                <Typography variant="h4" color="error.main">
                  {filteredSummaries.length > 0 ? formatPercentage(filteredSummaries.reduce((sum, s) => sum + s.avg_max_drawdown, 0) / filteredSummaries.length) : '0%'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

        {/* Strategy Performance Table */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Strategy Performance Summary</Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Strategy</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Executions</TableCell>
                      <TableCell>Avg Return</TableCell>
                      <TableCell>Best Return</TableCell>
                      <TableCell>Avg Win Rate</TableCell>
                      <TableCell>Success Rate</TableCell>
                      <TableCell>Last Execution</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredSummaries.map((summary) => (
                      <TableRow key={summary.strategy_name}>
                        <TableCell>{summary.strategy_name}</TableCell>
                        <TableCell>
                          <Chip label={summary.strategy_type} size="small" />
                        </TableCell>
                        <TableCell>{summary.total_executions}</TableCell>
                        <TableCell>
                          <Typography color={summary.avg_return >= 0 ? 'success.main' : 'error.main'}>
                            {formatPercentage(summary.avg_return)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography color={summary.best_return >= 0 ? 'success.main' : 'error.main'}>
                            {formatPercentage(summary.best_return)}
                          </Typography>
                        </TableCell>
                        <TableCell>{formatPercentage(summary.avg_win_rate / 100)}</TableCell>
                        <TableCell>{formatPercentage(summary.success_rate / 100)}</TableCell>
                        <TableCell>{formatDate(summary.last_execution)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
    );
  };

  const renderAnalyticsTab = () => (
    <Box>
      {analytics && (
        <Grid container spacing={3}>
          {/* Analytics Cards */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6">Total Executions</Typography>
                <Typography variant="h4">{analytics.analytics.totalExecutions}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6">Success Rate</Typography>
                <Typography variant="h4" color="success.main">
                  {formatPercentage(analytics.analytics.successRate / 100)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6">Avg Return</Typography>
                <Typography variant="h4" color={analytics.analytics.avgReturn >= 0 ? 'success.main' : 'error.main'}>
                  {formatPercentage(analytics.analytics.avgReturn)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Strategy Breakdown Chart */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Strategy Performance Breakdown</Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={Object.entries(analytics.strategyBreakdown).map(([strategy, data]) => ({
                    strategy,
                    avgReturn: data.avgReturn * 100,
                    count: data.count
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="strategy" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      interval={0}
                    />
                    <YAxis />
                    <RechartsTooltip formatter={(value) => [`${value}%`, 'Avg Return']} />
                    <Bar dataKey="avgReturn" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Recent Trends Chart */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Recent Performance Trends</Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics.recentTrends.slice(-20)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <RechartsTooltip />
                    <Line type="monotone" dataKey="return" stroke="#8884d8" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );

  const renderRecentExecutionsTab = () => (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Recent Executions</Typography>
            <Box>
              <Button
                startIcon={<Refresh />}
                onClick={fetchData}
                disabled={loading}
              >
                Refresh
              </Button>
            </Box>
          </Box>
              <Box>
                {/* Column Headers */}
                <Box 
                  display="flex" 
                  alignItems="center" 
                  sx={{ 
                    p: '16px 24px', // Match AccordionSummary padding
                    borderBottom: '1px solid #e0e0e0',
                    backgroundColor: '#f5f5f5',
                    fontWeight: 'bold',
                    fontSize: '0.875rem',
                    minHeight: '48px' // Match AccordionSummary height
                  }}
                >
                  <Box flex="1" display="flex" alignItems="center" gap={2}>
                    <Typography variant="subtitle2" sx={{ minWidth: 120, fontWeight: 'bold' }}>
                      Strategy
                    </Typography>
                    <Typography variant="subtitle2" sx={{ minWidth: 80, fontWeight: 'bold' }}>
                      Type
                    </Typography>
                    <Typography variant="subtitle2" sx={{ minWidth: 80, fontWeight: 'bold' }}>
                      Execution
                    </Typography>
                    <Typography variant="subtitle2" sx={{ minWidth: 80, fontWeight: 'bold' }}>
                      Return
                    </Typography>
                    <Typography variant="subtitle2" sx={{ minWidth: 80, fontWeight: 'bold' }}>
                      Win Rate
                    </Typography>
                    <Typography variant="subtitle2" sx={{ minWidth: 80, fontWeight: 'bold' }}>
                      Max Drawdown
                    </Typography>
                    <Typography variant="subtitle2" sx={{ minWidth: 60, fontWeight: 'bold' }}>
                      Trades
                    </Typography>
                    <Typography variant="subtitle2" sx={{ minWidth: 100, fontWeight: 'bold' }}>
                      Date
                    </Typography>
                  </Box>
                  <Box sx={{ minWidth: 60, textAlign: 'center', mr: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                      Actions
                    </Typography>
                  </Box>
                  <Box sx={{ width: 24 }} /> {/* Space for expand icon */}
                </Box>
                
                {recentExecutions
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((execution) => (
                    <Accordion 
                      key={execution.id}
                      expanded={expandedRows.has(execution.id)}
                      onChange={() => handleToggleRow(execution.id)}
                      sx={{ mb: 1 }}
                    >
                      <AccordionSummary expandIcon={<ExpandMore />}>
                        <Box display="flex" alignItems="center" width="100%">
                          <Box flex="1" display="flex" alignItems="center" gap={2}>
                            <Typography variant="subtitle1" sx={{ minWidth: 120 }}>
                              {execution.strategy_name}
                            </Typography>
                            <Chip 
                              label={execution.strategy_type} 
                              size="small" 
                              color={execution.strategy_type === 'BACKTEST' ? 'primary' : 'secondary'}
                            />
                            <Chip 
                              label={execution.execution_type} 
                              size="small" 
                              color={execution.execution_type === 'BACKTEST' ? 'default' : 'success'}
                            />
                            <Typography 
                              color={execution.total_return >= 0 ? 'success.main' : 'error.main'}
                              sx={{ minWidth: 80 }}
                            >
                              {formatPercentage(execution.total_return)}
                            </Typography>
                            <Typography sx={{ minWidth: 80 }}>
                              {formatPercentage(execution.win_rate / 100)}
                            </Typography>
                            <Typography color="error.main" sx={{ minWidth: 80 }}>
                              {formatPercentage(execution.max_drawdown)}
                            </Typography>
                            <Typography sx={{ minWidth: 60 }}>
                              {execution.total_trades}
                            </Typography>
                            <Typography sx={{ minWidth: 100 }}>
                              {formatDate(execution.created_at)}
                            </Typography>
                          </Box>
                          <Box>
                            <Tooltip title="Delete Record">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setRecordToDelete(execution.id);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Delete />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Box>
                          <Typography variant="h6" gutterBottom>
                            Execution Details
                          </Typography>
                          <Divider sx={{ mb: 2 }} />
                          <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                              <Typography variant="subtitle2" color="text.secondary">
                                Symbols
                              </Typography>
                              <Typography variant="body1" sx={{ mb: 1 }}>
                                {Array.isArray(execution.symbols) 
                                  ? execution.symbols.join(', ') 
                                  : execution.symbols}
                              </Typography>
                              
                              <Typography variant="subtitle2" color="text.secondary">
                                Time Period
                              </Typography>
                              <Typography variant="body1" sx={{ mb: 1 }}>
                                {execution.start_date} to {execution.end_date}
                              </Typography>
                              
                              <Typography variant="subtitle2" color="text.secondary">
                                Capital
                              </Typography>
                              <Typography variant="body1" sx={{ mb: 1 }}>
                                Initial: {formatCurrency(execution.initial_capital)} → Final: {formatCurrency(execution.final_capital)}
                              </Typography>
                              
                              <Typography variant="subtitle2" color="text.secondary">
                                Dollar Return
                              </Typography>
                              <Typography 
                                variant="body1" 
                                color={execution.total_return_dollar >= 0 ? 'success.main' : 'error.main'}
                                sx={{ mb: 1 }}
                              >
                                {formatCurrency(execution.total_return_dollar)}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} md={6}>
                              <Typography variant="subtitle2" color="text.secondary">
                                Risk Metrics
                              </Typography>
                              <Tooltip title="Measures risk-adjusted returns. Higher values indicate better risk-adjusted performance. Values above 1.0 are considered good, above 2.0 are excellent.">
                                <Typography variant="body1" sx={{ mb: 1, cursor: 'help' }}>
                                  Sharpe Ratio: {execution.sharpe_ratio ? execution.sharpe_ratio.toFixed(3) : 'N/A'}
                                </Typography>
                              </Tooltip>
                              <Tooltip title="Similar to Sharpe ratio but only considers downside volatility. Focuses on negative returns, making it more relevant for risk-averse investors.">
                                <Typography variant="body1" sx={{ mb: 1, cursor: 'help' }}>
                                  Sortino Ratio: {execution.sortino_ratio ? execution.sortino_ratio.toFixed(3) : 'N/A'}
                                </Typography>
                              </Tooltip>
                              <Tooltip title="Measures the degree of variation in returns over time. Higher volatility indicates more unpredictable price movements and higher risk.">
                                <Typography variant="body1" sx={{ mb: 1, cursor: 'help' }}>
                                  Volatility: {execution.volatility ? formatPercentage(execution.volatility) : 'N/A'}
                                </Typography>
                              </Tooltip>
                              <Tooltip title="Measures sensitivity to market movements. Beta of 1.0 moves with the market, >1.0 is more volatile, <1.0 is less volatile than the market.">
                                <Typography variant="body1" sx={{ mb: 1, cursor: 'help' }}>
                                  Beta: {execution.beta ? execution.beta.toFixed(3) : 'N/A'}
                                </Typography>
                              </Tooltip>
                              <Tooltip title="Measures excess returns relative to market performance. Positive alpha indicates outperformance, negative alpha indicates underperformance.">
                                <Typography variant="body1" sx={{ mb: 1, cursor: 'help' }}>
                                  Alpha: {execution.alpha ? execution.alpha.toFixed(3) : 'N/A'}
                                </Typography>
                              </Tooltip>
                              
                              <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
                                Trade Statistics
                              </Typography>
                              <Typography variant="body1" sx={{ mb: 1 }}>
                                Winning Trades: {execution.winning_trades}
                              </Typography>
                              <Typography variant="body1" sx={{ mb: 1 }}>
                                Losing Trades: {execution.losing_trades}
                              </Typography>
                              <Typography variant="body1" sx={{ mb: 1 }}>
                                Avg Win: {execution.avg_win ? formatCurrency(execution.avg_win) : 'N/A'}
                              </Typography>
                              <Typography variant="body1" sx={{ mb: 1 }}>
                                Avg Loss: {execution.avg_loss ? formatCurrency(execution.avg_loss) : 'N/A'}
                              </Typography>
                              <Typography variant="body1" sx={{ mb: 1 }}>
                                Profit Factor: {execution.profit_factor ? execution.profit_factor.toFixed(3) : 'N/A'}
                              </Typography>
                              <Typography variant="body1" sx={{ mb: 1 }}>
                                Largest Win: {execution.largest_win ? formatCurrency(execution.largest_win) : 'N/A'}
                              </Typography>
                              <Typography variant="body1" sx={{ mb: 1 }}>
                                Largest Loss: {execution.largest_loss ? formatCurrency(execution.largest_loss) : 'N/A'}
                              </Typography>
                            </Grid>
                          </Grid>
                        </Box>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25, 50]}
                  component="div"
                  count={recentExecutions.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  labelRowsPerPage="Rows per page:"
                  labelDisplayedRows={({ from, to, count }) => 
                    `${from}-${to} of ${count !== -1 ? count : `more than ${to}`}`
                  }
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Box display="flex" gap={2} mb={3}>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Timeframe</InputLabel>
          <Select
            value={timeframe}
            label="Timeframe"
            onChange={(e) => setTimeframe(e.target.value)}
          >
            <MenuItem value="7d">7 Days</MenuItem>
            <MenuItem value="30d">30 Days</MenuItem>
            <MenuItem value="90d">90 Days</MenuItem>
            <MenuItem value="1y">1 Year</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Strategy Type</InputLabel>
          <Select
            value={strategyTypeFilter}
            label="Strategy Type"
            onChange={(e) => setStrategyTypeFilter(e.target.value)}
          >
            <MenuItem value="">All Types</MenuItem>
            <MenuItem value="movingAverageCrossover">Moving Average Crossover</MenuItem>
            <MenuItem value="bollingerBands">Bollinger Bands</MenuItem>
            <MenuItem value="meanReversion">Mean Reversion</MenuItem>
            <MenuItem value="momentum">Momentum</MenuItem>
            <MenuItem value="breakout">Breakout</MenuItem>
            <MenuItem value="sentimentAnalysis">Sentiment Analysis</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'center' }}>
        <Tabs 
          value={activeTab} 
          onChange={(_e, newValue) => setActiveTab(newValue)}
          centered
          sx={{
            '& .MuiTab-root': {
              minWidth: 200, // Normalize width for all tabs
              maxWidth: 200,
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 500
            }
          }}
        >
          <Tab label="Overview" />
          <Tab label="Analytics" />
          <Tab label="Recent Executions" />
        </Tabs>
      </Box>

      {/* Tab Content */}
      <Box sx={{ 
        mt: 3, 
        maxWidth: '1200px', 
        margin: '24px auto 0', 
        px: 2 
      }}>
        {activeTab === 0 && renderOverviewTab()}
        {activeTab === 1 && renderAnalyticsTab()}
        {activeTab === 2 && renderRecentExecutionsTab()}
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Performance Record</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this performance record? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={() => recordToDelete && handleDeleteRecord(recordToDelete)}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminDashboardPage;
