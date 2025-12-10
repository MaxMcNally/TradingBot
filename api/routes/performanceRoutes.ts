import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getStrategyPerformanceOverview,
  getStrategyPerformanceDetails,
  getStrategyPerformanceById,
  getStrategyPerformanceByStrategyId,
  getPerformanceAnalytics,
  deletePerformanceRecord
} from '../controllers/strategyPerformanceController';

const router = Router();

// All performance routes require authentication (accessible to all authenticated users)
router.use(authenticateToken);

// Strategy Performance Routes
router.get('/overview', getStrategyPerformanceOverview);
router.get('/analytics', getPerformanceAnalytics);
router.get('/strategy/:strategyName', getStrategyPerformanceDetails);
router.get('/strategy-id/:strategyId', getStrategyPerformanceByStrategyId);
router.get('/:id', getStrategyPerformanceById);
router.delete('/:id', deletePerformanceRecord);

export default router;

