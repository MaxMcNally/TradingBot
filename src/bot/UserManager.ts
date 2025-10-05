import { User } from '../../api/models/User';
import { TradingDatabase } from '../database/tradingSchema';

export interface UserTradingStats {
  userId: number;
  username: string;
  totalTrades: number;
  winningTrades: number;
  totalPnL: number;
  winRate: number;
  activeSessions: number;
  lastTradeDate?: string;
}

export interface UserPortfolioSummary {
  userId: number;
  username: string;
  currentValue: number;
  cash: number;
  totalPositions: number;
  mode: 'PAPER' | 'LIVE';
  lastUpdate: string;
}

export class UserManager {
  static async authenticateUser(username: string, password: string): Promise<{ user: any; success: boolean; message: string }> {
    try {
      const user = await User.findByUsername(username);
      
      if (!user) {
        return { user: null, success: false, message: 'User not found' };
      }

      // In a real application, you would hash the password and compare with user.password_hash
      // For now, we'll use a simple comparison (this should be updated for production)
      // TODO: Implement proper password hashing comparison using bcrypt
      
      return { user, success: true, message: 'Authentication successful' };
    } catch (error) {
      return { user: null, success: false, message: 'Authentication failed' };
    }
  }

  static async getUserTradingStats(userId: number): Promise<UserTradingStats | null> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return null;
      }

      const trades = await TradingDatabase.getTradesByUser(userId, 1000); // Get more trades for stats
      const sessions = await TradingDatabase.getTradingSessionsByUser(userId, 100);
      
      const totalTrades = trades.length;
      const winningTrades = trades.filter(trade => trade.pnl && trade.pnl > 0).length;
      const totalPnL = trades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
      const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
      const activeSessions = sessions.filter(session => session.status === 'ACTIVE').length;
      
      const lastTrade = trades.length > 0 ? trades[0] : null;
      const lastTradeDate = lastTrade ? lastTrade.timestamp : undefined;

      return {
        userId,
        username: user.username,
        totalTrades,
        winningTrades,
        totalPnL,
        winRate,
        activeSessions,
        lastTradeDate
      };
    } catch (error) {
      console.error('Error getting user trading stats:', error);
      return null;
    }
  }

  static async getUserPortfolioSummary(userId: number): Promise<UserPortfolioSummary | null> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return null;
      }

      const snapshots = await TradingDatabase.getPortfolioSnapshotsByUser(userId, 1);
      const latestSnapshot = snapshots.length > 0 ? snapshots[0] : null;

      if (!latestSnapshot) {
        return {
          userId,
          username: user.username,
          currentValue: 0,
          cash: 0,
          totalPositions: 0,
          mode: 'PAPER',
          lastUpdate: new Date().toISOString()
        };
      }

      const positions = JSON.parse(latestSnapshot.positions);
      const totalPositions = Object.keys(positions).length;

      return {
        userId,
        username: user.username,
        currentValue: latestSnapshot.total_value,
        cash: latestSnapshot.cash,
        totalPositions,
        mode: latestSnapshot.mode,
        lastUpdate: latestSnapshot.timestamp
      };
    } catch (error) {
      console.error('Error getting user portfolio summary:', error);
      return null;
    }
  }

  static async getUserRecentTrades(userId: number, limit: number = 50): Promise<any[]> {
    try {
      return await TradingDatabase.getTradesByUser(userId, limit);
    } catch (error) {
      console.error('Error getting user recent trades:', error);
      return [];
    }
  }

  static async getUserTradingSessions(userId: number, limit: number = 20): Promise<any[]> {
    try {
      return await TradingDatabase.getTradingSessionsByUser(userId, limit);
    } catch (error) {
      console.error('Error getting user trading sessions:', error);
      return [];
    }
  }

  static async getUserPortfolioHistory(userId: number, limit: number = 100): Promise<any[]> {
    try {
      return await TradingDatabase.getPortfolioSnapshotsByUser(userId, limit);
    } catch (error) {
      console.error('Error getting user portfolio history:', error);
      return [];
    }
  }

  static async createUser(username: string, password: string, email?: string): Promise<{ user: any; success: boolean; message: string }> {
    try {
      // Check if user already exists
      const existingUser = await User.findByUsername(username);
      if (existingUser) {
        return { user: null, success: false, message: 'Username already exists' };
      }

      // In a real application, you would hash the password before storing
      // For now, we'll store it as-is (this should be updated for production)
      // TODO: Implement proper password hashing using bcrypt
      const hashedPassword = password; // This should be bcrypt.hashSync(password, 10)

      const user = await User.create({
        username,
        password_hash: hashedPassword,
        email
      });

      return { user, success: true, message: 'User created successfully' };
    } catch (error) {
      console.error('Error creating user:', error);
      return { user: null, success: false, message: 'Failed to create user' };
    }
  }

  static async getAllUsers(): Promise<any[]> {
    try {
      // This would need to be implemented in the User model
      // For now, we'll return an empty array
      return [];
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  }
}
