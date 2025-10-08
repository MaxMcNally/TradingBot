import { TradingBot } from '../../src/bot/TradingBot';
import { PolygonProvider } from '../../src/dataProviders/PolygonProvider';
import { TradingDatabase } from '../../src/database/tradingSchema';
import { EventEmitter } from 'events';

/**
 * Service to manage active TradingBot instances
 * This bridges the gap between the API and the actual trading bots
 */
export class TradingBotManager extends EventEmitter {
  private static instance: TradingBotManager;
  private activeBots: Map<number, TradingBot> = new Map(); // userId -> TradingBot
  private botConfigs: Map<number, any> = new Map(); // userId -> config

  private constructor() {
    super();
  }

  static getInstance(): TradingBotManager {
    if (!TradingBotManager.instance) {
      TradingBotManager.instance = new TradingBotManager();
    }
    return TradingBotManager.instance;
  }

  /**
   * Start a trading bot for a user
   */
  async startTradingBot(userId: number, sessionId: number, config: any): Promise<boolean> {
    try {
      // Check if user already has an active bot
      if (this.activeBots.has(userId)) {
        console.log(`User ${userId} already has an active trading bot`);
        return false;
      }

      // Get session data - we'll need to get it from the active session
      // For now, we'll assume the session exists since it was just created
      const session = { id: sessionId, user_id: userId, mode: config.mode || 'PAPER', initial_cash: config.initialCash || 10000 };

      // Create data provider based on config
      let provider;
      if (config.dataProvider === 'polygon' && process.env.POLYGON_API_KEY) {
        provider = new PolygonProvider(process.env.POLYGON_API_KEY);
        console.log(`✅ Created Polygon provider for user ${userId}`);
      } else {
        throw new Error('Polygon API key not found or invalid data provider');
      }

      // Create trading bot configuration
      // Handle both single strategy and strategy array formats
      let strategies;
      if (config.strategies) {
        // If strategies is already an array, use it
        strategies = Array.isArray(config.strategies) ? config.strategies : [config.strategies];
      } else if (config.strategy) {
        // If single strategy object is provided, convert to array
        strategies = [{
          name: config.strategy,
          enabled: true,
          symbols: config.symbols || ['AAPL'],
          parameters: config.strategyParameters || {}
        }];
      } else {
        // Default strategy
        strategies = [
          {
            name: 'MeanReversion',
            enabled: true,
            symbols: config.symbols || ['AAPL'],
            parameters: {
              window: 10,
              threshold: 0.02
            }
          }
        ];
      }

      const botConfig = {
        mode: (session.mode || 'PAPER') as 'PAPER' | 'LIVE',
        initialCash: session.initial_cash || 10000,
        symbols: config.symbols || ['AAPL'],
        strategies: strategies,
        riskManagement: {
          maxPositionSize: 0.1,
          stopLoss: 0.05,
          takeProfit: 0.1,
          maxDailyLoss: 0.05,
          maxDrawdown: 0.1
        },
        dataProvider: {
          type: (config.dataProvider || 'polygon') as 'polygon' | 'yahoo' | 'twelve_data',
          apiKey: process.env.POLYGON_API_KEY,
          rateLimit: 1000
        },
        logging: {
          level: 'info' as 'info' | 'debug' | 'warn' | 'error',
          saveToDatabase: true,
          consoleOutput: true,
          logTrades: true,
          logPortfolioSnapshots: true
        }
      };

      // Create and start the trading bot
      const bot = new TradingBot(botConfig, provider, userId);
      
      // Set up event listeners
      bot.on('trade', (trade) => {
        console.log(`🎯 Trade executed for user ${userId}:`, trade);
        this.emit('trade', { userId, sessionId, trade });
        
        // Save trade to database
        this.saveTradeToDatabase(sessionId, trade, userId);
      });

      bot.on('portfolio-update', (status) => {
        console.log(`📊 Portfolio update for user ${userId}:`, status);
        this.emit('portfolio-update', { userId, sessionId, status });
        
        // Save portfolio snapshot to database
        this.savePortfolioSnapshot(sessionId, status, userId);
      });

      bot.on('error', (error) => {
        console.error(`❌ Trading bot error for user ${userId}:`, error);
        this.emit('error', { userId, sessionId, error });
      });

      // Start the bot
      await bot.start();
      
      // Store the bot instance
      this.activeBots.set(userId, bot);
      this.botConfigs.set(userId, botConfig);
      
      console.log(`🚀 Trading bot started for user ${userId}, session ${sessionId}`);
      return true;

    } catch (error) {
      console.error(`❌ Error starting trading bot for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Stop a trading bot for a user
   */
  async stopTradingBot(userId: number): Promise<boolean> {
    try {
      const bot = this.activeBots.get(userId);
      if (!bot) {
        console.log(`No active trading bot found for user ${userId}`);
        return false;
      }

      // Stop the bot
      await bot.stop();
      
      // Remove from active bots
      this.activeBots.delete(userId);
      this.botConfigs.delete(userId);
      
      console.log(`🛑 Trading bot stopped for user ${userId}`);
      return true;

    } catch (error) {
      console.error(`❌ Error stopping trading bot for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get active trading bot for a user
   */
  getActiveBot(userId: number): TradingBot | null {
    return this.activeBots.get(userId) || null;
  }

  /**
   * Get all active bot user IDs
   */
  getActiveUserIds(): number[] {
    return Array.from(this.activeBots.keys());
  }

  /**
   * Check if user has an active trading bot
   */
  hasActiveBot(userId: number): boolean {
    return this.activeBots.has(userId);
  }

  /**
   * Get bot status for a user
   */
  getBotStatus(userId: number): any {
    const bot = this.activeBots.get(userId);
    if (!bot) {
      return null;
    }

    return {
      isRunning: (bot as any).isRunning,
      status: bot.getStatus(),
      config: this.botConfigs.get(userId)
    };
  }

  /**
   * Save trade to database
   */
  private async saveTradeToDatabase(sessionId: number, trade: any, userId: number): Promise<void> {
    try {
      await TradingDatabase.saveTrade({
        user_id: userId,
        symbol: trade.symbol,
        action: trade.action,
        quantity: trade.quantity,
        price: trade.price,
        timestamp: new Date().toISOString(),
        pnl: trade.pnl || 0,
        strategy: trade.strategy || 'Unknown',
        mode: 'PAPER'
      });
    } catch (error) {
      console.error('Error saving trade to database:', error);
    }
  }

  /**
   * Save portfolio snapshot to database
   */
  private async savePortfolioSnapshot(sessionId: number, status: any, userId: number): Promise<void> {
    try {
      await TradingDatabase.savePortfolioSnapshot({
        user_id: userId,
        total_value: status.totalValue,
        cash: status.cash,
        positions: JSON.stringify(status.positions),
        timestamp: new Date().toISOString(),
        mode: 'PAPER'
      });
    } catch (error) {
      console.error('Error saving portfolio snapshot to database:', error);
    }
  }

  /**
   * Stop all active trading bots
   */
  async stopAllBots(): Promise<void> {
    console.log('🛑 Stopping all active trading bots...');
    
    const userIds = Array.from(this.activeBots.keys());
    for (const userId of userIds) {
      try {
        await this.stopTradingBot(userId);
      } catch (error) {
        console.error(`Error stopping bot for user ${userId}:`, error);
      }
    }
    
    console.log('✅ All trading bots stopped');
  }

  /**
   * Get statistics about active bots
   */
  getStats(): any {
    return {
      activeBots: this.activeBots.size,
      userIds: Array.from(this.activeBots.keys()),
      botConfigs: Array.from(this.botConfigs.entries()).map(([userId, config]) => ({
        userId,
        mode: config.mode,
        symbols: config.symbols,
        strategies: config.strategies.map((s: any) => s.name)
      }))
    };
  }

  /**
   * Recover active sessions from database and restart their trading bots
   * This is called on server startup to handle graceful restarts
   */
  async recoverActiveSessions(): Promise<void> {
    try {
      console.log('🔄 Checking for active trading sessions to recover...');
      
      // Get all active trading sessions from database
      const activeSessions = await TradingDatabase.getActiveTradingSessions();
      
      if (activeSessions.length === 0) {
        console.log('✅ No active sessions found to recover');
        return;
      }

      console.log(`📊 Found ${activeSessions.length} active sessions to recover`);

      for (const session of activeSessions) {
        try {
          console.log(`🔄 Recovering session ${session.id} for user ${session.user_id}...`);
          
          // Get the session's trading configuration
          // For now, we'll use default configuration since we don't store the full config
          // In a production system, you'd want to store the full bot configuration
          const defaultConfig = {
            mode: session.mode || 'PAPER',
            initialCash: session.initial_cash || 10000,
            symbols: ['AAPL'], // Default symbols - in production, store this in session
            strategies: [
              {
                name: 'MeanReversion',
                enabled: true,
                symbols: ['AAPL'],
                parameters: {
                  window: 10,
                  threshold: 0.02
                }
              }
            ],
            dataProvider: 'polygon'
          };

          // Start the trading bot for this session
          const botStarted = await this.startTradingBot(
            session.user_id, 
            session.id!, 
            defaultConfig
          );

          if (botStarted) {
            console.log(`✅ Successfully recovered session ${session.id} for user ${session.user_id}`);
          } else {
            console.log(`⚠️  Failed to recover session ${session.id} for user ${session.user_id} (bot already active)`);
          }

        } catch (error) {
          console.error(`❌ Error recovering session ${session.id} for user ${session.user_id}:`, error);
          
          // Mark the session as failed to recover
          try {
            await TradingDatabase.updateTradingSession(session.id!, {
              status: 'STOPPED',
              end_time: new Date().toISOString()
            });
            console.log(`🛑 Marked session ${session.id} as stopped due to recovery failure`);
          } catch (updateError) {
            console.error(`❌ Error updating session ${session.id} status:`, updateError);
          }
        }
      }

      console.log(`✅ Session recovery complete. ${this.activeBots.size} bots are now active`);
      
    } catch (error) {
      console.error('❌ Error during session recovery:', error);
    }
  }

  /**
   * Graceful shutdown - stop all bots and update session statuses
   */
  async gracefulShutdown(): Promise<void> {
    console.log('🛑 Starting graceful shutdown of trading bots...');
    
    try {
      // Stop all active bots
      await this.stopAllBots();
      
      // Update all active sessions to stopped status
      const activeSessions = await TradingDatabase.getActiveTradingSessions();
      for (const session of activeSessions) {
        try {
          await TradingDatabase.updateTradingSession(session.id!, {
            status: 'STOPPED',
            end_time: new Date().toISOString()
          });
          console.log(`🛑 Marked session ${session.id} as stopped`);
        } catch (error) {
          console.error(`❌ Error updating session ${session.id}:`, error);
        }
      }
      
      console.log('✅ Graceful shutdown complete');
    } catch (error) {
      console.error('❌ Error during graceful shutdown:', error);
    }
  }
}
