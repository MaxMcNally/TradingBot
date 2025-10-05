import { EventEmitter } from 'events';
import { DataProvider } from '../dataProviders/baseProvider';
import { Portfolio, PortfolioStatus } from '../portfolio';
import { TradingConfig, ConfigManager } from '../config/tradingConfig';
import { TradingDatabase, Trade, TradingSession, PortfolioSnapshot } from '../database/tradingSchema';
import { Signal } from '../strategies/movingAverage';
import { MovingAverageStrategy } from '../strategies/movingAverage';

export interface BotStatus {
  isRunning: boolean;
  currentSession?: TradingSession;
  portfolio: PortfolioStatus;
  lastUpdate: string;
  totalTrades: number;
  winningTrades: number;
  totalPnL: number;
}

export interface BotEvents {
  'trade': (trade: Trade) => void;
  'portfolio-update': (status: PortfolioStatus) => void;
  'error': (error: Error) => void;
  'session-started': (session: TradingSession) => void;
  'session-ended': (session: TradingSession) => void;
}

export class TradingBot extends EventEmitter {
  private config: ConfigManager;
  private provider: DataProvider;
  private portfolio: Portfolio;
  private strategies: Map<string, MovingAverageStrategy>;
  private database: TradingDatabase;
  private currentSession?: TradingSession;
  private isRunning: boolean = false;
  private latestPrices: Record<string, number> = {};
  private tradeCount: number = 0;
  private winningTradeCount: number = 0;
  private totalPnL: number = 0;
  private userId: number;

  constructor(config: TradingConfig, provider: DataProvider, userId: number) {
    super();
    this.config = new ConfigManager(config);
    this.provider = provider;
    this.database = new TradingDatabase();
    this.userId = userId;
    
    // Initialize portfolio
    const tradingConfig = this.config.getConfig();
    this.portfolio = new Portfolio(
      tradingConfig.initialCash,
      tradingConfig.mode,
      tradingConfig.symbols
    );

    // Initialize strategies
    this.strategies = new Map();
    this.initializeStrategies();
  }

  private initializeStrategies(): void {
    const tradingConfig = this.config.getConfig();
    
    tradingConfig.strategies.forEach(strategyConfig => {
      if (strategyConfig.enabled && strategyConfig.name === 'MovingAverage') {
        const { shortWindow, longWindow } = strategyConfig.parameters;
        strategyConfig.symbols.forEach(symbol => {
          this.strategies.set(symbol, new MovingAverageStrategy(shortWindow, longWindow));
        });
      }
    });
  }

