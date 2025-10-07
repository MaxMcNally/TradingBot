import { TradingDatabase } from '../../src/database/tradingSchema';
import { User } from '../models/User';
import bcrypt from 'bcryptjs';

export interface TestUserData {
  user: any;
  sessions: any[];
  trades: any[];
  portfolioSnapshots: any[];
}

export class TestDataGenerator {
  private static instance: TestDataGenerator;

  private constructor() {}

  static getInstance(): TestDataGenerator {
    if (!TestDataGenerator.instance) {
      TestDataGenerator.instance = new TestDataGenerator();
    }
    return TestDataGenerator.instance;
  }

  /**
   * Create a test user with comprehensive trading history
   */
  async createTestUser(): Promise<TestUserData> {
    try {
      // Create test user
      const hashedPassword = await bcrypt.hash('testpass123', 10);
      const testUser = await User.create({
        username: 'testtrader',
        password_hash: hashedPassword,
        email: 'test@tradingbot.com'
      });

      console.log(`Created test user: ${testUser.username} (ID: ${testUser.id})`);

      // Generate historical data
      const sessions = await this.generateHistoricalSessions(testUser.id!);
      const trades = await this.generateHistoricalTrades(testUser.id!, sessions);
      const portfolioSnapshots = await this.generatePortfolioSnapshots(testUser.id!, sessions);

      return {
        user: testUser,
        sessions,
        trades,
        portfolioSnapshots
      };
    } catch (error) {
      console.error('Error creating test user:', error);
      throw error;
    }
  }

  /**
   * Generate historical trading sessions
   */
  private async generateHistoricalSessions(userId: number): Promise<any[]> {
    const sessions = [];
    const now = new Date();
    
    // Generate sessions for the last 30 days
    for (let i = 0; i < 15; i++) {
      const sessionDate = new Date(now);
      sessionDate.setDate(sessionDate.getDate() - (i * 2)); // Every 2 days
      
      const startTime = new Date(sessionDate);
      startTime.setHours(9, 30, 0, 0); // 9:30 AM
      
      const endTime = new Date(sessionDate);
      endTime.setHours(16, 0, 0, 0); // 4:00 PM
      
      const duration = endTime.getTime() - startTime.getTime();
      const randomDuration = duration * (0.3 + Math.random() * 0.7); // 30-100% of market hours
      
      const actualEndTime = new Date(startTime.getTime() + randomDuration);
      
      const totalTrades = Math.floor(Math.random() * 50) + 5; // 5-55 trades
      const winningTrades = Math.floor(totalTrades * (0.4 + Math.random() * 0.3)); // 40-70% win rate
      const totalPnL = (Math.random() - 0.4) * 2000; // -$800 to +$1200 P&L
      
      const session = await TradingDatabase.createTradingSession({
        user_id: userId,
        start_time: startTime.toISOString(),
        end_time: actualEndTime.toISOString(),
        mode: Math.random() > 0.2 ? 'PAPER' : 'LIVE', // 80% paper, 20% live
        initial_cash: 10000,
        final_cash: 10000 + totalPnL,
        total_trades: totalTrades,
        winning_trades: winningTrades,
        total_pnl: totalPnL,
        status: 'COMPLETED'
      });
      
      sessions.push(session);
    }

    // Create one active session
    const activeSession = await TradingDatabase.createTradingSession({
      user_id: userId,
      start_time: new Date().toISOString(),
      mode: 'PAPER',
      initial_cash: 10000,
      total_trades: 0,
      winning_trades: 0,
      status: 'ACTIVE'
    });
    
    sessions.push(activeSession);
    
    console.log(`Generated ${sessions.length} trading sessions`);
    return sessions;
  }

  /**
   * Generate historical trades for sessions
   */
  private async generateHistoricalTrades(userId: number, sessions: any[]): Promise<any[]> {
    const symbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'META', 'NVDA', 'NFLX'];
    const strategies = ['MovingAverage', 'BollingerBands', 'MeanReversion', 'Momentum', 'Breakout'];
    const actions = ['BUY', 'SELL'];
    const trades = [];

