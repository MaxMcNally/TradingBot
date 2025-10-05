import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Tabs,
  Tab,
  Paper,
  Alert,
  CircularProgress,
} from "@mui/material";
import {
  TrendingUp,
  Settings,
  Assessment,
  AccountBalance,
} from "@mui/icons-material";
import TradingResults from "./TradingResults";
import { StockPicker, StrategySelector } from "../shared";
import TradingSessionControls from "./TradingSessionControls";
import { useUser } from "../../hooks";

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
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const { user, isLoading: userLoading, error: userError } = useUser();

  // Trading session state
  const [selectedStocks, setSelectedStocks] = useState<string[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState<string>("MovingAverage");
  const [strategyParameters, setStrategyParameters] = useState<Record<string, any>>({
    shortWindow: 5,
    longWindow: 10,
  });
  const [activeSession, setActiveSession] = useState<any>(null);


  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleStocksChange = (stocks: string[]) => {
    setSelectedStocks(stocks);
  };

  const handleStrategyChange = (strategy: string) => {
    setSelectedStrategy(strategy);
  };

  const handleParametersChange = (parameters: Record<string, any>) => {
    setStrategyParameters(parameters);
  };

  const handleSessionStarted = (session: any) => {
    setActiveSession(session);
    setActiveTab(0); // Switch to results tab
  };

  const handleSessionStopped = () => {
    setActiveSession(null);
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
          Trading Dashboard
        </Typography>
        <Typography variant="subtitle1" color="textSecondary">
          Welcome back, {user.name || user.username}! Manage your trading sessions and monitor performance.
        </Typography>
      </Box>

      {/* Main Content */}
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
              label="Stock Selection"
              id="dashboard-tab-1"
              aria-controls="dashboard-tabpanel-1"
            />
            <Tab
              icon={<Settings />}
              label="Strategy Configuration"
              id="dashboard-tab-2"
              aria-controls="dashboard-tabpanel-2"
            />
            <Tab
              icon={<AccountBalance />}
              label="Session Controls"
              id="dashboard-tab-3"
              aria-controls="dashboard-tabpanel-3"
            />
          </Tabs>
        </Box>

        {/* Trading Results Tab */}
        <TabPanel value={activeTab} index={0}>
          <TradingResults userId={Number(user.id)} />
        </TabPanel>

        {/* Stock Selection Tab */}
        <TabPanel value={activeTab} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} lg={8}>
              <StockPicker
                selectedStocks={selectedStocks}
                onStocksChange={handleStocksChange}
                maxStocks={10}
              />
            </Grid>
            <Grid item xs={12} lg={4}>
              <Paper sx={{ p: 2, height: 'fit-content' }}>
                <Typography variant="h6" gutterBottom>
                  Selection Summary
                </Typography>
                <Typography variant="body2" color="textSecondary" paragraph>
                  You have selected {selectedStocks.length} stocks for trading.
                </Typography>
                {selectedStocks.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Selected Stocks:
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={1}>
                      {selectedStocks.map((stock) => (
                        <Box
                          key={stock}
                          sx={{
                            px: 1,
                            py: 0.5,
                            bgcolor: 'primary.main',
                            color: 'primary.contrastText',
                            borderRadius: 1,
                            fontSize: '0.875rem',
                          }}
                        >
                          {stock}
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Strategy Configuration Tab */}
        <TabPanel value={activeTab} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12} lg={8}>
              <StrategySelector
                selectedStrategy={selectedStrategy}
                onStrategyChange={handleStrategyChange}
                strategyParameters={strategyParameters}
                onParametersChange={handleParametersChange}
              />
            </Grid>
            <Grid item xs={12} lg={4}>
              <Paper sx={{ p: 2, height: 'fit-content' }}>
                <Typography variant="h6" gutterBottom>
                  Strategy Summary
                </Typography>
                <Typography variant="body2" color="textSecondary" paragraph>
                  Current strategy: <strong>{selectedStrategy}</strong>
                </Typography>
                <Typography variant="subtitle2" gutterBottom>
                  Parameters:
                </Typography>
                {Object.entries(strategyParameters).map(([key, value]) => (
                  <Box key={key} display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">{key}:</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {value}
                    </Typography>
                  </Box>
                ))}
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Session Controls Tab */}
        <TabPanel value={activeTab} index={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} lg={8}>
              <TradingSessionControls
                userId={Number(user.id)}
                selectedStocks={selectedStocks}
                selectedStrategy={selectedStrategy}
                strategyParameters={strategyParameters}
                onSessionStarted={handleSessionStarted}
                onSessionStopped={handleSessionStopped}
              />
            </Grid>
            <Grid item xs={12} lg={4}>
              <Paper sx={{ p: 2, height: 'fit-content' }}>
                <Typography variant="h6" gutterBottom>
                  Session Status
                </Typography>
                {activeSession ? (
                  <Box>
                    <Typography variant="body2" color="textSecondary" paragraph>
                      Active session running in {activeSession.mode} mode.
                    </Typography>
                    <Typography variant="subtitle2" gutterBottom>
                      Session Details:
                    </Typography>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2">ID:</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        #{activeSession.id}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2">Trades:</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {activeSession.total_trades}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2">P&L:</Typography>
                      <Typography
                        variant="body2"
                        fontWeight="bold"
                        color={activeSession.total_pnl >= 0 ? 'success.main' : 'error.main'}
                      >
                        ${activeSession.total_pnl?.toFixed(2) || '0.00'}
                      </Typography>
                    </Box>
                  </Box>
                ) : (
                  <Typography variant="body2" color="textSecondary">
                    No active trading session. Configure your settings and start a new session.
                  </Typography>
                )}
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default Dashboard;
