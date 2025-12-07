import { Response } from 'express';
import { db } from '../initDb';
import { encrypt, decrypt, maskSensitiveData } from '../utils/encryption';
import { AlpacaService, createAlpacaService, validateCredentials, AlpacaCredentials } from '../services/alpacaService';
import { AuthenticatedRequest } from '../middleware/auth';

// Environment check
const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PRODUCTION = NODE_ENV === 'production';

// Store active Alpaca connections in memory (per user) with TTL tracking
interface ConnectionEntry {
  service: AlpacaService;
  lastAccessed: number;
}

const activeConnections: Map<number, ConnectionEntry> = new Map();

// TTL for inactive connections (30 minutes)
const CONNECTION_TTL_MS = 30 * 60 * 1000;

// Cleanup interval (5 minutes)
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

// Store cleanup interval ID for testing/shutdown
let cleanupIntervalId: NodeJS.Timeout | null = null;

/**
 * Cleanup stale connections (called periodically)
 */
const cleanupStaleConnections = () => {
  const now = Date.now();
  const staleUserIds: number[] = [];

  for (const [userId, entry] of activeConnections.entries()) {
    if (now - entry.lastAccessed > CONNECTION_TTL_MS) {
      staleUserIds.push(userId);
    }
  }

  if (staleUserIds.length > 0) {
    console.log(`🧹 Cleaning up ${staleUserIds.length} stale Alpaca connection(s)`);
    staleUserIds.forEach(userId => activeConnections.delete(userId));
  }
};

/**
 * Start periodic cleanup of stale connections
 */
const startCleanupInterval = () => {
  cleanupIntervalId = setInterval(cleanupStaleConnections, CLEANUP_INTERVAL_MS);
  console.log(`🔄 Alpaca connection cleanup interval started (every ${CLEANUP_INTERVAL_MS / 60000} minutes)`);
};

/**
 * Stop periodic cleanup (useful for testing or graceful shutdown)
 */
export const stopCleanupInterval = () => {
  if (cleanupIntervalId) {
    clearInterval(cleanupIntervalId);
    cleanupIntervalId = null;
    console.log('🛑 Alpaca connection cleanup interval stopped');
  }
};

/**
 * Initialize cleanup interval if not already started
 * This is called lazily on first connection to avoid starting background processes during testing
 */
const ensureCleanupStarted = () => {
  if (!cleanupIntervalId) {
    startCleanupInterval();
  }
};

// Valid values for order parameters (must match OrderRequest interface)
const VALID_ORDER_SIDES = ['buy', 'sell'] as const;
const VALID_ORDER_TYPES = ['market', 'limit', 'stop', 'stop_limit', 'trailing_stop'] as const;
const VALID_TIME_IN_FORCE = ['day', 'gtc', 'opg', 'cls', 'ioc', 'fok'] as const;

/**
 * Get or create an Alpaca service for a user
 */
const getAlpacaServiceForUser = async (userId: number): Promise<AlpacaService | null> => {
  // Ensure cleanup interval is running
  ensureCleanupStarted();

  // Check if there's already an active connection
  const entry = activeConnections.get(userId);
  if (entry) {
    // Update last accessed time
    entry.lastAccessed = Date.now();
    return entry.service;
  }

  // Try to load credentials from database
  const credentials = await getStoredCredentials(userId);
  if (!credentials) {
    return null;
  }

  // Create and cache the service
  const service = createAlpacaService(credentials);
  activeConnections.set(userId, {
    service,
    lastAccessed: Date.now(),
  });
  return service;
};

/**
 * Get stored credentials from database
 */
