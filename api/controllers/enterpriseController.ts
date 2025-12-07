import { Response } from "express";
import { ApiKeyAuthenticatedRequest } from "../middleware/apiKeyAuth";
import { TradingDatabase } from "../../src/database/tradingSchema";
import { StrategyPerformance } from "../models/StrategyPerformance";
import { startTradingSession, stopTradingSession } from "./tradingController";

// Get all bots (trading sessions) for the authenticated enterprise user
export const getBots = async (req: ApiKeyAuthenticatedRequest, res: Response) => {
  try {
    const userId = req.apiKey!.user_id;
    const limit = parseInt(req.query.limit as string) || 50;
    
    const sessions = await TradingDatabase.getTradingSessionsByUser(userId, limit);
    
    // Remove PII and format response
    const bots = sessions.map(session => ({
      id: session.id,
      status: session.status,
      mode: session.mode,
      start_time: session.start_time,
      end_time: session.end_time,
      initial_cash: session.initial_cash,
      final_cash: session.final_cash,
      total_trades: session.total_trades,
      winning_trades: session.winning_trades,
      total_pnl: session.total_pnl,
      created_at: session.created_at
    }));

    res.json({
      success: true,
      data: bots
    });
  } catch (error) {
    console.error("Error getting bots:", error);
    res.status(500).json({ 
      success: false,
      error: "Internal server error" 
    });
  }
};

// Get a specific bot by ID
export const getBot = async (req: ApiKeyAuthenticatedRequest, res: Response) => {
  try {
    const userId = req.apiKey!.user_id;
    const botId = parseInt(req.params.botId);
    
    if (isNaN(botId)) {
      return res.status(400).json({ 
        success: false,
        error: "Invalid bot ID" 
      });
    }

    const session = await TradingDatabase.getTradingSessionById(botId);
    
    if (!session || session.user_id !== userId) {
      return res.status(404).json({ 
        success: false,
        error: "Bot not found" 
      });
    }

    // Get trades for this session
    const trades = await TradingDatabase.getTradesBySession(botId);

    res.json({
      success: true,
      data: {
        id: session.id,
        status: session.status,
        mode: session.mode,
        start_time: session.start_time,
        end_time: session.end_time,
        initial_cash: session.initial_cash,
        final_cash: session.final_cash,
        total_trades: session.total_trades,
        winning_trades: session.winning_trades,
        total_pnl: session.total_pnl,
        created_at: session.created_at,
        trades: trades.map(trade => ({
          id: trade.id,
          symbol: trade.symbol,
          action: trade.action,
          quantity: trade.quantity,
          price: trade.price,
          timestamp: trade.timestamp,
          pnl: trade.pnl
        }))
      }
    });
  } catch (error) {
    console.error("Error getting bot:", error);
    res.status(500).json({ 
      success: false,
      error: "Internal server error" 
    });
  }
};

// Get active bot
export const getActiveBot = async (req: ApiKeyAuthenticatedRequest, res: Response) => {
  try {
    const userId = req.apiKey!.user_id;
    
    const session = await TradingDatabase.getActiveTradingSession(userId);
    
    if (!session) {
      return res.status(404).json({ 
        success: false,
        error: "No active bot found" 
      });
    }

    res.json({
      success: true,
      data: {
        id: session.id,
        status: session.status,
        mode: session.mode,
        start_time: session.start_time,
        initial_cash: session.initial_cash,
        total_trades: session.total_trades,
        winning_trades: session.winning_trades,
        total_pnl: session.total_pnl
      }
    });
  } catch (error) {
    console.error("Error getting active bot:", error);
    res.status(500).json({ 
      success: false,
      error: "Internal server error" 
    });
  }
};

