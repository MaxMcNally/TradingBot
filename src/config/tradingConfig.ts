import { TradingMode, TradingModeType } from '../config';

export interface TradingConfig {
  mode: TradingModeType;
  initialCash: number;
  symbols: string[];
  strategies: StrategyConfig[];
  dataProvider: DataProviderConfig;
  riskManagement: RiskManagementConfig;
  logging: LoggingConfig;
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

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
