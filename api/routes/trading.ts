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
import {
  getSessionSettings,
  updateSessionSettings,
  createSessionSettings
} from '../controllers/tradingSessionSettingsController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// User-specific trading data routes
router.get('/users/:userId/stats', authenticateToken, getUserTradingStats);
router.get('/users/:userId/portfolio', authenticateToken, getUserPortfolioSummary);
router.get('/users/:userId/trades', authenticateToken, getUserRecentTrades);
router.get('/users/:userId/sessions', authenticateToken, getUserTradingSessions);
router.get('/users/:userId/portfolio-history', authenticateToken, getUserPortfolioHistory);
router.get('/users/:userId/active-session', authenticateToken, getActiveTradingSession);

// Session-specific routes
router.get('/sessions/:sessionId/trades', authenticateToken, getTradesBySession);

// Trading session management routes
router.post('/sessions/start', authenticateToken, startTradingSession);
router.post('/sessions/:sessionId/stop', authenticateToken, stopTradingSession);
router.post('/sessions/:sessionId/pause', authenticateToken, pauseTradingSession);
router.post('/sessions/:sessionId/resume', authenticateToken, resumeTradingSession);

// Trading session settings routes
router.get('/sessions/:sessionId/settings', authenticateToken, getSessionSettings);
router.post('/sessions/:sessionId/settings', authenticateToken, createSessionSettings);
router.patch('/sessions/:sessionId/settings', authenticateToken, updateSessionSettings);

// Strategy management routes
router.get('/strategies', getAvailableStrategies);

export default router;
