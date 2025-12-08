/**
 * Custom Strategy Implementation
 * 
 * Wraps the chainable indicator system to work as a BaseStrategy
 * for use in the live trading bot.
 */

import { AbstractStrategy, Signal } from './baseStrategy';
import { CustomStrategyExecutor, ConditionNode } from '../utils/indicators/executor';
import { PriceData } from '../utils/indicators/types';

export interface CustomStrategyConfig {
  name: string;
  buy_conditions: ConditionNode | ConditionNode[];
  sell_conditions: ConditionNode | ConditionNode[];
}

/**
 * Custom Strategy that uses chainable indicators
 */
export class CustomStrategy extends AbstractStrategy {
  private config: CustomStrategyConfig;
  private priceHistory: PriceData[] = [];
  private lastSignal: Signal = null;
  private maxHistory: number = 500; // Keep enough history for indicators

  constructor(config: CustomStrategyConfig) {
    super();
    this.config = config;
  }

  addPrice(price: number): void {
    // Add price to history
    // Since we only have close price from the stream, we'll create a minimal PriceData
    const now = new Date();
    const priceData: PriceData = {
      date: now.toISOString().split('T')[0],
      open: price, // Use current price as approximation
      high: price,
      low: price,
      close: price,
      volume: 0 // Volume not available from simple price stream
    };

    this.priceHistory.push(priceData);
    
    // Limit history size
    if (this.priceHistory.length > this.maxHistory) {
      this.priceHistory.shift();
    }

    // Generate signal using CustomStrategyService
    // Need at least some data to generate signals
    if (this.priceHistory.length >= 10) {
      try {
        const signal = CustomStrategyExecutor.executeStrategy(
          this.config.buy_conditions,
          this.config.sell_conditions,
          this.priceHistory
        );
        this.lastSignal = signal;
      } catch (error) {
        console.error('Error executing custom strategy:', error);
        this.lastSignal = null;
      }
    } else {
      this.lastSignal = null;
    }
  }

  /**
   * Add full OHLCV data (for warmup from historical data)
   */
  addPriceData(priceData: PriceData): void {
    this.priceHistory.push(priceData);
    
    // Limit history size
    if (this.priceHistory.length > this.maxHistory) {
      this.priceHistory.shift();
    }

    // Generate signal
    if (this.priceHistory.length >= 10) {
      try {
        const signal = CustomStrategyExecutor.executeStrategy(
          this.config.buy_conditions,
          this.config.sell_conditions,
          this.priceHistory
        );
        this.lastSignal = signal;
      } catch (error) {
        console.error('Error executing custom strategy:', error);
        this.lastSignal = null;
      }
    } else {
      this.lastSignal = null;
    }
  }

  getSignal(): Signal {
    return this.lastSignal;
  }

  getStrategyName(): string {
    return this.config.name || 'CustomStrategy';
  }

  reset(): void {
    super.reset();
    this.priceHistory = [];
    this.lastSignal = null;
  }

  /**
   * Get the minimum number of data points needed
   * This is calculated from the indicators used in the conditions
   */
  getMinPeriods(): number {
    // This is a conservative estimate
    // In practice, we'd need to parse the condition nodes to find the max period
    // For now, return a safe default
    return 50; // Most indicators need at most 50 periods
  }
}

