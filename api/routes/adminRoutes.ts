import { Router } from 'express';
import { requireAdmin, requireAdminOrOwner } from '../middleware/adminAuth';
import { authenticateToken } from '../middleware/auth';
import {
  getUserPerformanceData,
  getAllUsers
} from '../controllers/adminController';

const router = Router();

// Admin-only routes require authentication + admin privileges
router.use(authenticateToken);
router.use(requireAdmin);

// User Management Routes
router.get('/users', getAllUsers);
router.get('/users/:userId/performance', requireAdminOrOwner, getUserPerformanceData);

export default router;
