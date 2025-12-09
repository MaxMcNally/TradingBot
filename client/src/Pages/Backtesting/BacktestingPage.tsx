import React, { useState, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
} from "@mui/material";
import {
  Assessment,
  TrendingUp,
  Settings,
  AccountBalance,
} from "@mui/icons-material";
import { 
  BacktestFormData
} from "./Backtesting.types";
import { 
  TabPanel,
  StockSelectionSection,
  SessionSummary,
  BotSelector,
  UnifiedStrategy,
} from "../../components/shared";
import { useStrategies, useUserStrategies } from "../../hooks";
import { useCustomStrategies } from "../../hooks/useCustomStrategies/useCustomStrategies";
import { useNavigate } from "react-router-dom";
import SaveStrategyDialog from "./SaveStrategyDialog";
import BacktestSessionControls from "./BacktestSessionControls";




const BacktestingPage: React.FC = () => {
  const navigate = useNavigate();
  // Tab state
  const [activeTab, setActiveTab] = useState(0);
  
  // Form management with react-hook-form
  const methods = useForm<BacktestFormData>({
    defaultValues: {
      strategy: "meanReversion",
      symbols: [],
      startDate: "2023-01-01",
      endDate: "2023-12-31",
      initialCapital: 10000,
      sharesPerTrade: 100,
      // Sentiment Analysis parameters (defaults)
      lookbackDays: 3,
      pollIntervalMinutes: 0,
      minArticles: 2,
      buyThreshold: 0.4,
      sellThreshold: -0.4,
      titleWeight: 2.0,
      recencyHalfLifeHours: 12,
      // Mean Reversion parameters
      window: 20,
      threshold: 0.05,
      // Moving Average Crossover parameters
      fastWindow: 10,
      slowWindow: 30,
      maType: 'SMA',
      // Momentum parameters
      rsiWindow: 14,
      rsiOverbought: 70,
      rsiOversold: 30,
      momentumWindow: 10,
      momentumThreshold: 0.02,
      // Bollinger Bands parameters
      multiplier: 2.0,
      // Breakout parameters
      lookbackWindow: 20,
      breakoutThreshold: 0.01,
      minVolumeRatio: 1.5,
      confirmationPeriod: 2,
    }
  });
  const { watch, setValue, getValues } = methods;
  const watchedFields = watch([
    'strategy',
    'symbols',
    'startDate',
    'endDate',
    'initialCapital',
    'sharesPerTrade',
  ]);
  
  const formData = {
    strategy: watchedFields[0],
    symbols: watchedFields[1],
    startDate: watchedFields[2],
    endDate: watchedFields[3],
    initialCapital: watchedFields[4],
    sharesPerTrade: watchedFields[5],
  };
  

  
  // Local state for selected stocks (similar to Trading component)
  const [selectedStocks, setSelectedStocks] = useState<string[]>([]);
  
  // Strategy parameters for the reusable StrategySelector
  const [strategyParameters, setStrategyParameters] = useState<Record<string, any>>({});
  
  // Sync local state with form data on mount
  useEffect(() => {
    const formSymbols = getValues('symbols');
    if (formSymbols && Array.isArray(formSymbols)) {
      setSelectedStocks(formSymbols);
    }
  }, [getValues]);
  
  // Save strategy dialog state
  const [saveStrategyDialogOpen, setSaveStrategyDialogOpen] = useState(false);

  // Use hooks for strategies and backtesting
  const { strategies: availableStrategies, isLoading: strategiesLoading, isError: strategiesError } = useStrategies();
  const { strategies: userStrategies, isLoading: userStrategiesLoading } = useUserStrategies(false);
  const { strategies: customStrategies, isLoading: customStrategiesLoading } = useCustomStrategies(false);
  const { saveFromBacktest, isCreating: isSavingStrategy } = useUserStrategies();
  
  // Selected bot state (for BotSelector)
  const [selectedBot, setSelectedBot] = useState<UnifiedStrategy | null>(null);
  const botsLoading = userStrategiesLoading || customStrategiesLoading;

  // Handle bot selection from BotSelector
  const handleBotSelect = (bot: UnifiedStrategy) => {
    setSelectedBot(bot);
    // Set the strategy name in the form
    setValue('strategy', bot.name);
    
    // Set strategy parameters based on bot type
    if (bot.type === 'user' && bot.config) {
      setStrategyParameters(bot.config);
    } else if (bot.type === 'custom') {
      setStrategyParameters({
        buy_conditions: bot.buy_conditions,
        sell_conditions: bot.sell_conditions,
      });
    }
  };

  // Reset strategy parameters when strategy changes (for basic strategies)
  useEffect(() => {
    if (availableStrategies && formData.strategy && !selectedBot) {
      const strategy = availableStrategies.find(s => s.name === formData.strategy);
      if (strategy && strategy.parameters) {
        const defaultParams: Record<string, any> = {};
        Object.entries(strategy.parameters).forEach(([key, param]) => {
          if (typeof param === 'object' && param !== null && 'default' in param) {
            defaultParams[key] = param.default;
          }
        });
        setStrategyParameters(defaultParams);
      }
    }
  }, [formData.strategy, availableStrategies, selectedBot]);


  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };



  const handleSaveStrategy = async (strategyData: any) => {
    try {
      await saveFromBacktest(strategyData);
      setSaveStrategyDialogOpen(false);
    } catch (error) {
      console.error('Error saving strategy:', error);
      throw error;
    }
  };

  
  if (strategiesLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (strategiesError) {
    return (
      <Box p={3}>
        <Alert severity="error">Failed to load strategies</Alert>
      </Box>
    );
  }
  
  return (
    <FormProvider {...methods}>
    <Box>
      {/* Header */}
      <Box mb={3}>
        <Typography variant="h4" component="h1" gutterBottom>
          <Assessment sx={{ mr: 1, verticalAlign: 'middle' }} />
          Test Bot
        </Typography>
        <Typography variant="subtitle1" color="textSecondary">
          Backtest your trading bots against historical data to evaluate performance before running them live.
        </Typography>
      </Box>

      {/* Main Content */}
      <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', lg: 'row' } }}>
        {/* Main Content Area */}
        <Box sx={{ flex: 2 }}>
          <Paper sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={activeTab} onChange={handleTabChange} aria-label="backtest tabs">
                <Tab
                  icon={<TrendingUp />}
                  label="Stock Selection"
                  id="backtest-tab-0"
                  aria-controls="backtest-tabpanel-0"
                />
                <Tab
                  icon={<Settings />}
                  label="Strategy Selection"
                  id="backtest-tab-1"
                  aria-controls="backtest-tabpanel-1"
                />
                <Tab
                  icon={<AccountBalance />}
                  label="Session Controls"
                  id="backtest-tab-2"
                  aria-controls="backtest-tabpanel-2"
                />
              </Tabs>
            </Box>

            {/* Stock Selection Tab */}
            <TabPanel value={activeTab} index={0}>
              <StockSelectionSection
                selectedStocks={selectedStocks}
                onStocksChange={(symbols: string[]) => {
                  setSelectedStocks(symbols);
                  setValue('symbols', symbols);
                }}
                maxStocks={10}
                title="Stock Selection"
                description="Select the stocks you want to include in your backtest. You can choose up to {maxStocks} stocks."
                showSummary={false}
              />
            </TabPanel>

            {/* Strategy Selection Tab */}
            <TabPanel value={activeTab} index={1}>
              <BotSelector
                userStrategies={userStrategies}
                customStrategies={customStrategies}
                isLoading={botsLoading}
                selectedStrategy={selectedBot}
                onStrategySelect={handleBotSelect}
                title="Select Bot for Testing"
                description="Choose a trading bot to test against historical data. You can select from your saved bots or create a new one."
                emptyStateTitle="No Bots Available"
                emptyStateMessage="You haven't created any trading bots yet. Create your first bot to start testing."
                emptyStateButtonLabel="Create Bot"
                onEmptyStateButtonClick={() => navigate('/strategies')}
                showActiveOnly={true}
              />
            </TabPanel>

            {/* Session Controls Tab */}
            <TabPanel value={activeTab} index={2}>
              <BacktestSessionControls
                selectedStocks={selectedStocks}
                selectedBot={selectedBot}
                strategyParameters={strategyParameters}
                onBacktestStarted={() => {
                  // Backtest started - results will be available in Dashboard
                }}
                onBacktestCompleted={() => {
                  // Backtest completed - results will be available in Dashboard
                  // Optionally navigate to dashboard to view results
                  // navigate('/dashboard');
                }}
              />
            </TabPanel>
          </Paper>
        </Box>

        {/* Persistent Sidebar */}
        <Box sx={{ flex: 1, minWidth: 300 }}>
          <SessionSummary
            title="Backtest Configuration"
            selectedStocks={selectedStocks}
            selectedStrategy={formData.strategy}
            strategyParameters={strategyParameters}
            mode="backtesting"
            maxStocks={10}
          />
        </Box>
      </Box>

      {/* Save Strategy Dialog */}
      <SaveStrategyDialog
        open={saveStrategyDialogOpen}
        onClose={() => setSaveStrategyDialogOpen(false)}
        onSave={handleSaveStrategy}
        formData={getValues()}
        results={null}
        isLoading={isSavingStrategy}
      />
    </Box>
    </FormProvider>
  );
};

export default BacktestingPage;
