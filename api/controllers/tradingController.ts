import { Request, Response } from "express";
import { UserManager } from "../../src/bot/UserManager";
import { TradingDatabase } from "../../src/database/tradingSchema";
import { PerformanceMetricsService } from "../services/performanceMetricsService";
import { TradingBotManager } from "../services/tradingBotManager";

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

export const getUserPerformanceMetrics = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    const limit = parseInt(req.query.limit as string) || 50;
    
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    // Import StrategyPerformance here to avoid circular dependencies
    const { StrategyPerformance } = await import('../models/StrategyPerformance');
    const performances = await StrategyPerformance.findByUserId(userId, limit);
    
    // Parse the performance data
    const parsedPerformances = performances.map(p => StrategyPerformance.parsePerformanceData(p));
    
    res.json(parsedPerformances);
  } catch (error) {
    console.error("Error getting user performance metrics:", error);
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
    const { mode, initialCash, symbols, strategy, scheduledEndTime, dataProvider = 'polygon' } = req.body;
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

    // Check if user already has an active session
    const activeSession = await TradingDatabase.getActiveTradingSession(userId);
    if (activeSession) {
      return res.status(400).json({ 
        message: "User already has an active trading session",
        activeSessionId: activeSession.id 
      });
    }

    // Check if user already has an active trading bot
    const botManager = TradingBotManager.getInstance();
    if (botManager.hasActiveBot(userId)) {
      return res.status(400).json({ 
        message: "User already has an active trading bot running"
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

    // Start the actual trading bot
    const botConfig = {
      symbols,
      strategies: [strategy],
      dataProvider
    };

    const botStarted = await botManager.startTradingBot(userId, session.id!, botConfig);
    
    if (!botStarted) {
      // If bot failed to start, mark session as failed
      await TradingDatabase.updateTradingSession(session.id!, {
        status: 'STOPPED',
        end_time: new Date().toISOString()
      });
      
      return res.status(500).json({ 
        message: "Failed to start trading bot",
        sessionId: session.id
      });
    }

    res.json({
      success: true,
      sessionId: session.id,
      message: "Trading session started successfully",
      session
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
    const session = await TradingDatabase.getTradesBySession(sessionId);
    const sessionData = await TradingDatabase.getActiveTradingSession(session[0]?.user_id || 0);
    
    // Stop the trading bot if it's running
    const botManager = TradingBotManager.getInstance();
    if (sessionData && botManager.hasActiveBot(sessionData.user_id)) {
      await botManager.stopTradingBot(sessionData.user_id);
      console.log(`🛑 Stopped trading bot for user ${sessionData.user_id}`);
    }
    
    await TradingDatabase.updateTradingSession(sessionId, {
      end_time: new Date().toISOString(),
      status: 'COMPLETED'
    });

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
        console.log(`Performance metrics saved for live trading session: ${sessionId}`);
      }
    } catch (error) {
      console.error('Error saving live trading performance metrics:', error);
      // Don't fail the request if metrics saving fails
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
    // Return available strategies
    const strategies = [
      {
        name: 'MovingAverage',
        description: 'Uses moving average crossover to generate buy/sell signals',
        parameters: {
          shortWindow: 5,
          longWindow: 10,
        },
        enabled: true,
        symbols: [],
      },
      {
        name: 'SentimentAnalysis',
        description: 'News sentiment-based strategy using recent articles to generate BUY/SELL signals',
        parameters: {
          lookbackDays: 3,
          pollIntervalMinutes: 0,
          minArticles: 2,
          buyThreshold: 0.4,
          sellThreshold: -0.4,
          titleWeight: 2.0,
          recencyHalfLifeHours: 12,
          newsSource: 'yahoo'
        },
        enabled: true,
        symbols: [],
      },
      {
        name: 'BollingerBands',
        description: 'Uses Bollinger Bands to identify overbought/oversold conditions',
        parameters: {
          window: 20,
          numStdDev: 2,
        },
        enabled: true,
        symbols: [],
      },
      {
        name: 'MeanReversion',
        description: 'Identifies when prices deviate significantly from their mean',
        parameters: {
          window: 20,
          threshold: 2,
        },
        enabled: true,
        symbols: [],
      },
      {
        name: 'Momentum',
        description: 'Follows the trend by buying when momentum is positive',
        parameters: {
          window: 10,
          threshold: 0.02,
        },
        enabled: true,
        symbols: [],
      },
      {
        name: 'Breakout',
        description: 'Identifies when prices break through resistance or support levels',
        parameters: {
          window: 20,
          threshold: 0.05,
        },
        enabled: true,
        symbols: [],
      },
    ];

    res.json({ strategies });
  } catch (error) {
    console.error("Error getting available strategies:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

