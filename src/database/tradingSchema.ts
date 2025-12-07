import { db } from '../../api/initDb';

export interface Trade {
  id?: number;
  user_id: number;
  symbol: string;
  action: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  timestamp: string;
  strategy: string;
  mode: 'PAPER' | 'LIVE';
  pnl?: number;
  created_at?: string;
}

export interface PortfolioSnapshot {
  id?: number;
  user_id: number;
  timestamp: string;
  total_value: number;
  cash: number;
  positions: string; // JSON string of positions
  mode: 'PAPER' | 'LIVE';
  created_at?: string;
}

export interface TradingSession {
  id?: number;
  user_id: number;
  start_time: string;
  end_time?: string;
  mode: 'PAPER' | 'LIVE';
  initial_cash: number;
  final_cash?: number;
  total_trades: number;
  winning_trades: number;
  total_pnl?: number;
  status: 'ACTIVE' | 'COMPLETED' | 'STOPPED';
  created_at?: string;
}

export class TradingDatabase {
  static async initializeTables(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Helper function to run a query and wait for completion
      const runQuery = (sql: string, params: any[] = []): Promise<void> => {
        return new Promise((resolveQuery, rejectQuery) => {
          db.run(sql, params, (err: any) => {
            if (err) {
              rejectQuery(err);
            } else {
              resolveQuery();
            }
          });
        });
      };

      // Create tables sequentially, then indexes
      (async () => {
        try {
          // Create trades table
          const createTrades = `
            CREATE TABLE IF NOT EXISTS trades (
              id SERIAL PRIMARY KEY,
              user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
              symbol TEXT NOT NULL,
              action TEXT NOT NULL CHECK (action IN ('BUY', 'SELL')),
              quantity DOUBLE PRECISION NOT NULL,
              price DOUBLE PRECISION NOT NULL,
              timestamp TEXT NOT NULL,
              strategy TEXT NOT NULL,
              mode TEXT NOT NULL CHECK (mode IN ('PAPER', 'LIVE')),
              pnl DOUBLE PRECISION,
              created_at TIMESTAMP DEFAULT NOW()
            )
          `;
          await runQuery(createTrades);
          console.log("Trades table created/verified");

          // Create portfolio_snapshots table
          const createSnapshots = `
            CREATE TABLE IF NOT EXISTS portfolio_snapshots (
              id SERIAL PRIMARY KEY,
              user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
              timestamp TEXT NOT NULL,
              total_value DOUBLE PRECISION NOT NULL,
              cash DOUBLE PRECISION NOT NULL,
              positions TEXT NOT NULL,
              mode TEXT NOT NULL CHECK (mode IN ('PAPER', 'LIVE')),
              created_at TIMESTAMP DEFAULT NOW()
            )
          `;
          await runQuery(createSnapshots);
          console.log("Portfolio snapshots table created/verified");

          // Create trading_sessions table
          const createSessions = `
            CREATE TABLE IF NOT EXISTS trading_sessions (
              id SERIAL PRIMARY KEY,
              user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
              start_time TEXT NOT NULL,
              end_time TEXT,
              mode TEXT NOT NULL CHECK (mode IN ('PAPER', 'LIVE')),
              initial_cash DOUBLE PRECISION NOT NULL,
              final_cash DOUBLE PRECISION,
              total_trades INTEGER DEFAULT 0,
              winning_trades INTEGER DEFAULT 0,
              total_pnl DOUBLE PRECISION,
              status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'COMPLETED', 'STOPPED')),
              created_at TIMESTAMP DEFAULT NOW()
            )
          `;
          await runQuery(createSessions);
          console.log("Trading sessions table created/verified");

          // Create indexes for better performance (after tables are created)
          await runQuery(`CREATE INDEX IF NOT EXISTS idx_trades_symbol ON trades(symbol)`);
          await runQuery(`CREATE INDEX IF NOT EXISTS idx_trades_timestamp ON trades(timestamp)`);
          await runQuery(`CREATE INDEX IF NOT EXISTS idx_trades_strategy ON trades(strategy)`);
          await runQuery(`CREATE INDEX IF NOT EXISTS idx_portfolio_snapshots_timestamp ON portfolio_snapshots(timestamp)`);
          await runQuery(`CREATE INDEX IF NOT EXISTS idx_trading_sessions_status ON trading_sessions(status)`);

          resolve();
        } catch (error) {
          console.error("Error initializing trading tables:", error);
          reject(error);
        }
      })();
    });
  }

  static async saveTrade(trade: Omit<Trade, 'id' | 'created_at'>): Promise<Trade> {
    return new Promise((resolve, reject) => {
      const { user_id, symbol, action, quantity, price, timestamp, strategy, mode, pnl } = trade;
      db.run(
        'INSERT INTO trades (user_id, symbol, action, quantity, price, timestamp, strategy, mode, pnl) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
        [user_id, symbol, action, quantity, price, timestamp, strategy, mode, pnl],
        function(this: any, err: any) {
          if (err) {
            reject(err);
          } else {
            resolve({
              id: this.lastID,
              user_id,
              symbol,
              action,
              quantity,
              price,
              timestamp,
              strategy,
              mode,
              pnl,
              created_at: new Date().toISOString()
            });
          }
        }
      );
    });
  }

  static async savePortfolioSnapshot(snapshot: Omit<PortfolioSnapshot, 'id' | 'created_at'>): Promise<PortfolioSnapshot> {
    return new Promise((resolve, reject) => {
      const { user_id, timestamp, total_value, cash, positions, mode } = snapshot;
      db.run(
        'INSERT INTO portfolio_snapshots (user_id, timestamp, total_value, cash, positions, mode) VALUES ($1, $2, $3, $4, $5, $6)',
        [user_id, timestamp, total_value, cash, positions, mode],
        function(this: any, err: any) {
          if (err) {
            reject(err);
          } else {
            resolve({
              id: this.lastID,
              user_id,
              timestamp,
              total_value,
              cash,
              positions,
              mode,
              created_at: new Date().toISOString()
            });
          }
        }
      );
    });
  }

  static async createTradingSession(session: Omit<TradingSession, 'id' | 'created_at'>): Promise<TradingSession> {
    return new Promise((resolve, reject) => {
      const { user_id, start_time, end_time, mode, initial_cash, status } = session;
      db.run(
        'INSERT INTO trading_sessions (user_id, start_time, end_time, mode, initial_cash, status) VALUES ($1, $2, $3, $4, $5, $6)',
        [user_id, start_time, end_time || null, mode, initial_cash, status],
        function(this: any, err: any) {
          if (err) {
            reject(err);
          } else {
            resolve({
              id: this.lastID,
              user_id,
              start_time,
              end_time,
              mode,
              initial_cash,
              status,
              total_trades: 0,
              winning_trades: 0,
              created_at: new Date().toISOString()
            });
          }
        }
      );
    });
  }

  static async updateTradingSession(id: number, updates: Partial<TradingSession>): Promise<void> {
    return new Promise((resolve, reject) => {
      const fields = Object.keys(updates).filter(key => key !== 'id' && key !== 'created_at');
      const values = fields.map(field => updates[field as keyof TradingSession]);
      const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
      
      if (fields.length === 0) {
        resolve();
        return;
      }

      db.run(
        `UPDATE trading_sessions SET ${setClause} WHERE id = $${fields.length + 1}`,
        [...values, id],
        function(err: any) {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }

  static async getActiveTradingSession(userId: number): Promise<TradingSession | null> {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM trading_sessions WHERE user_id = $1 AND status = $2 ORDER BY created_at DESC LIMIT 1', [userId, 'ACTIVE'], (err: any, row: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(row || null);
        }
      });
    });
  }

  static async getTradesBySession(sessionId: number): Promise<Trade[]> {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM trades WHERE created_at >= (SELECT start_time FROM trading_sessions WHERE id = $1) ORDER BY timestamp',
        [sessionId],
        (err: any, rows: any[]) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows || []);
          }
        }
      );
    });
  }

  static async getTradesByUser(userId: number, limit: number = 100): Promise<Trade[]> {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM trades WHERE user_id = $1 ORDER BY timestamp DESC LIMIT $2',
        [userId, limit],
        (err: any, rows: any[]) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows || []);
          }
        }
      );
    });
  }

  static async getTradingSessionsByUser(userId: number, limit: number = 50): Promise<TradingSession[]> {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM trading_sessions WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2',
        [userId, limit],
        (err: any, rows: any[]) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows || []);
          }
        }
      );
    });
  }

  static async getPortfolioSnapshotsByUser(userId: number, limit: number = 100): Promise<PortfolioSnapshot[]> {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM portfolio_snapshots WHERE user_id = $1 ORDER BY timestamp DESC LIMIT $2',
        [userId, limit],
        (err: any, rows: any[]) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows || []);
          }
        }
      );
    });
  }

  static async getRecentTrades(limit: number = 100): Promise<Trade[]> {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM trades ORDER BY timestamp DESC LIMIT $1',
        [limit],
        (err: any, rows: any[]) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows || []);
          }
        }
      );
    });
  }
}
