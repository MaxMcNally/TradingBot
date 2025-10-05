import express from 'express';
import {
  getUserTradingStats,
  getUserPortfolioSummary,
  getUserRecentTrades,
  getUserTradingSessions,
  getUserPortfolioHistory,
  getActiveTradingSession,
  getTradesBySession,
  startTradingSession,
  stopTradingSession,
  pauseTradingSession,
  resumeTradingSession,
  getAvailableStrategies
} from '../controllers/tradingController';

const router = express.Router();

// User-specific trading data routes
router.get('/users/:userId/stats', getUserTradingStats);
router.get('/users/:userId/portfolio', getUserPortfolioSummary);
router.get('/users/:userId/trades', getUserRecentTrades);
router.get('/users/:userId/sessions', getUserTradingSessions);
router.get('/users/:userId/portfolio-history', getUserPortfolioHistory);
router.get('/users/:userId/active-session', getActiveTradingSession);

// Session-specific routes
router.get('/sessions/:sessionId/trades', getTradesBySession);

// Trading session management routes
router.post('/sessions/start', startTradingSession);
router.post('/sessions/:sessionId/stop', stopTradingSession);
router.post('/sessions/:sessionId/pause', pauseTradingSession);
router.post('/sessions/:sessionId/resume', resumeTradingSession);

// Strategy management routes
router.get('/strategies', getAvailableStrategies);

export default router;
