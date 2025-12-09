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
  AccountBalance,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { 
  TabPanel,
  StockSelectionSection,
  SessionSummary,
  BotSelector,
  UnifiedStrategy,
} from "../../components/shared";
import TradingSessionControls from "../Dashboard/TradingSessionControls";
import { useUser, useUserStrategies } from "../../hooks";
import { useCustomStrategies } from "../../hooks/useCustomStrategies/useCustomStrategies";

const TradingPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const { user, isLoading: userLoading, error: userError } = useUser();
  const { strategies: userStrategies, isLoading: userStrategiesLoading } = useUserStrategies(false); // Only active strategies
  const { strategies: customStrategies, isLoading: customStrategiesLoading } = useCustomStrategies(false); // Only active custom strategies

  // Trading session state
  const [selectedStocks, setSelectedStocks] = useState<string[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState<UnifiedStrategy | null>(null);
  const [strategyParameters, setStrategyParameters] = useState<Record<string, any>>({});
  const [activeSession, setActiveSession] = useState<any>(null);

  const strategiesLoading = userStrategiesLoading || customStrategiesLoading;

  // Update strategy parameters when strategy changes
  useEffect(() => {
    if (selectedStrategy) {
      if (selectedStrategy.type === 'user' && selectedStrategy.config) {
        setStrategyParameters(selectedStrategy.config);
      } else if (selectedStrategy.type === 'custom') {
        // For custom strategies, we need to pass buy_conditions and sell_conditions
        setStrategyParameters({
          buy_conditions: selectedStrategy.buy_conditions,
          sell_conditions: selectedStrategy.sell_conditions,
        });
      }
    }
  }, [selectedStrategy]);

  // Remove the allStrategies useMemo since BotSelector handles it

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleStocksChange = (stocks: string[]) => {
    setSelectedStocks(stocks);
  };

  const handleStrategySelect = (strategy: UnifiedStrategy) => {
    setSelectedStrategy(strategy);
  };

  const handleSessionStarted = (session: any) => {
    setActiveSession(session);
    setActiveTab(2); // Switch to session controls tab
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
          Run Bot
        </Typography>
        <Typography variant="subtitle1" color="textSecondary">
          Select stocks and a bot to start a live trading session. Create and manage bots in the Program Bot page.
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
                  label="Select a Bot"
                  id="trading-tab-1"
                  aria-controls="trading-tabpanel-1"
                />
                <Tab
                  icon={<AccountBalance />}
                  label="Session Controls"
                  id="trading-tab-2"
                  aria-controls="trading-tabpanel-2"
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
              <BotSelector
                userStrategies={userStrategies}
                customStrategies={customStrategies}
                isLoading={strategiesLoading}
                selectedStrategy={selectedStrategy}
                onStrategySelect={handleStrategySelect}
                title="Select Trading Bot"
                description="Choose one of your saved bots to use for live trading. All bot creation and editing happens in the Program Bot page."
                emptyStateTitle="No Bots Available"
                emptyStateMessage="You haven't created any trading bots yet. Create your first bot to start trading."
                emptyStateButtonLabel="Create Bot"
                onEmptyStateButtonClick={() => navigate('/strategies')}
                showActiveOnly={true}
              />
            </TabPanel>

            {/* Session Controls Tab */}
            <TabPanel value={activeTab} index={2}>
              <TradingSessionControls
                userId={Number(user.id)}
                selectedStocks={selectedStocks}
                selectedStrategy={selectedStrategy?.name || ''}
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
            selectedStrategy={selectedStrategy?.name || ''}
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

export default TradingPage;