const getStoredCredentials = (userId: number): Promise<AlpacaCredentials | null> => {
  return new Promise((resolve, reject) => {
    const query = `SELECT key, value FROM settings WHERE user_id = $1 AND key IN ('alpaca_api_key', 'alpaca_api_secret', 'alpaca_is_paper')`;

    db.all(query, [userId], (err: any, rows: any[]) => {
      if (err) {
        reject(err);
        return;
      }

      if (!rows || rows.length === 0) {
        resolve(null);
        return;
      }

      const settings: Record<string, string> = {};
      rows.forEach((row: any) => {
        settings[row.key] = row.value;
      });

      if (!settings.alpaca_api_key || !settings.alpaca_api_secret) {
        resolve(null);
        return;
      }

      try {
        const credentials: AlpacaCredentials = {
          apiKey: decrypt(settings.alpaca_api_key),
          apiSecret: decrypt(settings.alpaca_api_secret),
          // Force paper trading in non-production regardless of stored value
          isPaper: IS_PRODUCTION ? settings.alpaca_is_paper !== 'false' : true,
        };
        resolve(credentials);
      } catch (error) {
        console.error('Error decrypting Alpaca credentials:', error);
        resolve(null);
      }
    });
  });
};

/**
 * Save Alpaca credentials to database
 */
const saveCredentials = (
  userId: number,
  apiKey: string,
  apiSecret: string,
  isPaper: boolean
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const encryptedKey = encrypt(apiKey);
    const encryptedSecret = encrypt(apiSecret);
    // Force paper in non-production
    const actualIsPaper = IS_PRODUCTION ? isPaper : true;

    const settings = [
      { key: 'alpaca_api_key', value: encryptedKey },
      { key: 'alpaca_api_secret', value: encryptedSecret },
      { key: 'alpaca_is_paper', value: actualIsPaper.toString() },
      { key: 'alpaca_connected_at', value: new Date().toISOString() },
    ];

    const upsertQuery = `INSERT INTO settings (user_id, key, value) VALUES ($1, $2, $3)
       ON CONFLICT(user_id, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`;

    // Start transaction
    db.run('BEGIN', (beginErr: any) => {
      if (beginErr) {
        reject(beginErr);
        return;
      }
      let completed = 0;
      const total = settings.length;
      let hasError = false;

      settings.forEach((setting) => {
        db.run(upsertQuery, [userId, setting.key, setting.value], (err: any) => {
          if (err && !hasError) {
            hasError = true;
            // Rollback transaction on error
            db.run('ROLLBACK', (rollbackErr: any) => {
              // Prefer original error, but log rollback error if present
              if (rollbackErr) {
                console.error('Rollback error:', rollbackErr);
              }
              reject(err);
            });
            return;
          }
          completed++;
          if (completed === total && !hasError) {
            // Commit transaction
            db.run('COMMIT', (commitErr: any) => {
              if (commitErr) {
                reject(commitErr);
                return;
              }
              resolve();
            });
          }
        });
      });
    });
  });
};

/**
 * Delete Alpaca credentials from database
 */
const deleteCredentials = (userId: number): Promise<void> => {
  return new Promise((resolve, reject) => {
    const query = `DELETE FROM settings WHERE user_id = $1 AND key LIKE 'alpaca_%'`;

    db.run(query, [userId], (err: any) => {
      if (err) {
        reject(err);
        return;
      }
      // Remove from active connections
      activeConnections.delete(userId);
      resolve();
    });
  });
};

/**
 * Connect Alpaca account (save credentials and test connection)
 */
export const connectAlpaca = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { apiKey, apiSecret, isPaper } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Validate credentials format
    const validation = validateCredentials(apiKey, apiSecret);
    if (!validation.valid) {
      return res.status(400).json({ 
        error: 'Invalid credentials format',
        details: validation.errors 
      });
    }

    // Force paper trading in non-production environments
    const actualIsPaper = IS_PRODUCTION ? isPaper !== false : true;

    if (!IS_PRODUCTION && isPaper === false) {
      console.log(`⚠️ User ${userId} attempted to enable live trading in ${NODE_ENV} environment. Forcing paper mode.`);
    }

    // Test the connection first
    const credentials: AlpacaCredentials = {
      apiKey,
      apiSecret,
      isPaper: actualIsPaper,
    };

    const service = createAlpacaService(credentials);
    const testResult = await service.testConnection();

    if (!testResult.success) {
      return res.status(400).json({
        error: 'Failed to connect to Alpaca',
        details: testResult.error,
      });
    }

    // Save encrypted credentials
    await saveCredentials(userId, apiKey, apiSecret, actualIsPaper);

    // Cache the service
    activeConnections.set(userId, {
      service,
      lastAccessed: Date.now(),
    });

    res.json({
      success: true,
      message: 'Alpaca account connected successfully',
      account: {
        id: testResult.account?.id,
        status: testResult.account?.status,
        currency: testResult.account?.currency,
        buyingPower: testResult.account?.buying_power,
        portfolioValue: testResult.account?.portfolio_value,
        cash: testResult.account?.cash,
      },
      tradingMode: service.getTradingMode(),
      environment: NODE_ENV,
    });
  } catch (error) {
    console.error('Error connecting Alpaca:', error);
    res.status(500).json({ error: 'Failed to connect Alpaca account' });
  }
};

