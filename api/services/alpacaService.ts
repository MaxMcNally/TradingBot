import axios, { AxiosInstance } from 'axios';
import { db, isPostgres } from '../initDb';
import { decrypt } from '../utils/encryption';

interface AlpacaCredentials {
  apiKey: string;
  apiSecret: string;
}

interface AlpacaOrder {
  symbol: string;
  qty?: number;
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop' | 'stop_limit';
  time_in_force: 'day' | 'gtc' | 'opg' | 'cls' | 'ioc' | 'fok';
  limit_price?: number;
  stop_price?: number;
}

interface AlpacaOrderResponse {
  id: string;
  client_order_id: string;
  created_at: string;
  updated_at: string;
  submitted_at: string;
  filled_at?: string;
  expired_at?: string;
  canceled_at?: string;
  failed_at?: string;
  replaced_at?: string;
  replaced_by?: string;
  replaces?: string;
  asset_id: string;
  symbol: string;
  asset_class: string;
  notional?: number;
  qty?: number;
  filled_qty: number;
  filled_avg_price?: number;
  order_class: string;
  order_type: string;
  type: string;
  side: string;
  time_in_force: string;
  limit_price?: number;
  stop_price?: number;
  status: string;
  extended_hours: boolean;
  legs?: any[];
  trail_percent?: number;
  trail_price?: number;
  hwm?: number;
}

/**
 * Check if we're in a development or staging environment
 */
function isPaperTradingAllowed(): boolean {
  const env = process.env.NODE_ENV || 'development';
  const railwayEnv = process.env.RAILWAY_ENVIRONMENT;
  
  // Allow paper trading in development, staging, or if explicitly set
  return (
    env === 'development' ||
    env === 'dev' ||
    railwayEnv === 'development' ||
    railwayEnv === 'staging' ||
    railwayEnv === 'qa' ||
    process.env.ALLOW_PAPER_TRADING === 'true'
  );
}

/**
 * Get Alpaca base URL for paper trading
 */
function getAlpacaBaseUrl(): string {
  // Alpaca paper trading endpoint
  return 'https://paper-api.alpaca.markets';
}

/**
 * Get user's Alpaca credentials from database
 */
async function getUserAlpacaCredentials(userId: number): Promise<AlpacaCredentials | null> {
  return new Promise((resolve, reject) => {
    const getCredential = (key: string): Promise<string | null> => {
      return new Promise((resolveCred, rejectCred) => {
        db.get(
          isPostgres
            ? 'SELECT value FROM settings WHERE user_id = $1 AND key = $2'
            : 'SELECT value FROM settings WHERE user_id = ? AND key = ?',
          [userId, key],
          (err: any, row: any) => {
            if (err) rejectCred(err);
            else resolveCred(row?.value || null);
          }
        );
      });
    };

    Promise.all([
      getCredential('alpaca_api_key'),
      getCredential('alpaca_api_secret')
    ])
      .then(([encryptedKey, encryptedSecret]) => {
        if (!encryptedKey || !encryptedSecret) {
          resolve(null);
          return;
        }

        try {
          const apiKey = decrypt(encryptedKey);
          const apiSecret = decrypt(encryptedSecret);
          resolve({ apiKey, apiSecret });
        } catch (error) {
          console.error('Error decrypting Alpaca credentials:', error);
          reject(error);
        }
      })
      .catch(reject);
  });
}

/**
 * Create Alpaca API client
 */
function createAlpacaClient(credentials: AlpacaCredentials): AxiosInstance {
  return axios.create({
    baseURL: getAlpacaBaseUrl(),
    headers: {
      'APCA-API-KEY-ID': credentials.apiKey,
      'APCA-API-SECRET-KEY': credentials.apiSecret,
    },
  });
}

/**
 * Verify Alpaca credentials by checking account status
 */
