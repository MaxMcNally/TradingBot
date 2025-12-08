/**
 * Custom Strategy Executor
 * 
 * Executes custom strategies built with chainable indicators.
 * This is a copy of the logic from api/services/customStrategyService
 * to avoid cross-folder dependencies.
 */

import {
  sma,
  ema,
  rsi,
  macd,
  bollingerBands,
  vwap,
  ConditionSignalGenerator,
  Condition,
  PriceData
} from './index';
// ConditionNode type definition (to avoid cross-folder dependency)
export interface ConditionNode {
  type: 'indicator' | 'and' | 'or' | 'not';
  indicator?: {
    type: 'sma' | 'ema' | 'rsi' | 'macd' | 'bollingerBands' | 'vwap';
    params: Record<string, any>;
    condition: string;
    value?: number | string;
  };
  children?: ConditionNode[];
}

/**
 * Service to execute custom strategies built with chainable indicators
 */
export class CustomStrategyExecutor {
  /**
   * Build a Condition from a ConditionNode structure
   */
  private static buildCondition(node: ConditionNode): Condition {
    if (node.type === 'indicator' && node.indicator) {
      const { type, params, condition, value } = node.indicator;
      
      // Create the indicator instance
      let indicator: any;
      switch (type) {
        case 'sma':
          indicator = sma(params.period || 20, params.source || 'close');
          break;
        case 'ema':
          indicator = ema(params.period || 20, params.source || 'close');
          break;
        case 'rsi':
          indicator = rsi(params.period || 14, params.source || 'close');
          break;
        case 'macd':
          indicator = macd(
            params.fastPeriod || 12,
            params.slowPeriod || 26,
            params.signalPeriod || 9,
            params.source || 'close'
          );
          break;
        case 'bollingerBands':
          indicator = bollingerBands(
            params.period || 20,
            params.multiplier || 2.0,
            params.source || 'close'
          );
          break;
        case 'vwap':
          indicator = vwap(params.period);
          break;
        default:
          throw new Error(`Unknown indicator type: ${type}`);
      }

      // Apply the condition method
      if (typeof value === 'number') {
        // Simple threshold comparison
        switch (condition) {
          case 'above':
            return indicator.above(value);
          case 'below':
            return indicator.below(value);
          case 'crossesAbove':
            return indicator.crossesAbove(value);
          case 'crossesBelow':
            return indicator.crossesBelow(value);
          default:
            throw new Error(`Unknown condition: ${condition} for threshold`);
        }
      } else if (typeof value === 'string' && value.startsWith('indicator:')) {
        // Comparison with another indicator
        const [refType, ...refParams] = value.substring(10).split(':');
        const refIndicator = this.createIndicator(refType, refParams);
        
        switch (condition) {
          case 'above':
            return indicator.aboveIndicator(refIndicator);
          case 'below':
            return indicator.belowIndicator(refIndicator);
          case 'crossesAbove':
            return indicator.crossesAbove(refIndicator);
          case 'crossesBelow':
            return indicator.crossesBelow(refIndicator);
          default:
            throw new Error(`Unknown condition: ${condition} for indicator comparison`);
        }
      } else {
        // Indicator-specific conditions (no value needed)
        switch (condition) {
          case 'overbought':
            if (type === 'rsi') {
              return indicator.overbought(value as number || 70);
            }
            break;
          case 'oversold':
            if (type === 'rsi') {
              return indicator.oversold(value as number || 30);
            }
            break;
          case 'signalAbove':
            if (type === 'macd') {
              return indicator.signalAbove();
            }
            break;
          case 'signalBelow':
            if (type === 'macd') {
              return indicator.signalBelow();
            }
            break;
          case 'crossesAboveSignal':
            if (type === 'macd') {
              return indicator.crossesAboveSignal();
            }
            break;
          case 'crossesBelowSignal':
            if (type === 'macd') {
              return indicator.crossesBelowSignal();
            }
            break;
          case 'histogramPositive':
            if (type === 'macd') {
              return indicator.histogramPositive();
            }
            break;
          case 'histogramNegative':
            if (type === 'macd') {
              return indicator.histogramNegative();
            }
            break;
          case 'priceBelowLower':
            if (type === 'bollingerBands') {
              return indicator.priceBelowLower();
            }
            break;
          case 'priceAboveUpper':
            if (type === 'bollingerBands') {
              return indicator.priceAboveUpper();
            }
            break;
          case 'priceAbove':
            if (type === 'vwap') {
              return indicator.priceAbove();
            }
            break;
          case 'priceBelow':
            if (type === 'vwap') {
              return indicator.priceBelow();
            }
            break;
          default:
            throw new Error(`Unknown condition: ${condition} for indicator type: ${type}`);
        }
      }
      
      throw new Error(`Invalid condition configuration for ${type}: ${condition}`);
    } else if (node.type === 'and' && node.children) {
      // Build AND condition
      const conditions = node.children.map(child => this.buildCondition(child));
      return conditions.reduce((acc, cond) => acc.and(cond));
    } else if (node.type === 'or' && node.children) {
      // Build OR condition
      const conditions = node.children.map(child => this.buildCondition(child));
      return conditions.reduce((acc, cond) => acc.or(cond));
    } else if (node.type === 'not' && node.children && node.children.length === 1) {
      // Build NOT condition
      return this.buildCondition(node.children[0]).not();
    }
    
    throw new Error(`Invalid condition node: ${JSON.stringify(node)}`);
  }

