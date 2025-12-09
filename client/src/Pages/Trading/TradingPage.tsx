import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Alert,
  CircularProgress,
  Button,
  Card,
  CardContent,
  CardActionArea,
  Chip,
  Stack,
} from "@mui/material";
import {
  TrendingUp,
  Settings,
  AccountBalance,
  Add,
  Psychology,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { 
  TabPanel,
  StockSelectionSection,
  SessionSummary,
} from "../../components/shared";
import TradingSessionControls from "../Dashboard/TradingSessionControls";
import { useUser, useUserStrategies } from "../../hooks";
import { useCustomStrategies } from "../../hooks/useCustomStrategies/useCustomStrategies";
import { UserStrategy } from "../../api";
import { CustomStrategy } from "../../api/customStrategiesApi";

// Unified strategy type for display
type UnifiedStrategy = {
  id: number;
  name: string;
  description?: string;
  type: 'user' | 'custom';
  strategy_type?: string; // For user strategies
  is_active: boolean;
  is_public?: boolean;
  config?: any; // For user strategies
  buy_conditions?: any; // For custom strategies
  sell_conditions?: any; // For custom strategies
  original: UserStrategy | CustomStrategy;
};

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

  // Combine strategies into unified format
  const allStrategies: UnifiedStrategy[] = React.useMemo(() => {
    const user: UnifiedStrategy[] = (userStrategies || []).map(s => ({
      id: s.id,
      name: s.name,
      description: s.description,
      type: 'user' as const,
      strategy_type: s.strategy_type,
      is_active: s.is_active,
      is_public: s.is_public,
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
      buy_conditions: s.buy_conditions,
      sell_conditions: s.sell_conditions,
      original: s,
    }));

    return [...user, ...custom];
  }, [userStrategies, customStrategies]);

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
          Trading
        </Typography>
        <Typography variant="subtitle1" color="textSecondary">
          Select stocks and a strategy to start a trading session. Create and manage strategies in the Strategies page.
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
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  <Settings sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Select Trading Strategy
                </Typography>
                <Typography variant="body2" color="textSecondary" paragraph>
                  Choose one of your saved strategies to use for live trading. All strategy creation and editing happens in the Strategies page.
                </Typography>

                {strategiesLoading ? (
                  <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                    <CircularProgress />
                  </Box>
                ) : allStrategies.length === 0 ? (
                  <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <Psychology sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      No Strategies Available
                    </Typography>
                    <Typography variant="body2" color="textSecondary" paragraph>
                      You haven't created any trading strategies yet. Create your first strategy to start trading.
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<Add />}
                      onClick={() => navigate('/strategies')}
                      sx={{ mt: 2 }}
                    >
                      Create Strategy
                    </Button>
                  </Paper>
                ) : (
                  <Stack spacing={2}>
                    {allStrategies.map((strategy) => (
                      <Card
                        key={`${strategy.type}-${strategy.id}`}
                        sx={{
                          border: selectedStrategy?.id === strategy.id && selectedStrategy?.type === strategy.type ? 2 : 1,
                          borderColor: selectedStrategy?.id === strategy.id && selectedStrategy?.type === strategy.type ? 'primary.main' : 'divider',
                          backgroundColor: selectedStrategy?.id === strategy.id && selectedStrategy?.type === strategy.type ? 'action.selected' : 'background.paper',
                        }}
                      >
                        <CardActionArea onClick={() => handleStrategySelect(strategy)}>
                          <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                              <Typography variant="h6" component="div">
                                {strategy.name}
                              </Typography>
                              <Chip
                                label={strategy.type === 'custom' ? 'Custom' : (strategy.strategy_type || 'Strategy')}
                                size="small"
                                color={strategy.type === 'custom' ? 'secondary' : 'primary'}
                                variant="outlined"
                              />
                            </Box>
                            {strategy.description && (
                              <Typography variant="body2" color="textSecondary" paragraph>
                                {strategy.description}
                              </Typography>
                            )}
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                              <Chip
                                label={strategy.is_active ? 'Active' : 'Inactive'}
                                size="small"
                                color={strategy.is_active ? 'success' : 'default'}
                                variant="outlined"
                              />
                              {strategy.is_public && (
                                <Chip
                                  label="Public"
                                  size="small"
                                  color="secondary"
                                  variant="outlined"
                                />
                              )}
                            </Box>
                          </CardContent>
                        </CardActionArea>
                      </Card>
                    ))}
                  </Stack>
                )}
              </Box>
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

