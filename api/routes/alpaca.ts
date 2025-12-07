import express from 'express';
import {
  connectAlpaca,
  disconnectAlpaca,
  getAlpacaStatus,
  getAlpacaAccount,
  getAlpacaPositions,
  getAlpacaOrders,
  submitAlpacaOrder,
  cancelAlpacaOrder,
  getMarketClock,
  closeAlpacaPosition,
} from '../controllers/alpacaController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Connection management
router.post('/connect', connectAlpaca);
router.post('/disconnect', disconnectAlpaca);
router.get('/status', getAlpacaStatus);

// Account information
router.get('/account', getAlpacaAccount);

// Positions
router.get('/positions', getAlpacaPositions);
router.delete('/positions/:symbol', closeAlpacaPosition);

// Orders
router.get('/orders', getAlpacaOrders);
router.post('/orders', submitAlpacaOrder);
router.delete('/orders/:orderId', cancelAlpacaOrder);

// Market info
router.get('/clock', getMarketClock);

export const alpacaRouter = router;
export default router;
