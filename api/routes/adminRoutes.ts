import { Router } from 'express';
import { requireAdmin, requireAdminOrOwner } from '../middleware/adminAuth';
import { authenticateToken } from '../middleware/auth';
import {
  getStrategyPerformanceOverview,
  getStrategyPerformanceDetails,
  getStrategyPerformanceById,
  getUserPerformanceData,
  getPerformanceAnalytics,
  deletePerformanceRecord,
  getAllUsers,
  getSubscriptionTiers,
  getSubscriptionTierByName,
  updateSubscriptionTier,
  getSubscriptionStats,
  updateUserSubscription
} from '../controllers/adminController';

const router = Router();

// All admin routes require authentication + admin privileges
router.use(authenticateToken);
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
router.put('/users/:userId/subscription', updateUserSubscription);

// Subscription Tier Management Routes
router.get('/subscriptions/tiers', getSubscriptionTiers);
router.get('/subscriptions/tiers/:tier', getSubscriptionTierByName);
router.put('/subscriptions/tiers/:tier', updateSubscriptionTier);
router.get('/subscriptions/stats', getSubscriptionStats);

export default router;
