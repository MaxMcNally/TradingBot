import { Request, Response } from "express";
import { UserManager } from "../../src/bot/UserManager";
import { TradingDatabase } from "../../src/database/tradingSchema";
import { PerformanceMetricsService } from "../services/performanceMetricsService";
import { StrategiesService } from "../services/strategiesService";
import { WebhookService } from "../services/webhookService";
import { db } from "../initDb";
import { getTierLimits, PlanTier } from "../constants";

// Helper to get user's plan tier
const getUserPlanTier = async (userId: number): Promise<PlanTier> => {
  return new Promise((resolve, reject) => {
    db.get('SELECT plan_tier FROM users WHERE id = $1', [userId], (err: any, row: any) => {
      if (err) reject(err);
      else resolve((row?.plan_tier || 'FREE') as PlanTier);
    });
  });
};

// Helper to count active trading sessions for a user
const countActiveSessionsForUser = async (userId: number): Promise<number> => {
  return new Promise((resolve, reject) => {
    db.get(
      "SELECT COUNT(*) as count FROM trading_sessions WHERE user_id = $1 AND status = 'ACTIVE'",
      [userId],
      (err: any, row: any) => {
        if (err) reject(err);
        else resolve(row?.count || 0);
      }
    );
  });
};

// Check if user can run another bot
const canUserRunBot = async (userId: number): Promise<{ allowed: boolean; reason?: string; currentCount: number; maxAllowed: number; planTier: PlanTier }> => {
  const planTier = await getUserPlanTier(userId);
  const limits = getTierLimits(planTier);
  const currentCount = await countActiveSessionsForUser(userId);
  
  if (limits.maxRunningBots !== -1 && currentCount >= limits.maxRunningBots) {
    return {
      allowed: false,
      reason: `You have reached the maximum number of running bots (${limits.maxRunningBots}) for your ${limits.displayName} plan. Upgrade to run more bots simultaneously.`,
      currentCount,
      maxAllowed: limits.maxRunningBots,
      planTier
    };
  }
  
  return {
    allowed: true,
    currentCount,
    maxAllowed: limits.maxRunningBots,
    planTier
  };
};

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

    res.json(session);
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
    const { mode, initialCash, symbols, strategy, scheduledEndTime } = req.body;
    const userId = parseInt(req.body.userId || req.params.userId);
    
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    if (!symbols || symbols.length === 0) {
      return res.status(400).json({ message: "At least one symbol is required" });
    }

    if (!strategy) {
      return res.status(400).json({ message: "Strategy is required" });
    }

    // Check if user can run more bots based on their plan limits
    const limitCheck = await canUserRunBot(userId);
    if (!limitCheck.allowed) {
      return res.status(403).json({
        message: limitCheck.reason,
        error: 'RUNNING_BOT_LIMIT_EXCEEDED',
        limitInfo: {
          currentCount: limitCheck.currentCount,
          maxAllowed: limitCheck.maxAllowed,
          planTier: limitCheck.planTier
        }
      });
    }

    // Check if user already has an active session (redundant but kept for safety)
    const activeSession = await TradingDatabase.getActiveTradingSession(userId);
    if (activeSession && limitCheck.maxAllowed === 1) {
      return res.status(400).json({ 
        message: "User already has an active trading session",
        activeSessionId: activeSession.id,
        error: 'RUNNING_BOT_LIMIT_EXCEEDED',
        limitInfo: {
          currentCount: limitCheck.currentCount,
          maxAllowed: limitCheck.maxAllowed,
          planTier: limitCheck.planTier
        }
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

    // Send webhook event for bot started
    WebhookService.sendBotStartedEvent(userId, session.id!, session).catch(err => {
      console.error('Error sending bot started webhook:', err);
    });

    res.json({
      success: true,
      sessionId: session.id,
      message: "Trading session started successfully",
      session,
      limitInfo: {
        currentCount: limitCheck.currentCount + 1,
        maxAllowed: limitCheck.maxAllowed,
        planTier: limitCheck.planTier
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
