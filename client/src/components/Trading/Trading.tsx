import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Alert,
  CircularProgress,
} from "@mui/material";
import {
  TrendingUp,
  Settings,
  Tune,
  AccountBalance,
} from "@mui/icons-material";
import { 
  TabPanel,
  StockSelectionSection,
  StrategySelectionSection,
  SessionSummary
} from "../shared";
import TradingSessionControls from "../Dashboard/TradingSessionControls";
import StrategyParameters from "../Dashboard/StrategyParameters";
import { useUser } from "../../hooks";

const Trading: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const { user, isLoading: userLoading, error: userError } = useUser();

  // Trading session state
  const [selectedStocks, setSelectedStocks] = useState<string[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState<string>("MovingAverage");
  const [strategyParameters, setStrategyParameters] = useState<Record<string, any>>({});
  const [activeSession, setActiveSession] = useState<any>(null);

  // Reset strategy parameters when strategy changes
  useEffect(() => {
    const defaultParams: Record<string, any> = {};
    
    switch (selectedStrategy) {
      case 'sentimentAnalysis':
      case 'SentimentAnalysis':
        defaultParams.lookbackDays = 3;
        defaultParams.pollIntervalMinutes = 0;
        defaultParams.minArticles = 2;
        defaultParams.buyThreshold = 0.4;
        defaultParams.sellThreshold = -0.4;
        defaultParams.titleWeight = 2.0;
        defaultParams.recencyHalfLifeHours = 12;
        break;
      case 'meanReversion':
      case 'MeanReversion':
        defaultParams.window = 20;
        defaultParams.threshold = 0.05;
        break;
      case 'movingAverage':
      case 'MovingAverage':
        defaultParams.shortWindow = 5;
        defaultParams.longWindow = 10;
        break;
      case 'movingAverageCrossover':
        defaultParams.fastWindow = 10;
        defaultParams.slowWindow = 30;
        defaultParams.maType = 'SMA';
        break;
      case 'momentum':
      case 'Momentum':
        defaultParams.rsiWindow = 14;
        defaultParams.rsiOverbought = 70;
        defaultParams.rsiOversold = 30;
        break;
      case 'bollingerBands':
      case 'BollingerBands':
        defaultParams.window = 20;
        defaultParams.multiplier = 2.0;
        break;
      case 'breakout':
      case 'Breakout':
        defaultParams.lookbackWindow = 20;
        defaultParams.breakoutThreshold = 0.01;
        break;
      default:
        break;
    }
    
    setStrategyParameters(defaultParams);
  }, [selectedStrategy]);

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
    setActiveTab(3); // Switch to session controls tab
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
          Trading
        </Typography>
        <Typography variant="subtitle1" color="textSecondary">
          Create and manage your trading sessions. Configure stocks, strategies, and parameters to start trading.
        </Typography>
      </Box>

      {/* Main Content */}
      <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', lg: 'row' } }}>
        {/* Main Content Area */}
        <Box sx={{ flex: 2 }}>
          <Paper sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={activeTab} onChange={handleTabChange} aria-label="trading tabs">
                <Tab
                  icon={<TrendingUp />}
                  label="Stock Selection"
                  id="trading-tab-0"
                  aria-controls="trading-tabpanel-0"
                />
                <Tab
                  icon={<Settings />}
                  label="Strategy Selection"
                  id="trading-tab-1"
                  aria-controls="trading-tabpanel-1"
                />
                <Tab
                  icon={<Tune />}
                  label="Strategy Parameters"
                  id="trading-tab-2"
                  aria-controls="trading-tabpanel-2"
                />
                <Tab
                  icon={<AccountBalance />}
                  label="Session Controls"
                  id="trading-tab-3"
                  aria-controls="trading-tabpanel-3"
                />
              </Tabs>
            </Box>

            {/* Stock Selection Tab */}
            <TabPanel value={activeTab} index={0}>
              <StockSelectionSection
                selectedStocks={selectedStocks}
                onStocksChange={handleStocksChange}
                maxStocks={10}
                title="Select Stocks to Trade"
                description="Choose up to 10 stocks for your trading session. You can search for specific symbols or select from popular options."
                showSummary={false}
              />
            </TabPanel>

            {/* Strategy Selection Tab */}
            <TabPanel value={activeTab} index={1}>
              <StrategySelectionSection
                selectedStrategy={selectedStrategy}
                onStrategyChange={handleStrategyChange}
                onParametersChange={handleParametersChange}
                strategyParameters={strategyParameters}
                title="Select Trading Strategy"
                description="Choose a trading strategy for live trading. You can select from basic strategies or public strategies shared by other users."
                showSummary={false}
              />
            </TabPanel>

            {/* Strategy Parameters Tab */}
            <TabPanel value={activeTab} index={2}>
              <StrategyParameters
                selectedStrategy={selectedStrategy}
                strategyParameters={strategyParameters}
                onParametersChange={handleParametersChange}
              />
            </TabPanel>

            {/* Session Controls Tab */}
            <TabPanel value={activeTab} index={3}>
              <TradingSessionControls
                userId={Number(user.id)}
                selectedStocks={selectedStocks}
                selectedStrategy={selectedStrategy}
                strategyParameters={strategyParameters}
                onSessionStarted={handleSessionStarted}
                onSessionStopped={handleSessionStopped}
              />
            </TabPanel>
          </Paper>
        </Box>

        {/* Persistent Sidebar */}
        <Box sx={{ flex: 1, minWidth: 300 }}>
          <SessionSummary
            title="Trading Session"
            selectedStocks={selectedStocks}
            selectedStrategy={selectedStrategy}
            strategyParameters={strategyParameters}
            mode="trading"
            maxStocks={10}
          />
          {activeSession && (
            <Paper sx={{ p: 2, height: 'fit-content', mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                Active Session
              </Typography>
              <Box>
                <Typography variant="body2" color="textSecondary" paragraph>
                  Session running in {activeSession.mode} mode.
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
            </Paper>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default Trading;