  async start(): Promise<void> {
    try {
      // Validate configuration
      const validation = this.config.validateConfig();
      if (!validation.valid) {
        throw new Error(`Configuration validation failed: ${validation.errors.join(', ')}`);
      }

      // Initialize database tables
      await TradingDatabase.initializeTables();

      // Create new trading session
      const tradingConfig = this.config.getConfig();
      this.currentSession = await TradingDatabase.createTradingSession({
        user_id: this.userId,
        start_time: new Date().toISOString(),
        mode: tradingConfig.mode,
        initial_cash: tradingConfig.initialCash,
        status: 'ACTIVE'
      });

      this.isRunning = true;
      this.emit('session-started', this.currentSession);

      console.log(`🚀 Trading bot started in ${tradingConfig.mode.toUpperCase()} mode`);
      console.log(`📊 Trading symbols: ${tradingConfig.symbols.join(', ')}`);
      console.log(`💰 Initial cash: $${tradingConfig.initialCash.toFixed(2)}`);

      // Fetch initial quotes
      await this.fetchInitialQuotes();

      // Start live data stream
      this.startDataStream();

    } catch (error) {
      this.emit('error', error as Error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    try {
      this.isRunning = false;

      if (this.currentSession) {
        const finalStatus = this.portfolio.status(this.latestPrices);
        
        await TradingDatabase.updateTradingSession(this.currentSession.id!, {
          end_time: new Date().toISOString(),
          final_cash: finalStatus.cash,
          total_trades: this.tradeCount,
          winning_trades: this.winningTradeCount,
          total_pnl: this.totalPnL,
          status: 'COMPLETED'
        });

        this.emit('session-ended', this.currentSession);
        console.log('🛑 Trading bot stopped');
      }
    } catch (error) {
      this.emit('error', error as Error);
      throw error;
    }
  }

  private async fetchInitialQuotes(): Promise<void> {
    const tradingConfig = this.config.getConfig();
    
    console.log('📈 Fetching initial quotes...');
    for (const symbol of tradingConfig.symbols) {
      try {
        const quote = await this.provider.getQuote(symbol);
        this.latestPrices[symbol] = quote.price || 0;
        console.log(`Initial Quote [${symbol}]: $${quote.price?.toFixed(2) || 'N/A'}`);
      } catch (error) {
        console.error(`Failed to fetch quote for ${symbol}:`, error);
        this.latestPrices[symbol] = 0;
      }
    }
  }

  private startDataStream(): void {
    const tradingConfig = this.config.getConfig();
    
    this.provider.connectStream(tradingConfig.symbols, (data) => {
      if (!this.isRunning) return;

      try {
        this.processMarketData(data);
      } catch (error) {
        this.emit('error', error as Error);
      }
    });
  }

  private async processMarketData(data: any[]): Promise<void> {
    const trades = data.filter((d) => d.ev === "T");
    if (trades.length === 0) return;

    for (const trade of trades) {
      const { sym: symbol, p: price } = trade;
      this.latestPrices[symbol] = price;

      // Update strategy and get signal
      const strategy = this.strategies.get(symbol);
      if (strategy) {
        strategy.addPrice(price);
        const signal: Signal = strategy.getSignal();

        if (signal) {
          await this.executeTrade(symbol, price, signal);
        }
      }
    }

    // Update portfolio status
    await this.updatePortfolioStatus();
  }

  private async executeTrade(symbol: string, price: number, signal: Signal): Promise<void> {
    try {
      const tradingConfig = this.config.getConfig();
      const quantity = 1; // Fixed quantity for now

      if (signal === "BUY") {
        this.portfolio.buy(symbol, price, quantity);
      } else if (signal === "SELL") {
        this.portfolio.sell(symbol, price, quantity);
      }

      // Save trade to database
      const trade: Omit<Trade, 'id' | 'created_at'> = {
        user_id: this.userId,
        symbol,
        action: signal,
        quantity,
        price,
        timestamp: new Date().toISOString(),
        strategy: 'MovingAverage',
        mode: tradingConfig.mode,
        pnl: signal === 'SELL' ? this.calculateTradePnL(symbol, price) : undefined
      };

      const savedTrade = await TradingDatabase.saveTrade(trade);
      this.tradeCount++;
      
      if (trade.pnl && trade.pnl > 0) {
        this.winningTradeCount++;
      }
      
      if (trade.pnl) {
        this.totalPnL += trade.pnl;
      }

      this.emit('trade', savedTrade);
      
      console.log(`📊 ${signal} ${quantity} ${symbol} at $${price.toFixed(2)}`);
      if (trade.pnl !== undefined) {
        console.log(`💰 P&L: $${trade.pnl.toFixed(2)}`);
      }

    } catch (error) {
      this.emit('error', error as Error);
    }
  }

  private calculateTradePnL(symbol: string, sellPrice: number): number {
    const position = this.portfolio.status().positions[symbol];
    if (position.shares > 0) {
      return (sellPrice - position.avgPrice) * 1; // quantity = 1
    }
    return 0;
  }

  private async updatePortfolioStatus(): Promise<void> {
    try {
      const status = this.portfolio.status(this.latestPrices);
      
      // Save portfolio snapshot to database
      const tradingConfig = this.config.getConfig();
      if (tradingConfig.logging.logPortfolioSnapshots) {
        const snapshot: Omit<PortfolioSnapshot, 'id' | 'created_at'> = {
          user_id: this.userId,
          timestamp: new Date().toISOString(),
          total_value: status.totalValue,
          cash: status.cash,
          positions: JSON.stringify(status.positions),
          mode: tradingConfig.mode
        };

        await TradingDatabase.savePortfolioSnapshot(snapshot);
      }

      this.emit('portfolio-update', status);

      // Log portfolio status
      if (tradingConfig.logging.consoleOutput) {
        console.log(
          `💼 Portfolio: $${status.totalValue.toFixed(2)} | Cash: $${status.cash.toFixed(2)} | Trades: ${this.tradeCount}`
        );
      }

    } catch (error) {
      this.emit('error', error as Error);
    }
  }

  getStatus(): BotStatus {
    return {
      isRunning: this.isRunning,
      currentSession: this.currentSession,
      portfolio: this.portfolio.status(this.latestPrices),
      lastUpdate: new Date().toISOString(),
      totalTrades: this.tradeCount,
      winningTrades: this.winningTradeCount,
      totalPnL: this.totalPnL
    };
  }

  getConfig(): TradingConfig {
    return this.config.getConfig();
  }

  updateConfig(updates: Partial<TradingConfig>): void {
    this.config.updateConfig(updates);
  }

  getUserId(): number {
    return this.userId;
  }
}