/**
 * Disconnect Alpaca account (remove credentials)
 */
export const disconnectAlpaca = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    await deleteCredentials(userId);

    res.json({
      success: true,
      message: 'Alpaca account disconnected successfully',
    });
  } catch (error) {
    console.error('Error disconnecting Alpaca:', error);
    res.status(500).json({ error: 'Failed to disconnect Alpaca account' });
  }
};

/**
 * Get Alpaca connection status
 */
export const getAlpacaStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const credentials = await getStoredCredentials(userId);

    if (!credentials) {
      return res.json({
        connected: false,
        tradingMode: null,
        environment: NODE_ENV,
      });
    }

    // Get or create service and test connection
    const service = await getAlpacaServiceForUser(userId);
    if (!service) {
      return res.json({
        connected: false,
        tradingMode: null,
        environment: NODE_ENV,
      });
    }

    const testResult = await service.testConnection();

    res.json({
      connected: testResult.success,
      tradingMode: service.getTradingMode(),
      environment: NODE_ENV,
      account: testResult.success ? {
        id: testResult.account?.id,
        status: testResult.account?.status,
        currency: testResult.account?.currency,
        buyingPower: testResult.account?.buying_power,
        portfolioValue: testResult.account?.portfolio_value,
        cash: testResult.account?.cash,
        equity: testResult.account?.equity,
        tradingBlocked: testResult.account?.trading_blocked,
        accountBlocked: testResult.account?.account_blocked,
      } : null,
      error: testResult.error,
      maskedApiKey: maskSensitiveData(credentials.apiKey),
    });
  } catch (error) {
    console.error('Error getting Alpaca status:', error);
    res.status(500).json({ error: 'Failed to get Alpaca status' });
  }
};

/**
 * Get Alpaca account information
 */
export const getAlpacaAccount = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const service = await getAlpacaServiceForUser(userId);
    if (!service) {
      return res.status(400).json({ error: 'Alpaca account not connected' });
    }

    const account = await service.getAccount();
    res.json({ account });
  } catch (error) {
    console.error('Error getting Alpaca account:', error);
    res.status(500).json({ error: 'Failed to get Alpaca account' });
  }
};

/**
 * Get Alpaca positions
 */
export const getAlpacaPositions = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const service = await getAlpacaServiceForUser(userId);
    if (!service) {
      return res.status(400).json({ error: 'Alpaca account not connected' });
    }

    const positions = await service.getPositions();
    res.json({ positions });
  } catch (error) {
    console.error('Error getting Alpaca positions:', error);
    res.status(500).json({ error: 'Failed to get Alpaca positions' });
  }
};

/**
 * Get Alpaca orders
 */
export const getAlpacaOrders = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { status, limit } = req.query;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const service = await getAlpacaServiceForUser(userId);
    if (!service) {
      return res.status(400).json({ error: 'Alpaca account not connected' });
    }

    const orders = await service.getOrders(
      status as 'open' | 'closed' | 'all' | undefined,
      limit ? parseInt(limit as string) : undefined
    );
    res.json({ orders });
  } catch (error) {
    console.error('Error getting Alpaca orders:', error);
    res.status(500).json({ error: 'Failed to get Alpaca orders' });
  }
};

