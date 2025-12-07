import express, { Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  verifyAlpacaCredentials,
  placeBuyOrder,
  placeSellOrder,
  getAccountInfo,
} from '../services/alpacaService';

export const alpacaRouter = express.Router();

// Verify Alpaca credentials
alpacaRouter.post('/verify', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await verifyAlpacaCredentials(userId);
    res.json(result);
  } catch (error: any) {
    console.error('Error verifying Alpaca credentials:', error);
    res.status(500).json({ error: error.message || 'Failed to verify credentials' });
  }
});

// Place buy order
alpacaRouter.post('/orders/buy', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { symbol, quantity, orderType, limitPrice } = req.body;

    if (!symbol || !quantity) {
      return res.status(400).json({ error: 'Symbol and quantity are required' });
    }

    const result = await placeBuyOrder(userId, symbol, quantity, orderType, limitPrice);
    
    if (result.success) {
      res.json({ success: true, order: result.order });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error: any) {
    console.error('Error placing buy order:', error);
    res.status(500).json({ error: error.message || 'Failed to place buy order' });
  }
});

// Place sell order
alpacaRouter.post('/orders/sell', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { symbol, quantity, orderType, limitPrice } = req.body;

    if (!symbol || !quantity) {
      return res.status(400).json({ error: 'Symbol and quantity are required' });
    }

    const result = await placeSellOrder(userId, symbol, quantity, orderType, limitPrice);
    
    if (result.success) {
      res.json({ success: true, order: result.order });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error: any) {
    console.error('Error placing sell order:', error);
    res.status(500).json({ error: error.message || 'Failed to place sell order' });
  }
});

// Get account info
alpacaRouter.get('/account', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await getAccountInfo(userId);
    
    if (result.success) {
      res.json({ success: true, account: result.account });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error: any) {
    console.error('Error getting account info:', error);
    res.status(500).json({ error: error.message || 'Failed to get account info' });
  }
});
