import express from 'express';
import {
  createTestUser,
  getTestUser,
  cleanupTestData,
  startMockSession,
  stopMockSession,
  getActiveMockSessions,
  stopAllMockSessions
} from '../controllers/testController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();


// Test data management routes
router.post('/create-test-user', authenticateToken, createTestUser);
router.get('/test-user', authenticateToken, getTestUser);
router.delete('/cleanup', authenticateToken, cleanupTestData);

// Mock trading session routes
router.post('/mock-sessions/start', authenticateToken, startMockSession);
router.post('/mock-sessions/:sessionId/stop', authenticateToken, stopMockSession);
router.get('/mock-sessions/active', authenticateToken, getActiveMockSessions);
router.post('/mock-sessions/stop-all', authenticateToken, stopAllMockSessions);

export default router;
