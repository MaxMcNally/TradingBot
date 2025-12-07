import { EventEmitter } from 'events';
import { DataProvider } from '../dataProviders/baseProvider';
import { Portfolio, PortfolioStatus } from '../portfolio';
import { TradingConfig, ConfigManager } from '../config/tradingConfig';
import { TradingDatabase, Trade, TradingSession, PortfolioSnapshot } from '../database/tradingSchema';
import { BaseStrategy, Signal } from '../strategies/baseStrategy';
import { SentimentAnalysisStrategy } from '../strategies/sentimentAnalysisStrategy';
import { MovingAverageStrategy } from '../strategies/movingAverage';
import { MeanReversionStrategy } from '../strategies/meanReversionStrategy';
import { MomentumStrategy } from '../strategies/momentumStrategy';
import { BollingerBandsStrategy } from '../strategies/bollingerBandsStrategy';
import { AlpacaBroker, AlpacaCredentials, BrokerTradeResult } from './AlpacaBroker';

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
  'alpaca-order': (result: BrokerTradeResult) => void;
}

export class TradingBot extends EventEmitter {
  private config: ConfigManager;
  private provider: DataProvider;
  private portfolio: Portfolio;
  private strategies: Map<string, BaseStrategy>;
  private database: TradingDatabase;
  private currentSession?: TradingSession;
  private isRunning: boolean = false;
  private latestPrices: Record<string, number> = {};
  private tradeCount: number = 0;
  private winningTradeCount: number = 0;
  private totalPnL: number = 0;
  private userId: number;
  private wsConnection: any = null;
  private dailyPnL: number = 0;
  private sessionStartValue: number = 0;
  private lastTradeDate: string = '';
  
  // Alpaca broker integration (optional)
  private alpacaBroker: AlpacaBroker | null = null;
  private useAlpacaBroker: boolean = false;

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
      if (!strategyConfig.enabled) return;