  /**
   * Helper to create an indicator from type and params
   */
  private static createIndicator(type: string, params: string[]): any {
    const paramMap: Record<string, any> = {};
    params.forEach(param => {
      const [key, val] = param.split('=');
      paramMap[key] = isNaN(Number(val)) ? val : Number(val);
    });

    switch (type) {
      case 'sma':
        return sma(paramMap.period || 20, paramMap.source || 'close');
      case 'ema':
        return ema(paramMap.period || 20, paramMap.source || 'close');
      case 'rsi':
        return rsi(paramMap.period || 14, paramMap.source || 'close');
      case 'macd':
        return macd(
          paramMap.fastPeriod || 12,
          paramMap.slowPeriod || 26,
          paramMap.signalPeriod || 9,
          paramMap.source || 'close'
        );
      case 'bollingerBands':
        return bollingerBands(
          paramMap.period || 20,
          paramMap.multiplier || 2.0,
          paramMap.source || 'close'
        );
      case 'vwap':
        return vwap(paramMap.period);
      default:
        throw new Error(`Unknown indicator type: ${type}`);
    }
  }

  /**
   * Execute a custom strategy and generate a signal
   */
  static executeStrategy(
    buyConditions: ConditionNode | ConditionNode[],
    sellConditions: ConditionNode | ConditionNode[],
    priceData: PriceData[]
  ): 'BUY' | 'SELL' | null {
    const generator = new ConditionSignalGenerator();

    // Build buy condition
    if (Array.isArray(buyConditions)) {
      // Multiple conditions - combine with OR
      const conditions = buyConditions.map(node => this.buildCondition(node));
      const combinedBuy = conditions.reduce((acc, cond) => acc.or(cond));
      generator.whenBuy(combinedBuy);
    } else {
      generator.whenBuy(this.buildCondition(buyConditions));
    }

    // Build sell condition
    if (Array.isArray(sellConditions)) {
      // Multiple conditions - combine with OR
      const conditions = sellConditions.map(node => this.buildCondition(node));
      const combinedSell = conditions.reduce((acc, cond) => acc.or(cond));
      generator.whenSell(combinedSell);
    } else {
      generator.whenSell(this.buildCondition(sellConditions));
    }

    // Generate signal
    return generator.generateSignal(priceData);
  }
}

