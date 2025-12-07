import { TradingDatabase } from '../../src/database/tradingSchema';
import { EventEmitter } from 'events';

export interface MockTrade {
  symbol: string;
  action: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  timestamp: string;
  strategy: string;
  pnl?: number;
}

export interface MockSessionConfig {
  userId: number;
  symbols: string[];
  strategy: string;
  strategyParameters: Record<string, any>;
  mode: 'PAPER' | 'LIVE';
  initialCash: number;
  tradeInterval: number; // milliseconds between trades
  maxTrades: number;
  volatility: number; // 0-1, affects price movements
}

export class TradingMockService extends EventEmitter {
  private static instance: TradingMockService;
  private activeSessions: Map<number, MockSessionConfig> = new Map();
  private sessionTimers: Map<number, NodeJS.Timeout> = new Map();
  private isRunning = false;

  private constructor() {
    super();
  }

  static getInstance(): TradingMockService {
    if (!TradingMockService.instance) {
      TradingMockService.instance = new TradingMockService();
    }
    return TradingMockService.instance;
  }

  /**
   * Start a mock trading session
   */
  async startMockSession(config: MockSessionConfig): Promise<{ success: boolean; sessionId?: number; message: string }> {
    try {
      // Check if user already has an active session
      const existingSession = await TradingDatabase.getActiveTradingSession(config.userId);
      if (existingSession) {
        return {
          success: false,
          message: 'User already has an active trading session'
        };
      }

      // Create trading session
      const session = await TradingDatabase.createTradingSession({
        user_id: config.userId,
        start_time: new Date().toISOString(),
        mode: config.mode,
        initial_cash: config.initialCash,
        status: 'ACTIVE',
        total_trades: 0,
        winning_trades: 0
      });

      // Store session config
      this.activeSessions.set(session.id!, config);

      // Start mock trading
      this.startMockTrading(session.id!);

      this.emit('sessionStarted', { sessionId: session.id, config });

      return {
        success: true,
        sessionId: session.id,
        message: 'Mock trading session started successfully'
      };
    } catch (error) {
      console.error('Error starting mock session:', error);
      return {
        success: false,
        message: 'Failed to start mock trading session'
      };
    }
  }

  /**
   * Stop a mock trading session
   */
  async stopMockSession(sessionId: number): Promise<{ success: boolean; message: string }> {
    try {
      // Stop the timer
      const timer = this.sessionTimers.get(sessionId);
      if (timer) {
        clearInterval(timer);
        this.sessionTimers.delete(sessionId);
      }

      // Remove from active sessions
      this.activeSessions.delete(sessionId);

      // Update session status
      await TradingDatabase.updateTradingSession(sessionId, {
        end_time: new Date().toISOString(),
        status: 'COMPLETED'
      });

      this.emit('sessionStopped', { sessionId });

      return {
        success: true,
        message: 'Mock trading session stopped successfully'
      };
    } catch (error) {
      console.error('Error stopping mock session:', error);
      return {
        success: false,
        message: 'Failed to stop mock trading session'
      };
    }
  }

  /**
   * Start mock trading for a session
   */
  private startMockTrading(sessionId: number): void {
    const config = this.activeSessions.get(sessionId);
    if (!config) return;

    let tradeCount = 0;
    const basePrices: { [symbol: string]: number } = {};

    // Initialize base prices
    config.symbols.forEach(symbol => {
      basePrices[symbol] = this.getBasePrice(symbol);
    });

    const timer = setInterval(async () => {
      try {
        if (tradeCount >= config.maxTrades) {
          await this.stopMockSession(sessionId);
          return;
        }

        // Generate a mock trade
        const trade = await this.generateMockTrade(config, basePrices);
        
        // Save trade to database
        const savedTrade = await TradingDatabase.saveTrade({
          user_id: config.userId,
          symbol: trade.symbol,
          action: trade.action,
          quantity: trade.quantity,
          price: trade.price,
          timestamp: trade.timestamp,
          strategy: trade.strategy,
          mode: config.mode,
          pnl: trade.pnl
        });

        // Update session trade count
        const session = await this.getSessionById(sessionId);
        if (session) {
          const newTotalTrades = session.total_trades + 1;
          const newWinningTrades = trade.pnl && trade.pnl > 0 ? session.winning_trades + 1 : session.winning_trades;
          
          await TradingDatabase.updateTradingSession(sessionId, {
            total_trades: newTotalTrades,
            winning_trades: newWinningTrades
          });
        }

        // Emit trade event
        this.emit('tradeExecuted', { sessionId, trade: savedTrade });

        tradeCount++;
      } catch (error) {
        console.error('Error in mock trading:', error);
      }
    }, config.tradeInterval);

    this.sessionTimers.set(sessionId, timer);
  }

  /**
   * Generate a mock trade
   */
  private async generateMockTrade(config: MockSessionConfig, basePrices: { [symbol: string]: number }): Promise<MockTrade> {
    const symbol = config.symbols[Math.floor(Math.random() * config.symbols.length)];
    const action = Math.random() > 0.5 ? 'BUY' : 'SELL';
    const quantity = Math.floor(Math.random() * 50) + 1; // 1-50 shares
    
    // Calculate price with volatility
    const basePrice = basePrices[symbol];
    const volatility = config.volatility;
    const priceChange = (Math.random() - 0.5) * 2 * volatility; // -volatility to +volatility
    const price = basePrice * (1 + priceChange);
    
    // Update base price for next trade
    basePrices[symbol] = price;
    
    // Calculate P&L for SELL trades
    let pnl: number | undefined;
    if (action === 'SELL') {
      const buyPrice = basePrice * (0.95 + Math.random() * 0.1); // Simulate previous buy
      pnl = (price - buyPrice) * quantity;
    }
    
    return {
      symbol,
      action,
      quantity,
      price: Math.round(price * 100) / 100, // Round to 2 decimal places
      timestamp: new Date().toISOString(),
      strategy: config.strategy,
      pnl: pnl ? Math.round(pnl * 100) / 100 : undefined
    };
  }

  /**
   * Get base price for a symbol
   */
  private getBasePrice(symbol: string): number {
    const prices: { [key: string]: number } = {
      'AAPL': 150,
      'GOOGL': 2800,
      'MSFT': 300,
      'TSLA': 200,
      'AMZN': 3200,
      'META': 300,
      'NVDA': 400,
      'NFLX': 400,
      'SPY': 400,
      'QQQ': 350
    };
    return prices[symbol] || 100;
  }

  /**
   * Get session by ID
   */
  private async getSessionById(sessionId: number): Promise<any> {
    return new Promise((resolve, reject) => {
      const { db } = require('../initDb');
      db.get('SELECT * FROM trading_sessions WHERE id = $1', [sessionId], (err: any, row: any) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  /**
   * Get active mock sessions
   */
  getActiveSessions(): Array<{ sessionId: number; config: MockSessionConfig }> {
    return Array.from(this.activeSessions.entries()).map(([sessionId, config]) => ({
      sessionId,
      config
    }));
  }

  /**
   * Stop all mock sessions
   */
  async stopAllSessions(): Promise<void> {
    const sessionIds = Array.from(this.activeSessions.keys());
    for (const sessionId of sessionIds) {
      await this.stopMockSession(sessionId);
    }
  }

  /**
   * Get service status
   */
  getStatus(): { isRunning: boolean; activeSessions: number } {
    return {
      isRunning: this.isRunning,
      activeSessions: this.activeSessions.size
    };
  }
}

export const tradingMockService = TradingMockService.getInstance();
