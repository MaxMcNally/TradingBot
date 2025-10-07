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

const router = express.Router();


// Test data management routes
router.post('/create-test-user', createTestUser);
router.get('/test-user', getTestUser);
router.delete('/cleanup', cleanupTestData);

// Mock trading session routes
router.post('/mock-sessions/start', startMockSession);
router.post('/mock-sessions/:sessionId/stop', stopMockSession);
router.get('/mock-sessions/active', getActiveMockSessions);
router.post('/mock-sessions/stop-all', stopAllMockSessions);

export default router;