    for (const session of sessions) {
      if (session.status === 'COMPLETED') {
        const sessionStart = new Date(session.start_time);
        const sessionEnd = new Date(session.end_time);
        const sessionDuration = sessionEnd.getTime() - sessionStart.getTime();
        
        // Generate trades for this session
        for (let i = 0; i < session.total_trades; i++) {
          const tradeTime = new Date(sessionStart.getTime() + (Math.random() * sessionDuration));
          const symbol = symbols[Math.floor(Math.random() * symbols.length)];
          const action = actions[Math.floor(Math.random() * actions.length)] as 'BUY' | 'SELL';
          const strategy = strategies[Math.floor(Math.random() * strategies.length)];
          
          // Generate realistic price based on symbol
          const basePrice = this.getBasePrice(symbol);
          const price = basePrice * (0.95 + Math.random() * 0.1); // ±5% variation
          
          const quantity = Math.floor(Math.random() * 100) + 1; // 1-100 shares
          
          // Calculate P&L (simplified)
          let pnl = null;
          if (action === 'SELL') {
            const buyPrice = basePrice * (0.95 + Math.random() * 0.1);
            pnl = (price - buyPrice) * quantity;
          }
          
          const trade = await TradingDatabase.saveTrade({
            user_id: userId,
            symbol,
            action,
            quantity,
            price,
            timestamp: tradeTime.toISOString(),
            strategy,
            mode: session.mode,
            pnl: pnl || undefined
          });
          
          trades.push(trade);
        }
      }
    }
    
    console.log(`Generated ${trades.length} trades`);
    return trades;
  }

  /**
   * Generate portfolio snapshots
   */
  private async generatePortfolioSnapshots(userId: number, sessions: any[]): Promise<any[]> {
    const snapshots = [];
    
    for (const session of sessions) {
      if (session.status === 'COMPLETED') {
        const sessionStart = new Date(session.start_time);
        const sessionEnd = new Date(session.end_time);
        const sessionDuration = sessionEnd.getTime() - sessionStart.getTime();
        
        // Generate snapshots every 2 hours during the session
        const snapshotCount = Math.floor(sessionDuration / (2 * 60 * 60 * 1000)) + 1;
        
        for (let i = 0; i < snapshotCount; i++) {
          const snapshotTime = new Date(sessionStart.getTime() + (i * 2 * 60 * 60 * 1000));
          if (snapshotTime > sessionEnd) break;
          
          const progress = snapshotCount > 1 ? i / (snapshotCount - 1) : 0;
          const currentValue = session.initial_cash + ((session.total_pnl || 0) * progress);
          const cash = session.initial_cash * (0.7 + Math.random() * 0.3); // 70-100% cash
          
          // Generate some positions
          const positions = {
            'AAPL': Math.floor(Math.random() * 50),
            'GOOGL': Math.floor(Math.random() * 20),
            'MSFT': Math.floor(Math.random() * 30)
          };
          
          const snapshot = await TradingDatabase.savePortfolioSnapshot({
            user_id: userId,
            timestamp: snapshotTime.toISOString(),
            total_value: currentValue,
            cash,
            positions: JSON.stringify(positions),
            mode: session.mode
          });
          
          snapshots.push(snapshot);
        }
      }
    }
    
    console.log(`Generated ${snapshots.length} portfolio snapshots`);
    return snapshots;
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
      'NFLX': 400
    };
    return prices[symbol] || 100;
  }

  /**
   * Clean up test data
   */
  async cleanupTestData(): Promise<void> {
    try {
      const { db, isPostgres } = require('../initDb');
      
      // Delete test user and all related data
      await new Promise<void>((resolve, reject) => {
        db.run(isPostgres ? 'DELETE FROM users WHERE username = $1' : 'DELETE FROM users WHERE username = ?', ['testtrader'], (err: any) => {
          if (err) reject(err);
          else resolve();
        });
      });
      
      console.log('Test data cleaned up');
    } catch (error) {
      console.error('Error cleaning up test data:', error);
      throw error;
    }
  }

  /**
   * Get test user data
   */
  async getTestUser(): Promise<any> {
    try {
      return await User.findByUsername('testtrader');
    } catch (error) {
      console.error('Error getting test user:', error);
      return null;
    }
  }
}

export const testDataGenerator = TestDataGenerator.getInstance();