// Start a bot
export const startBot = async (req: ApiKeyAuthenticatedRequest, res: Response) => {
  try {
    const userId = req.apiKey!.user_id;
    const { mode, initialCash, symbols, strategy, scheduledEndTime } = req.body;

    if (!symbols || symbols.length === 0) {
      return res.status(400).json({ 
        success: false,
        error: "At least one symbol is required" 
      });
    }

    if (!strategy) {
      return res.status(400).json({ 
        success: false,
        error: "Strategy is required" 
      });
    }

    // Check if user already has an active session
    const activeSession = await TradingDatabase.getActiveTradingSession(userId);
    if (activeSession) {
      return res.status(400).json({ 
        success: false,
        error: "User already has an active trading session",
        activeBotId: activeSession.id 
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

    // Actually start the bot and send the webhook event
    // Call startTradingSession with the required parameters
    // If startTradingSession expects a request object, construct a minimal one
    const startTradingReq: any = {
      apiKey: req.apiKey,
      body: {
        mode: mode || 'PAPER',
        initialCash: initialCash || 10000,
        symbols,
        strategy,
        scheduledEndTime: scheduledEndTime || undefined,
        sessionId: session.id
      }
    };
    await startTradingSession(startTradingReq, res);
    // Note: startTradingSession should handle the response, so we return here
    return;
  } catch (error) {
    console.error("Error starting bot:", error);
    res.status(500).json({ 
      success: false,
      error: "Internal server error" 
    });
  }
};

// Stop a bot
export const stopBot = async (req: ApiKeyAuthenticatedRequest, res: Response) => {
  // Adapt the request object to match stopTradingSession expectations
  // Assume stopTradingSession expects req.params.sessionId
  req.params.sessionId = req.params.botId;
  // Delegate to stopTradingSession, which handles DB update and webhook
  return stopTradingSession(req, res);
};

// Get performance metrics
export const getPerformance = async (req: ApiKeyAuthenticatedRequest, res: Response) => {
  try {
    const userId = req.apiKey!.user_id;
    const limit = parseInt(req.query.limit as string) || 50;
    
    const performance = await StrategyPerformance.findByUserId(userId, limit);
    
    // Remove PII and format response
    const metrics = performance.map(perf => {
      let symbolsParsed;
      try {
        symbolsParsed = JSON.parse(perf.symbols);
      } catch (e) {
        console.error(`Failed to parse symbols for performance id ${perf.id}:`, e);
        symbolsParsed = null;
      }
      return {
        id: perf.id,
        strategy_name: perf.strategy_name,
        strategy_type: perf.strategy_type,
        execution_type: perf.execution_type,
        session_id: perf.session_id,
        symbols: symbolsParsed,
        start_date: perf.start_date,
        end_date: perf.end_date,
        initial_capital: perf.initial_capital,
        final_capital: perf.final_capital,
        total_return: perf.total_return,
        total_return_dollar: perf.total_return_dollar,
        max_drawdown: perf.max_drawdown,
        sharpe_ratio: perf.sharpe_ratio,
        sortino_ratio: perf.sortino_ratio,
        win_rate: perf.win_rate,
        total_trades: perf.total_trades,
        winning_trades: perf.winning_trades,
        losing_trades: perf.losing_trades,
        avg_win: perf.avg_win,
        avg_loss: perf.avg_loss,
        profit_factor: perf.profit_factor,
        largest_win: perf.largest_win,
        largest_loss: perf.largest_loss,
        created_at: perf.created_at
      };
    });

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error("Error getting performance:", error);
    res.status(500).json({ 
      success: false,
      error: "Internal server error" 
    });
  }
};

// Get stats summary
export const getStats = async (req: ApiKeyAuthenticatedRequest, res: Response) => {
  try {
    const userId = req.apiKey!.user_id;
    
    // Get all sessions
    const sessions = await TradingDatabase.getTradingSessionsByUser(userId, 1000);
    const activeSession = await TradingDatabase.getActiveTradingSession(userId);
    
    // Get performance data
    const performance = await StrategyPerformance.findByUserId(userId, 100);
    
    // Calculate aggregate stats
    const totalBots = sessions.length;
    const activeBots = activeSession ? 1 : 0;
    const totalTrades = sessions.reduce((sum, s) => sum + (s.total_trades || 0), 0);
    const totalWinningTrades = sessions.reduce((sum, s) => sum + (s.winning_trades || 0), 0);
    const totalPnL = sessions.reduce((sum, s) => sum + (s.total_pnl || 0), 0);
    
    // Calculate average performance metrics
    const liveTradingPerf = performance.filter(p => p.execution_type === 'LIVE_TRADING');
    const avgReturn = liveTradingPerf.length > 0
      ? liveTradingPerf.reduce((sum, p) => sum + p.total_return, 0) / liveTradingPerf.length
      : 0;
    const avgWinRate = liveTradingPerf.length > 0
      ? liveTradingPerf.reduce((sum, p) => sum + p.win_rate, 0) / liveTradingPerf.length
      : 0;

    res.json({
      success: true,
      data: {
        total_bots: totalBots,
        active_bots: activeBots,
        total_trades: totalTrades,
        total_winning_trades: totalWinningTrades,
        win_rate: totalTrades > 0 ? (totalWinningTrades / totalTrades) * 100 : 0,
        total_pnl: totalPnL,
        average_return: avgReturn,
        average_win_rate: avgWinRate
      }
    });
  } catch (error) {
    console.error("Error getting stats:", error);
    res.status(500).json({ 
      success: false,
      error: "Internal server error" 
    });
  }
};

