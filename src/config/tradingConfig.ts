import { TradingMode, TradingModeType } from '../config';

export interface TradingConfig {
  mode: TradingModeType;
  initialCash: number;
  symbols: string[];
  strategies: StrategyConfig[];
  dataProvider: DataProviderConfig;
  riskManagement: RiskManagementConfig;
  logging: LoggingConfig;
  warmup?: WarmupConfig;
}

export interface WarmupConfig {
  enabled: boolean;
  maxLookbackDays: number; // Maximum days to fetch for warmup (default: 200)
  bufferDays: number; // Extra days beyond max lookback (default: 10)
  skipWeekends: boolean; // Skip weekend days when calculating lookback (default: true)
  dataInterval: 'day' | 'hour' | 'minute'; // Data interval for warmup (default: 'day')
  failOnWarmupError: boolean; // Whether to fail bot startup if warmup fails (default: false)
}

export interface StrategyConfig {
  name: string;
  enabled: boolean;
  parameters: Record<string, any>;
  symbols: string[];
}

export interface DataProviderConfig {
  type: 'polygon' | 'yahoo' | 'twelve_data';
  apiKey?: string;
  rateLimit?: number; // requests per minute
}

export interface RiskManagementConfig {
  maxPositionSize: number; // percentage of portfolio
  stopLoss: number; // percentage
  takeProfit: number; // percentage
  maxDailyLoss: number; // percentage
  maxDrawdown: number; // percentage
}

export interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  saveToDatabase: boolean;
  consoleOutput: boolean;
  logTrades: boolean;
  logPortfolioSnapshots: boolean;
}

export const defaultTradingConfig: TradingConfig = {
  mode: TradingMode.PAPER,
  initialCash: 10000,
  symbols: ['SPY', 'QQQ', 'AAPL', 'TSLA'],
  strategies: [
    {
      name: 'MovingAverage',
      enabled: true,
      parameters: { shortWindow: 5, longWindow: 10 },
      symbols: ['SPY', 'QQQ', 'AAPL', 'TSLA']
    },
    {
      name: 'SentimentAnalysis',
      enabled: false,
      parameters: {
        lookbackDays: 3,
        pollIntervalMinutes: 15,
        minArticles: 3,
        buyThreshold: 0.4,
        sellThreshold: -0.4,
        titleWeight: 2.0,
        recencyHalfLifeHours: 12
      },
      symbols: ['AAPL']
    }
  ],
  dataProvider: {
    type: 'polygon',
    rateLimit: 1000
  },
  riskManagement: {
    maxPositionSize: 0.2, // 20% of portfolio per position
    stopLoss: 0.05, // 5% stop loss
    takeProfit: 0.15, // 15% take profit
    maxDailyLoss: 0.1, // 10% max daily loss
    maxDrawdown: 0.2 // 20% max drawdown
  },
  logging: {
    level: 'info',
    saveToDatabase: true,
    consoleOutput: true,
    logTrades: true,
    logPortfolioSnapshots: true
  },
  warmup: {
    enabled: true,
    maxLookbackDays: 200, // Maximum days to fetch for warmup
    bufferDays: 10, // Extra days beyond max lookback
    skipWeekends: true, // Skip weekend days when calculating lookback
    dataInterval: 'day' as const, // Data interval for warmup
    failOnWarmupError: false // Don't fail bot startup if warmup fails
  }
};

export class ConfigManager {
  private config: TradingConfig;

  constructor(config?: Partial<TradingConfig>) {
    this.config = { ...defaultTradingConfig, ...config };
  }

  getConfig(): TradingConfig {
    return this.config;
  }

  updateConfig(updates: Partial<TradingConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  getStrategyConfig(strategyName: string): StrategyConfig | undefined {
    return this.config.strategies.find(s => s.name === strategyName);
  }

  isStrategyEnabled(strategyName: string): boolean {
    const strategy = this.getStrategyConfig(strategyName);
    return strategy?.enabled || false;
  }

  getSymbolsForStrategy(strategyName: string): string[] {
    const strategy = this.getStrategyConfig(strategyName);
    return strategy?.symbols || [];
  }

  /**
   * Calculate the maximum lookback window needed across all enabled strategies
   * @returns Maximum lookback window in days
   */
  getMaxLookbackWindow(): number {
    const enabledStrategies = this.config.strategies.filter(s => s.enabled);
    let maxLookback = 0;

    for (const strategy of enabledStrategies) {
      const params = strategy.parameters;
      let strategyLookback = 0;

      switch (strategy.name) {
        case 'MovingAverage':
          // Use the longer of shortWindow and longWindow
          strategyLookback = Math.max(params.shortWindow || 10, params.longWindow || 30);
          break;
        
        case 'MeanReversion':
          strategyLookback = params.window || 20;
          break;
        
        case 'Momentum':
          // Use the longer of rsiWindow and momentumWindow
          strategyLookback = Math.max(params.rsiWindow || 14, params.momentumWindow || 10);
          break;
        
        case 'BollingerBands':
          strategyLookback = params.window || 20;
          break;
        
        case 'Breakout':
          strategyLookback = params.lookbackWindow || 20;
          break;
        
        case 'SentimentAnalysis':
          strategyLookback = params.lookbackDays || 3;
          break;
        
        case 'CUSTOM':
          // Custom strategies may use various indicators
          // Use a conservative default that covers most indicators (MACD needs ~35, others need less)
          strategyLookback = 50;
          break;
        
        default:
          // For unknown strategies, use a conservative default
          strategyLookback = 30;
          break;
      }

      maxLookback = Math.max(maxLookback, strategyLookback);
    }

    return maxLookback;
  }

  /**
   * Get the warmup configuration with defaults
   */
  getWarmupConfig(): WarmupConfig {
    return {
      enabled: true,
      maxLookbackDays: 200,
      bufferDays: 10,
      skipWeekends: true,
      dataInterval: 'day',
      failOnWarmupError: false,
      ...this.config.warmup
    };
  }

  validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (this.config.initialCash <= 0) {
      errors.push('Initial cash must be greater than 0');
    }

    if (this.config.symbols.length === 0) {
      errors.push('At least one symbol must be specified');
    }

    if (this.config.strategies.length === 0) {
      errors.push('At least one strategy must be configured');
    }

    const enabledStrategies = this.config.strategies.filter(s => s.enabled);
    if (enabledStrategies.length === 0) {
      errors.push('At least one strategy must be enabled');
    }

    if (this.config.riskManagement.maxPositionSize <= 0 || this.config.riskManagement.maxPositionSize > 1) {
      errors.push('Max position size must be between 0 and 1');
    }

    if (this.config.riskManagement.stopLoss <= 0 || this.config.riskManagement.stopLoss > 1) {
      errors.push('Stop loss must be between 0 and 1');
    }

    if (this.config.riskManagement.takeProfit <= 0 || this.config.riskManagement.takeProfit > 1) {
      errors.push('Take profit must be between 0 and 1');
    }

    // Validate warmup configuration
    const warmupConfig = this.getWarmupConfig();
    if (warmupConfig.enabled) {
      const maxLookback = this.getMaxLookbackWindow();
      if (maxLookback > warmupConfig.maxLookbackDays) {
        errors.push(`Strategy lookback window (${maxLookback} days) exceeds maximum allowed (${warmupConfig.maxLookbackDays} days)`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
