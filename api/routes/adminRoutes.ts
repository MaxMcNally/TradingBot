import { Router } from 'express';
import { requireAdmin, requireAdminOrOwner } from '../middleware/adminAuth';
import {
  getStrategyPerformanceOverview,
  getStrategyPerformanceDetails,
  getStrategyPerformanceById,
  getUserPerformanceData,
  getPerformanceAnalytics,
  deletePerformanceRecord,
  getAllUsers
} from '../controllers/adminController';

const router = Router();

// All admin routes require admin authentication
router.use(requireAdmin);

// Strategy Performance Routes
router.get('/performance/overview', getStrategyPerformanceOverview);
router.get('/performance/analytics', getPerformanceAnalytics);
router.get('/performance/strategy/:strategyName', getStrategyPerformanceDetails);
router.get('/performance/:id', getStrategyPerformanceById);
router.delete('/performance/:id', deletePerformanceRecord);

// User Management Routes
router.get('/users', getAllUsers);
router.get('/users/:userId/performance', requireAdminOrOwner, getUserPerformanceData);

export default router;