/**
 * Submit an order to Alpaca
 */
export const submitAlpacaOrder = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { symbol, qty, side, type, time_in_force, limit_price, stop_price } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Validate required fields
    if (!symbol || !qty || !side || !type || !time_in_force) {
      return res.status(400).json({ 
        error: 'Missing required fields: symbol, qty, side, type, time_in_force' 
      });
    }

    // Validate side parameter
    if (!VALID_ORDER_SIDES.includes(side)) {
      return res.status(400).json({
        error: `Invalid side parameter. Must be one of: ${VALID_ORDER_SIDES.join(', ')}`
      });
    }

    // Validate type parameter
    if (!VALID_ORDER_TYPES.includes(type)) {
      return res.status(400).json({
        error: `Invalid type parameter. Must be one of: ${VALID_ORDER_TYPES.join(', ')}`
      });
    }

    // Validate time_in_force parameter
    if (!VALID_TIME_IN_FORCE.includes(time_in_force)) {
      return res.status(400).json({
        error: `Invalid time_in_force parameter. Must be one of: ${VALID_TIME_IN_FORCE.join(', ')}`
      });
    }

    const service = await getAlpacaServiceForUser(userId);
    if (!service) {
      return res.status(400).json({ error: 'Alpaca account not connected' });
    }

    // Log the order for audit purposes
    console.log(`📊 Alpaca order submitted by user ${userId}: ${side} ${parsedQty} ${symbol} (${service.getTradingMode()} mode)`);

    const order = await service.submitOrder({
      symbol,
      qty: parsedQty,
      side,
      type,
      time_in_force,
      limit_price: limit_price ? parseFloat(limit_price) : undefined,
      stop_price: stop_price ? parseFloat(stop_price) : undefined,
    });

    res.json({
      success: true,
      order,
      tradingMode: service.getTradingMode(),
    });
  } catch (error: any) {
    console.error('Error submitting Alpaca order:', error);
    const errorMessage = error.response?.data?.message || error.message || 'Failed to submit order';
    res.status(500).json({ error: errorMessage });
  }
};

/**
 * Cancel an Alpaca order
 */
export const cancelAlpacaOrder = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { orderId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    const service = await getAlpacaServiceForUser(userId);
    if (!service) {
      return res.status(400).json({ error: 'Alpaca account not connected' });
    }

    await service.cancelOrder(orderId);

    res.json({
      success: true,
      message: 'Order cancelled successfully',
    });
  } catch (error) {
    console.error('Error cancelling Alpaca order:', error);
    res.status(500).json({ error: 'Failed to cancel order' });
  }
};

/**
 * Get market status (clock)
 */
export const getMarketClock = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const service = await getAlpacaServiceForUser(userId);
    if (!service) {
      return res.status(400).json({ error: 'Alpaca account not connected' });
    }

    const clock = await service.getClock();
    res.json({ clock });
  } catch (error) {
    console.error('Error getting market clock:', error);
    res.status(500).json({ error: 'Failed to get market clock' });
  }
};

/**
 * Close a position
 */
export const closeAlpacaPosition = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { symbol } = req.params;
    const { qty, percentage } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!symbol) {
      return res.status(400).json({ error: 'Symbol is required' });
    }

    const service = await getAlpacaServiceForUser(userId);
    if (!service) {
      return res.status(400).json({ error: 'Alpaca account not connected' });
    }

    const order = await service.closePosition(
      symbol,
      qty ? parseFloat(qty) : undefined,
      percentage ? parseFloat(percentage) : undefined
    );

    res.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error('Error closing position:', error);
    res.status(500).json({ error: 'Failed to close position' });
  }
};

/**
 * Clear connection cache for a user (useful for logout)
 * This can be called from auth controller on user logout
 */
export const clearUserConnection = (userId: number): void => {
  activeConnections.delete(userId);
  console.log(`🔌 Cleared Alpaca connection for user ${userId}`);
};
