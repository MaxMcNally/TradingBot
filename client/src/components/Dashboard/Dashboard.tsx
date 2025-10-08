import React, { useState } from "react";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Alert,
  CircularProgress,
  Card,
  CardContent,
} from "@mui/material";
import {
  Assessment,
  AccountBalance,
  TrendingUp,
  ShowChart,
} from "@mui/icons-material";
import TradingResults from "./TradingResults";
import PortfolioOverview from "./PortfolioOverview";
import PerformanceMetrics from "./PerformanceMetrics";
import { TabPanel } from "../shared";
import { useUser } from "../../hooks";
import { useTradingStats } from "../../hooks/useTrading/useTrading";
import { formatCurrency, formatPercentage } from "../../api/tradingApi";


const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const { user, isLoading: userLoading, error: userError } = useUser();
  const { stats, isLoading: statsLoading, isError: statsError } = useTradingStats(Number(user?.id));

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  if (userLoading || statsLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (userError || statsError) {
    return (
      <Alert severity="error">
        {userError?.message || 'Failed to load trading statistics'}
      </Alert>
    );
  }

  if (!user) {
    return (
      <Alert severity="warning">
        No user data available. Please log in again.
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box mb={3}>
        <Typography variant="h4" component="h1" gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="subtitle1" color="textSecondary">
          Welcome back, {user.name || 'User'}! Monitor your portfolio performance and trading results.
        </Typography>
      </Box>

      {/* Quick Stats Cards */}
      <Box 
        sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
          gap: 3,
          mb: 3 
        }}
      >
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Total Sessions
                </Typography>
                <Typography variant="h4">
                  {stats?.totalTrades || 0}
                </Typography>
              </Box>
              <AccountBalance color="primary" sx={{ fontSize: 40 }} />
            </Box>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Total P&L
                </Typography>
                <Typography 
                  variant="h4" 
                  color={stats?.totalPnL && stats.totalPnL >= 0 ? "success.main" : "error.main"}
                >
                  {stats?.totalPnL ? formatCurrency(stats.totalPnL) : formatCurrency(0)}
                </Typography>
              </Box>
              <TrendingUp 
                color={stats?.totalPnL && stats.totalPnL >= 0 ? "success" : "error"} 
                sx={{ fontSize: 40 }} 
              />
            </Box>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Win Rate
                </Typography>
                <Typography variant="h4">
                  {stats?.winRate ? formatPercentage(stats.winRate) : formatPercentage(0)}
                </Typography>
              </Box>
              <ShowChart color="primary" sx={{ fontSize: 40 }} />
            </Box>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Active Sessions
                </Typography>
                <Typography variant="h4">
                  {stats?.activeSessions || 0}
                </Typography>
              </Box>
              <Assessment color="warning" sx={{ fontSize: 40 }} />
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Main Content */}
      <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', lg: 'row' } }}>
        {/* Main Content Area */}
        <Box sx={{ flex: 2 }}>
          <Paper sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={activeTab} onChange={handleTabChange} aria-label="dashboard tabs">
                <Tab
                  icon={<Assessment />}
                  label="Trading Results"
                  id="dashboard-tab-0"
                  aria-controls="dashboard-tabpanel-0"
                />
                <Tab
                  icon={<TrendingUp />}
                  label="Portfolio Overview"
                  id="dashboard-tab-1"
                  aria-controls="dashboard-tabpanel-1"
                />
                <Tab
                  icon={<ShowChart />}
                  label="Performance Metrics"
                  id="dashboard-tab-2"
                  aria-controls="dashboard-tabpanel-2"
                />
              </Tabs>
            </Box>

            {/* Trading Results Tab */}
            <TabPanel value={activeTab} index={0}>
              <TradingResults userId={Number(user.id)} />
            </TabPanel>

            {/* Portfolio Overview Tab */}
            <TabPanel value={activeTab} index={1}>
              <PortfolioOverview userId={Number(user.id)} />
            </TabPanel>

            {/* Performance Metrics Tab */}
            <TabPanel value={activeTab} index={2}>
              <PerformanceMetrics userId={Number(user.id)} />
            </TabPanel>
          </Paper>
        </Box>

        {/* Persistent Sidebar */}
        <Box sx={{ flex: 1, minWidth: 300 }}>
          <Paper sx={{ p: 2, height: 'fit-content' }}>
            <Typography variant="h6" gutterBottom>
              Dashboard Overview
            </Typography>
            <Typography variant="body2" color="textSecondary" paragraph>
              Monitor your trading performance and portfolio metrics.
            </Typography>
            
            <Box mt={2}>
              <Typography variant="subtitle2" gutterBottom>
                Quick Stats:
              </Typography>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Total Sessions:</Typography>
                <Typography variant="body2" fontWeight="bold">{stats?.totalTrades || 0}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Total P&L:</Typography>
                <Typography 
                  variant="body2" 
                  fontWeight="bold" 
                  color={stats?.totalPnL && stats.totalPnL >= 0 ? "success.main" : "error.main"}
                >
                  {stats?.totalPnL ? formatCurrency(stats.totalPnL) : formatCurrency(0)}
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Win Rate:</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {stats?.winRate ? formatPercentage(stats.winRate) : formatPercentage(0)}
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2">Active Sessions:</Typography>
                <Typography variant="body2" fontWeight="bold">{stats?.activeSessions || 0}</Typography>
              </Box>
            </Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;