export async function verifyAlpacaCredentials(userId: number): Promise<{ valid: boolean; message?: string }> {
  if (!isPaperTradingAllowed()) {
    return {
      valid: false,
      message: 'Paper trading is only allowed in development or staging environments',
    };
  }

  try {
    const credentials = await getUserAlpacaCredentials(userId);
    if (!credentials) {
      return {
        valid: false,
        message: 'Alpaca credentials not found',
      };
    }

    const client = createAlpacaClient(credentials);
    const response = await client.get('/v2/account');

    if (response.status === 200) {
      return {
        valid: true,
        message: 'Credentials verified successfully',
      };
    }

    return {
      valid: false,
      message: 'Failed to verify credentials',
    };
  } catch (error: any) {
    console.error('Error verifying Alpaca credentials:', error);
    return {
      valid: false,
      message: error.response?.data?.message || error.message || 'Failed to verify credentials',
    };
  }
}

/**
 * Place a buy order on Alpaca (paper trading)
 */
export async function placeBuyOrder(
  userId: number,
  symbol: string,
  quantity: number,
  orderType: 'market' | 'limit' = 'market',
  limitPrice?: number
): Promise<{ success: boolean; order?: AlpacaOrderResponse; error?: string }> {
  if (!isPaperTradingAllowed()) {
    return {
      success: false,
      error: 'Paper trading is only allowed in development or staging environments',
    };
  }

  try {
    const credentials = await getUserAlpacaCredentials(userId);
    if (!credentials) {
      return {
        success: false,
        error: 'Alpaca credentials not found. Please configure your Alpaca API credentials in settings.',
      };
    }

    const client = createAlpacaClient(credentials);

    const order: AlpacaOrder = {
      symbol: symbol.toUpperCase(),
      qty: quantity,
      side: 'buy',
      type: orderType,
      time_in_force: 'day',
    };

    if (orderType === 'limit' && limitPrice) {
      order.limit_price = limitPrice;
    }

    const response = await client.post('/v2/orders', order);

    return {
      success: true,
      order: response.data,
    };
  } catch (error: any) {
    console.error('Error placing buy order:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to place buy order',
    };
  }
}

/**
 * Place a sell order on Alpaca (paper trading)
 */
export async function placeSellOrder(
  userId: number,
  symbol: string,
  quantity: number,
  orderType: 'market' | 'limit' = 'market',
  limitPrice?: number
): Promise<{ success: boolean; order?: AlpacaOrderResponse; error?: string }> {
  if (!isPaperTradingAllowed()) {
    return {
      success: false,
      error: 'Paper trading is only allowed in development or staging environments',
    };
  }

  try {
    const credentials = await getUserAlpacaCredentials(userId);
    if (!credentials) {
      return {
        success: false,
        error: 'Alpaca credentials not found. Please configure your Alpaca API credentials in settings.',
      };
    }

    const client = createAlpacaClient(credentials);

    const order: AlpacaOrder = {
      symbol: symbol.toUpperCase(),
      qty: quantity,
      side: 'sell',
      type: orderType,
      time_in_force: 'day',
    };

    if (orderType === 'limit' && limitPrice) {
      order.limit_price = limitPrice;
    }

    const response = await client.post('/v2/orders', order);

    return {
      success: true,
      order: response.data,
    };
  } catch (error: any) {
    console.error('Error placing sell order:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to place sell order',
    };
  }
}

/**
 * Get account information from Alpaca
 */
export async function getAccountInfo(userId: number): Promise<{ success: boolean; account?: any; error?: string }> {
  if (!isPaperTradingAllowed()) {
    return {
      success: false,
      error: 'Paper trading is only allowed in development or staging environments',
    };
  }

  try {
    const credentials = await getUserAlpacaCredentials(userId);
    if (!credentials) {
      return {
        success: false,
        error: 'Alpaca credentials not found',
      };
    }

    const client = createAlpacaClient(credentials);
    const response = await client.get('/v2/account');

    return {
      success: true,
      account: response.data,
    };
  } catch (error: any) {
    console.error('Error getting account info:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to get account info',
    };
  }
}
