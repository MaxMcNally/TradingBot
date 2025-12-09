import { Request, Response } from "express";
import { UserManager } from "../../src/bot/UserManager";
import { TradingDatabase } from "../../src/database/tradingSchema";
import { PerformanceMetricsService } from "../services/performanceMetricsService";
import { StrategiesService } from "../services/strategiesService";
import { WebhookService } from "../services/webhookService";
import { CustomStrategy } from "../models/CustomStrategy";
import { User } from "../models/User";
import { TradingSessionSettingsDatabase } from "../database/tradingSessionSettingsDatabase";
import { TradingSessionSettingsService } from "../services/tradingSessionSettingsService";

export const getUserTradingStats = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const stats = await UserManager.getUserTradingStats(userId);
    
    if (!stats) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(stats);
  } catch (error) {
    console.error("Error getting user trading stats:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getUserPortfolioSummary = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const portfolio = await UserManager.getUserPortfolioSummary(userId);
    
    if (!portfolio) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(portfolio);
  } catch (error) {
    console.error("Error getting user portfolio summary:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getUserRecentTrades = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    const limit = parseInt(req.query.limit as string) || 50;
    
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const trades = await UserManager.getUserRecentTrades(userId, limit);
    res.json(trades);
  } catch (error) {
    console.error("Error getting user recent trades:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getUserTradingSessions = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    const limit = parseInt(req.query.limit as string) || 20;
    
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const sessions = await UserManager.getUserTradingSessions(userId, limit);
    res.json(sessions);
  } catch (error) {
    console.error("Error getting user trading sessions:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getUserPortfolioHistory = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    const limit = parseInt(req.query.limit as string) || 100;
    
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const history = await UserManager.getUserPortfolioHistory(userId, limit);
    res.json(history);
  } catch (error) {
    console.error("Error getting user portfolio history:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getActiveTradingSession = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    console.log(`Getting active trading session for user ID: ${userId}`);
    const session = await TradingDatabase.getActiveTradingSession(userId);
    console.log(`Active session result:`, session);
    
    if (!session) {
      return res.status(404).json({ message: "No active trading session found" });
    }

    // Get settings for the session
    const settings = await TradingSessionSettingsDatabase.getSettingsBySessionId(session.id!);

    res.json({
      ...session,
      settings: settings || null
    });
  } catch (error) {
    console.error("Error getting active trading session:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error("Error details:", errorMessage);
    console.error("Error stack:", errorStack);
    res.status(500).json({ message: "Internal server error", error: errorMessage });
  }
};

export const getTradesBySession = async (req: Request, res: Response) => {
  try {
    const sessionId = parseInt(req.params.sessionId);
    
    if (isNaN(sessionId)) {
      return res.status(400).json({ message: "Invalid session ID" });
    }

    const trades = await TradingDatabase.getTradesBySession(sessionId);
    res.json(trades);
  } catch (error) {
    console.error("Error getting trades by session:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const startTradingSession = async (req: Request, res: Response) => {
  try {
    const { mode, initialCash, symbols, strategy, customStrategyId, scheduledEndTime } = req.body;
    const userId = parseInt(req.body.userId || req.params.userId);
    
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    if (!symbols || symbols.length === 0) {
      return res.status(400).json({ message: "At least one symbol is required" });
    }

    // Support both regular strategies and custom strategies
    if (!strategy && !customStrategyId) {
      return res.status(400).json({ message: "Strategy or customStrategyId is required" });
    }

    // If using custom strategy, validate user has Premium+ tier and load the strategy
    if (customStrategyId) {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.plan_tier !== 'PREMIUM' && user.plan_tier !== 'ENTERPRISE') {
        return res.status(403).json({ 
          message: "Custom strategies require Premium or Enterprise subscription",
          required_tier: "PREMIUM",
          current_tier: user.plan_tier
        });
      }

      const customStrategy = await CustomStrategy.findById(parseInt(customStrategyId));
      if (!customStrategy) {
        return res.status(404).json({ message: "Custom strategy not found" });
      }

      if (customStrategy.user_id !== userId) {
        return res.status(403).json({ message: "Access denied to custom strategy" });
      }

      if (!customStrategy.is_active) {
        return res.status(400).json({ message: "Custom strategy is not active" });
      }

      // Store custom strategy info in the strategy field for the bot to use
      const parsed = CustomStrategy.parseStrategyData(customStrategy);
      req.body.strategy = {
        type: 'CUSTOM',
        customStrategyId: customStrategy.id,
        name: customStrategy.name,
        buy_conditions: parsed.buy_conditions,
        sell_conditions: parsed.sell_conditions
      };
    }

    // Check if user already has an active session
    const activeSession = await TradingDatabase.getActiveTradingSession(userId);
    if (activeSession) {
      return res.status(400).json({ 
        message: "User already has an active trading session",
        activeSessionId: activeSession.id 
      });
    }

    // Create new trading session
    const session = await TradingDatabase.createTradingSession({
      user_id: userId,
      start_time: new Date().toISOString(),
      end_time: scheduledEndTime || undefined,
      mode: mode || 'PAPER',
      initial_cash: initialCash || 10000,
      status: 'ACTIVE',
      total_trades: 0,
      winning_trades: 0
    });

    // Create default settings or use provided settings
    const settingsInput = req.body.settings || {};
    const validation = TradingSessionSettingsService.validateSettings(settingsInput);
    if (!validation.valid) {
      // If validation fails, delete the session and return error
      await TradingDatabase.updateTradingSession(session.id!, { status: 'STOPPED' });
      return res.status(400).json({
        success: false,
        message: 'Invalid session settings',
        errors: validation.errors
      });
    }

    const settings = TradingSessionSettingsService.mergeWithDefaults(session.id!, settingsInput);
    const createdSettings = await TradingSessionSettingsDatabase.createSettings(settings);

    // Send webhook event for bot started
    WebhookService.sendBotStartedEvent(userId, session.id!, session).catch(err => {
      console.error('Error sending bot started webhook:', err);
    });

    res.json({
      success: true,
      sessionId: session.id,
      message: "Trading session started successfully",
      session: {
        ...session,
        settings: createdSettings
      }
    });
  } catch (error) {
    console.error("Error starting trading session:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const stopTradingSession = async (req: Request, res: Response) => {
  try {
    const sessionId = parseInt(req.params.sessionId);
    
    if (isNaN(sessionId)) {
      return res.status(400).json({ message: "Invalid session ID" });
    }

    // Get session data before stopping
    const sessionData = await TradingDatabase.getTradingSessionById(sessionId);
    if (!sessionData) {
      return res.status(404).json({ message: "Trading session not found" });
    }
    const session = await TradingDatabase.getTradesBySession(sessionId);
    
    await TradingDatabase.updateTradingSession(sessionId, {
      end_time: new Date().toISOString(),
      status: 'COMPLETED'
    });

    // Get updated session data
    const updatedSession = await TradingDatabase.getTradingSessionById(sessionId);
    let performanceData = null;

    // Save performance metrics for the completed session
    try {
      if (sessionData && session.length > 0) {
        const userId = sessionData.user_id;
        
        // Convert trades to the format expected by PerformanceMetricsService
        const trades = session.map(trade => ({
          date: new Date(trade.timestamp).getTime(),
          symbol: trade.symbol,
          action: trade.action,
          price: trade.price,
          quantity: trade.quantity,
          pnl: trade.pnl || 0
        }));

        // Create portfolio history (simplified for now)
        const portfolioHistory = [
          {
            timestamp: sessionData.start_time,
            totalValue: sessionData.initial_cash,
            cash: sessionData.initial_cash,
            positions: {}
          },
          {
            timestamp: new Date().toISOString(),
            totalValue: sessionData.final_cash || sessionData.initial_cash,
            cash: sessionData.final_cash || sessionData.initial_cash,
            positions: {}
          }
        ];

        const performanceMetrics = PerformanceMetricsService.convertLiveTradingResults(
          sessionData,
          trades,
          portfolioHistory,
          'Live Trading', // Strategy name - could be extracted from session data
          'Live Trading', // Strategy type
          {}, // Config - could be stored in session data
          [] // Symbols - could be extracted from trades
        );

        await PerformanceMetricsService.savePerformanceMetrics(performanceMetrics, userId);
        performanceData = performanceMetrics;
        console.log(`Performance metrics saved for live trading session: ${sessionId}`);
      }
    } catch (error) {
      console.error('Error saving live trading performance metrics:', error);
      // Don't fail the request if metrics saving fails
    }

    // Send webhook event for bot finished
    if (updatedSession) {
      WebhookService.sendBotFinishedEvent(
        updatedSession.user_id,
        sessionId,
        updatedSession,
        performanceData
      ).catch(err => {
        console.error('Error sending bot finished webhook:', err);
      });
    }

    res.json({
      success: true,
      message: "Trading session stopped successfully"
    });
  } catch (error) {
    console.error("Error stopping trading session:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const pauseTradingSession = async (req: Request, res: Response) => {
  try {
    const sessionId = parseInt(req.params.sessionId);
    
    if (isNaN(sessionId)) {
      return res.status(400).json({ message: "Invalid session ID" });
    }

    await TradingDatabase.updateTradingSession(sessionId, {
      status: 'STOPPED'
    });

    res.json({
      success: true,
      message: "Trading session paused successfully"
    });
  } catch (error) {
    console.error("Error pausing trading session:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const resumeTradingSession = async (req: Request, res: Response) => {
  try {
    const sessionId = parseInt(req.params.sessionId);
    
    if (isNaN(sessionId)) {
      return res.status(400).json({ message: "Invalid session ID" });
    }

    await TradingDatabase.updateTradingSession(sessionId, {
      status: 'ACTIVE'
    });

    res.json({
      success: true,
      message: "Trading session resumed successfully"
    });
  } catch (error) {
    console.error("Error resuming trading session:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getAvailableStrategies = async (req: Request, res: Response) => {
  try {
    const strategies = StrategiesService.getStrategiesForBacktest();
    
    res.json({
      success: true,
      data: {
        strategies
      }
    });
  } catch (error) {
    console.error("Error getting available strategies:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};
