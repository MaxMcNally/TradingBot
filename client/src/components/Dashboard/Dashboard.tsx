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
import { TabPanel } from "../shared";
import { useUser } from "../../hooks";


const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const { user, isLoading: userLoading, error: userError } = useUser();

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  if (userLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (userError) {
    return (
      <Alert severity="error">
        {userError.message}
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
                  12
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
                <Typography variant="h4" color="success.main">
                  +$2,450
                </Typography>
              </Box>
              <TrendingUp color="success" sx={{ fontSize: 40 }} />
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
                  68%
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
                  2
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
              <Box p={3}>
                <Typography variant="h6" gutterBottom>
                  Portfolio Overview
                </Typography>
                <Typography variant="body2" color="textSecondary" paragraph>
                  Your current portfolio holdings and performance metrics will be displayed here.
                </Typography>
                <Alert severity="info">
                  Portfolio tracking features are coming soon. This will show your current holdings, 
                  asset allocation, and real-time portfolio value.
                </Alert>
              </Box>
            </TabPanel>

            {/* Performance Metrics Tab */}
            <TabPanel value={activeTab} index={2}>
              <Box p={3}>
                <Typography variant="h6" gutterBottom>
                  Performance Metrics
                </Typography>
                <Typography variant="body2" color="textSecondary" paragraph>
                  Detailed performance analytics and trading statistics will be displayed here.
                </Typography>
                <Alert severity="info">
                  Advanced performance metrics including Sharpe ratio, maximum drawdown, 
                  and risk-adjusted returns are coming soon.
                </Alert>
              </Box>
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
                <Typography variant="body2" fontWeight="bold">12</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Total P&L:</Typography>
                <Typography variant="body2" fontWeight="bold" color="success.main">
                  +$2,450
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Win Rate:</Typography>
                <Typography variant="body2" fontWeight="bold">68%</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2">Active Sessions:</Typography>
                <Typography variant="body2" fontWeight="bold">2</Typography>
              </Box>
            </Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;