      strategyConfig.symbols.forEach(symbol => {
        let strategy: BaseStrategy;

        switch (strategyConfig.name) {
          case 'MovingAverage':
            const { shortWindow, longWindow } = strategyConfig.parameters;
            strategy = new MovingAverageStrategy(shortWindow, longWindow);
            break;

          case 'MeanReversion':
            const { window, threshold } = strategyConfig.parameters;
            strategy = new MeanReversionStrategy({ window, threshold });
            break;

          case 'Momentum':
            const { rsiWindow, rsiOverbought, rsiOversold, momentumWindow, momentumThreshold } = strategyConfig.parameters;
            strategy = new MomentumStrategy({ rsiWindow, rsiOverbought, rsiOversold, momentumWindow, momentumThreshold });
            break;

          case 'BollingerBands':
            const { window: bbWindow, multiplier } = strategyConfig.parameters;
            strategy = new BollingerBandsStrategy({ window: bbWindow, multiplier, maType: 'SMA' });
            break;

          case 'SentimentAnalysis':
            const { lookbackDays, pollIntervalMinutes, minArticles, buyThreshold, sellThreshold, titleWeight, recencyHalfLifeHours, tiingoApiKey } = strategyConfig.parameters;
            strategy = new SentimentAnalysisStrategy({
              symbol,
              lookbackDays,
              pollIntervalMinutes,
              minArticles,
              buyThreshold,
              sellThreshold,
              titleWeight,
              recencyHalfLifeHours,
              tiingoApiKey,
            });
            break;

          default:
            console.warn(`Unknown strategy: ${strategyConfig.name}. Skipping.`);
            return;
        }

        this.strategies.set(symbol, strategy);
        console.log(`🎯 Initialized ${strategy.getStrategyName()} strategy for ${symbol}`);
      });
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
        total_trades: 0,
        winning_trades: 0,
        status: 'ACTIVE'
      });

      this.isRunning = true;
      this.sessionStartValue = tradingConfig.initialCash;
      this.lastTradeDate = new Date().toISOString().split('T')[0];
      this.emit('session-started', this.currentSession);

      console.log(`🚀 Trading bot started in ${tradingConfig.mode.toUpperCase()} mode`);
      console.log(`📊 Trading symbols: ${tradingConfig.symbols.join(', ')}`);
      console.log(`💰 Initial cash: $${tradingConfig.initialCash.toFixed(2)}`);
      console.log(`🛡️ Risk management: Max position ${(tradingConfig.riskManagement.maxPositionSize * 100).toFixed(0)}%, Stop loss ${(tradingConfig.riskManagement.stopLoss * 100).toFixed(0)}%, Take profit ${(tradingConfig.riskManagement.takeProfit * 100).toFixed(0)}%`);

      // Warmup strategies with historical data if enabled
      const warmupConfig = this.config.getWarmupConfig();
      if (warmupConfig.enabled) {
        console.log('🔥 Warming up strategies with historical data...');
        await this.warmupStrategies();
      }

      // Fetch initial quotes
      await this.fetchInitialQuotes();

      // Start live data stream
      await this.startDataStream();

    } catch (error) {
      this.emit('error', error as Error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    try {
      this.isRunning = false;

      // Close WebSocket connection
      if (this.wsConnection) {
        console.log('🔌 Closing WebSocket connection...');
        this.wsConnection.close();
        this.wsConnection = null;
      }

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

  /**
   * Warmup strategies with historical data to enable immediate trading
   */
  private async warmupStrategies(): Promise<void> {
    const tradingConfig = this.config.getConfig();
    const warmupConfig = this.config.getWarmupConfig();
    const maxLookback = this.config.getMaxLookbackWindow();
    
    // Calculate the number of days to fetch (max lookback + buffer)
    let daysToFetch = Math.min(maxLookback + warmupConfig.bufferDays, warmupConfig.maxLookbackDays);
    
    // Adjust for weekends if enabled
    if (warmupConfig.skipWeekends) {
      // Add extra days to account for weekends (roughly 2/7 of days are weekends)
      daysToFetch = Math.ceil(daysToFetch * 1.3);
    }
    
    console.log(`📊 Fetching ${daysToFetch} days of historical data for warmup (max lookback: ${maxLookback} days)`);
    console.log(`📅 Data interval: ${warmupConfig.dataInterval}, Skip weekends: ${warmupConfig.skipWeekends}`);
    
    // Calculate start date (daysToFetch days ago)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - daysToFetch);
    
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    // Get unique symbols from all enabled strategies
    const symbolsToWarmup = new Set<string>();
    tradingConfig.strategies
      .filter(s => s.enabled)
      .forEach(strategy => {
        strategy.symbols.forEach(symbol => symbolsToWarmup.add(symbol));
      });
    
    let warmupErrors: string[] = [];
    
    // Fetch historical data for each symbol
    for (const symbol of symbolsToWarmup) {
      try {
        console.log(`📈 Fetching warmup data for ${symbol}...`);
        const historicalData = await this.provider.getHistorical(symbol, warmupConfig.dataInterval, startDateStr, endDateStr);
        
        if (historicalData && historicalData.length > 0) {
          // Pre-populate strategies with historical data
          const strategiesForSymbol = Array.from(this.strategies.entries())
            .filter(([sym, _]) => sym === symbol)
            .map(([_, strategy]) => strategy);
          
          for (const strategy of strategiesForSymbol) {
            // Add historical prices to strategy (excluding the last one to avoid double-processing)
            for (let i = 0; i < historicalData.length - 1; i++) {
              const dataPoint = historicalData[i];
              const price = (dataPoint as any).close || (dataPoint as any).c;
              if (price) {
                strategy.addPrice(price);
              }
            }
          }
          
          // Set the latest price from the most recent historical data
          const latestDataPoint = historicalData[historicalData.length - 1];
          const latestPrice = (latestDataPoint as any).close || (latestDataPoint as any).c;
          if (latestPrice) {
            this.latestPrices[symbol] = latestPrice;
          }
          
          console.log(`✅ Warmed up ${symbol} with ${historicalData.length} data points`);
        } else {
          const errorMsg = `No historical data found for ${symbol}`;
          console.warn(`⚠️ ${errorMsg}`);
          warmupErrors.push(errorMsg);
        }
      } catch (error) {
        const errorMsg = `Failed to warmup ${symbol}: ${error instanceof Error ? error.message : String(error)}`;
        console.error(`❌ ${errorMsg}`);
        warmupErrors.push(errorMsg);
        
        // Continue with other symbols even if one fails
      }
    }
    
    // Handle warmup errors
    if (warmupErrors.length > 0) {
      const errorMessage = `Warmup completed with ${warmupErrors.length} errors: ${warmupErrors.join(', ')}`;
      
      if (warmupConfig.failOnWarmupError) {
        throw new Error(errorMessage);
      } else {
        console.warn(`⚠️ ${errorMessage}`);
      }
    }
    
    console.log('🎯 Strategy warmup completed - ready for immediate trading!');
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

  private async startDataStream(): Promise<void> {
    const tradingConfig = this.config.getConfig();
    
    try {
      console.log(`📡 Connecting to data stream for symbols: ${tradingConfig.symbols.join(', ')}`);
      
      this.wsConnection = await this.provider.connectStream(tradingConfig.symbols, (data) => {
        if (!this.isRunning) return;

        try {
          this.processMarketData(data);
        } catch (error) {
          this.emit('error', error as Error);
        }
      });

      console.log('✅ Data stream connected successfully');
      
      // Handle WebSocket connection events
      if (this.wsConnection) {
        this.wsConnection.on('close', () => {
          console.log('🔌 WebSocket connection closed');
          if (this.isRunning) {
            console.log('🔄 Attempting to reconnect...');
            setTimeout(() => this.startDataStream(), 5000);
          }
        });

        this.wsConnection.on('error', (error: any) => {
          console.error('❌ WebSocket error:', error);
          this.emit('error', error);
        });
      }
    } catch (error) {
      console.error('❌ Failed to connect to data stream:', error);
      this.emit('error', error as Error);
      
      // Retry connection after 5 seconds
      if (this.isRunning) {
        console.log('🔄 Retrying connection in 5 seconds...');
        setTimeout(() => this.startDataStream(), 5000);
      }
    }
  }

  private async processMarketData(data: any[]): Promise<void> {
    const trades = data.filter((d) => d.ev === "T");
    if (trades.length === 0) return;

    const tradingConfig = this.config.getConfig();
    
    for (const trade of trades) {
      const { sym: symbol, p: price } = trade;
      
      // Only process trades for symbols we're trading
      if (!tradingConfig.symbols.includes(symbol)) continue;
      
      this.latestPrices[symbol] = price;

      // Update strategy and get signal
      const strategy = this.strategies.get(symbol);
      if (strategy) {
        strategy.addPrice(price);
        const signal: Signal = strategy.getSignal();

        // Check for stop loss or take profit first
        const riskSignal = this.checkStopLossTakeProfit(symbol, price);
        if (riskSignal === 'STOP_LOSS' || riskSignal === 'TAKE_PROFIT') {
          await this.executeTrade(symbol, price, 'SELL', riskSignal);
        } else if (signal) {
          // Check risk management rules before executing strategy signal
          const riskCheck = this.shouldExecuteTrade(symbol, signal, price);
          if (riskCheck.allowed) {
            await this.executeTrade(symbol, price, signal);
          } else {
            console.log(`🚫 Trade blocked: ${riskCheck.reason}`);
          }
        }
      }
    }

    // Update portfolio status (throttled to avoid too frequent updates)
    if (Math.random() < 0.1) { // 10% chance to update on each trade batch
      await this.updatePortfolioStatus();
    }
  }

  private async executeTrade(symbol: string, price: number, signal: Signal, reason?: string): Promise<void> {
    try {
      // Don't execute trade if signal is null
      if (signal === null) {
        return;
      }

      const tradingConfig = this.config.getConfig();
      const quantity = 1; // Fixed quantity for now

      // Execute on Alpaca broker if connected
      let alpacaResult: BrokerTradeResult | null = null;
      if (this.useAlpacaBroker && this.alpacaBroker && this.alpacaBroker.isReady()) {
        try {
          if (signal === "BUY") {
            alpacaResult = await this.alpacaBroker.marketBuy(symbol, quantity);
          } else if (signal === "SELL") {
            alpacaResult = await this.alpacaBroker.marketSell(symbol, quantity);
          }

          if (alpacaResult) {
            this.emit('alpaca-order', alpacaResult);
            if (alpacaResult.success) {
              console.log(`🔗 Alpaca: ${signal} order submitted - ID: ${alpacaResult.orderId}, Status: ${alpacaResult.status}`);
            } else {
              console.error(`❌ Alpaca: Order failed - ${alpacaResult.error}`);
              // Continue with local portfolio tracking even if Alpaca fails
            }
          }
        } catch (alpacaError) {
          console.error('Alpaca order execution error:', alpacaError);
          // Continue with local portfolio tracking
        }
      }

      // Update local portfolio tracking
      if (signal === "BUY") {
        this.portfolio.buy(symbol, price, quantity);
      } else if (signal === "SELL") {
        this.portfolio.sell(symbol, price, quantity);
      }

      // Save trade to database
      const trade: Omit<Trade, 'id' | 'created_at'> = {
        user_id: this.userId,
        symbol,
        action: signal, // Now guaranteed to be 'BUY' | 'SELL'
        quantity,
        price,
        timestamp: new Date().toISOString(),
        strategy: this.strategies.get(symbol)?.getStrategyName() || 'Unknown',
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
        this.updateDailyPnL(trade.pnl);
      }

      this.emit('trade', savedTrade);
      
      const reasonText = reason ? ` (${reason})` : '';
      const alpacaText = alpacaResult?.success ? ' [Alpaca ✓]' : (this.useAlpacaBroker ? ' [Alpaca ✗]' : '');
      console.log(`📊 ${signal} ${quantity} ${symbol} at $${price.toFixed(2)}${reasonText}${alpacaText}`);
      if (trade.pnl !== undefined) {
        const pnlColor = trade.pnl >= 0 ? '🟢' : '🔴';
        console.log(`${pnlColor} P&L: $${trade.pnl.toFixed(2)} | Daily P&L: $${this.dailyPnL.toFixed(2)}`);
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

  /**
   * Connect an Alpaca broker for paper trading
   * @param credentials Alpaca API credentials
   * @returns True if connected successfully
   */
  async connectAlpacaBroker(credentials: AlpacaCredentials): Promise<boolean> {
    try {
      // Force paper trading in non-production
      const NODE_ENV = process.env.NODE_ENV || 'development';
      if (NODE_ENV !== 'production') {
        credentials.isPaper = true;
      }

      this.alpacaBroker = new AlpacaBroker(credentials);
      const connected = await this.alpacaBroker.connect();
      
      if (connected) {
        this.useAlpacaBroker = true;
        console.log(`🔗 TradingBot: Alpaca broker connected (${this.alpacaBroker.getTradingMode()} mode)`);
        return true;
      } else {
        this.alpacaBroker = null;
        this.useAlpacaBroker = false;
        return false;
      }
    } catch (error) {
      console.error('TradingBot: Failed to connect Alpaca broker:', error);
      this.alpacaBroker = null;
      this.useAlpacaBroker = false;
      return false;
    }
  }

  /**
   * Disconnect the Alpaca broker
   */
  disconnectAlpacaBroker(): void {
    this.alpacaBroker = null;
    this.useAlpacaBroker = false;
    console.log('🔌 TradingBot: Alpaca broker disconnected');
  }

  /**
   * Check if Alpaca broker is connected
   */
  isAlpacaConnected(): boolean {
    return this.useAlpacaBroker && this.alpacaBroker !== null && this.alpacaBroker.isReady();
  }

  /**
   * Get Alpaca broker status
   */
  getAlpacaStatus(): { connected: boolean; mode: 'paper' | 'live' | null } {
    if (!this.alpacaBroker || !this.useAlpacaBroker) {
      return { connected: false, mode: null };
    }
    return {
      connected: this.alpacaBroker.isReady(),
      mode: this.alpacaBroker.getTradingMode(),
    };
  }

  /**
   * Check if a trade should be executed based on risk management rules
   */
  private shouldExecuteTrade(symbol: string, action: 'BUY' | 'SELL', price: number): { allowed: boolean; reason?: string } {
    const tradingConfig = this.config.getConfig();
    const riskConfig = tradingConfig.riskManagement;
    const portfolioStatus = this.portfolio.status(this.latestPrices);
    
    // Check daily P&L reset
    const currentDate = new Date().toISOString().split('T')[0];
    if (currentDate !== this.lastTradeDate) {
      this.dailyPnL = 0;
      this.lastTradeDate = currentDate;
    }

    // Check max daily loss
    const dailyLossPercentage = Math.abs(this.dailyPnL) / this.sessionStartValue;
    if (dailyLossPercentage >= riskConfig.maxDailyLoss) {
      return { 
        allowed: false, 
        reason: `Daily loss limit reached: ${(dailyLossPercentage * 100).toFixed(2)}% >= ${(riskConfig.maxDailyLoss * 100).toFixed(2)}%` 
      };
    }

    // Check max drawdown
    const currentDrawdown = (this.sessionStartValue - portfolioStatus.totalValue) / this.sessionStartValue;
    if (currentDrawdown >= riskConfig.maxDrawdown) {
      return { 
        allowed: false, 
        reason: `Max drawdown reached: ${(currentDrawdown * 100).toFixed(2)}% >= ${(riskConfig.maxDrawdown * 100).toFixed(2)}%` 
      };
    }

    // Check position size for BUY orders
    if (action === 'BUY') {
      const currentPosition = portfolioStatus.positions[symbol];
      const positionValue = currentPosition.shares * price;
      const maxPositionValue = portfolioStatus.totalValue * riskConfig.maxPositionSize;
      
      if (positionValue >= maxPositionValue) {
        return { 
          allowed: false, 
          reason: `Position size limit reached for ${symbol}: ${(positionValue / portfolioStatus.totalValue * 100).toFixed(2)}% >= ${(riskConfig.maxPositionSize * 100).toFixed(2)}%` 
        };
      }
    }

    return { allowed: true };
  }

  /**
   * Check if stop loss or take profit should be triggered
   */
  private checkStopLossTakeProfit(symbol: string, currentPrice: number): 'STOP_LOSS' | 'TAKE_PROFIT' | null {
    const tradingConfig = this.config.getConfig();
    const riskConfig = tradingConfig.riskManagement;
    const portfolioStatus = this.portfolio.status(this.latestPrices);
    const position = portfolioStatus.positions[symbol];

    if (position.shares <= 0) return null;

    const entryPrice = position.avgPrice;
    const priceChange = (currentPrice - entryPrice) / entryPrice;

    // Check stop loss
    if (priceChange <= -riskConfig.stopLoss) {
      return 'STOP_LOSS';
    }

    // Check take profit
    if (priceChange >= riskConfig.takeProfit) {
      return 'TAKE_PROFIT';
    }

    return null;
  }

  /**
   * Update daily P&L tracking
   */
  private updateDailyPnL(tradePnL: number): void {
    this.dailyPnL += tradePnL;
  }

  /**
   * Check if all strategies are ready for immediate trading (have enough historical data)
   */
  areStrategiesReady(): boolean {
    const tradingConfig = this.config.getConfig();
    const warmupConfig = this.config.getWarmupConfig();
    
    if (!warmupConfig.enabled) {
      return false; // Strategies need warmup to be ready
    }
    
    const maxLookback = this.config.getMaxLookbackWindow();
    
    // Check if we have strategies for all symbols
    for (const symbol of tradingConfig.symbols) {
      const strategy = this.strategies.get(symbol);
      if (!strategy) {
        return false; // No strategy for this symbol
      }
    }
    
    return true; // All strategies should be warmed up
  }

  /**
   * Get warmup status information
   */
  getWarmupStatus(): {
    enabled: boolean;
    maxLookbackDays: number;
    bufferDays: number;
    strategiesReady: boolean;
    symbolsWarmedUp: string[];
  } {
    const warmupConfig = this.config.getWarmupConfig();
    const tradingConfig = this.config.getConfig();
    
    return {
      enabled: warmupConfig.enabled,
      maxLookbackDays: warmupConfig.maxLookbackDays,
      bufferDays: warmupConfig.bufferDays,
      strategiesReady: this.areStrategiesReady(),
      symbolsWarmedUp: tradingConfig.symbols.filter(symbol => this.strategies.has(symbol))
    };
  }
}
