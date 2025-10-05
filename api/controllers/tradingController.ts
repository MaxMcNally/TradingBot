import { Request, Response } from "express";
import { UserManager } from "../../src/bot/UserManager";
import { TradingDatabase } from "../../src/database/tradingSchema";

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

    const session = await TradingDatabase.getActiveTradingSession(userId);
    
    if (!session) {
      return res.status(404).json({ message: "No active trading session found" });
    }

    res.json(session);
  } catch (error) {
    console.error("Error getting active trading session:", error);
    res.status(500).json({ message: "Internal server error" });
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
    const { mode, initialCash, symbols, strategy, strategyParameters } = req.body;
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

    // Create new trading session
    const session = await TradingDatabase.createTradingSession({
      user_id: userId,
      start_time: new Date().toISOString(),
      mode: mode || 'PAPER',
      initial_cash: initialCash || 10000,
      status: 'ACTIVE'
    });

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

    await TradingDatabase.updateTradingSession(sessionId, {
      end_time: new Date().toISOString(),
      status: 'COMPLETED'
    });

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
