import { CustomStrategyExecutor, ConditionNode } from '../../src/utils/indicators';
import { PriceData } from '../../src/utils/indicators/types';

/**
 * Service to execute custom strategies built with chainable indicators
 * This is a wrapper around CustomStrategyExecutor for API use
 */
export class CustomStrategyService {
  /**
   * Execute a custom strategy and generate a signal
   */
  static executeStrategy(
    buyConditions: ConditionNode | ConditionNode[],
    sellConditions: ConditionNode | ConditionNode[],
    priceData: PriceData[]
  ): 'BUY' | 'SELL' | null {
    return CustomStrategyExecutor.executeStrategy(buyConditions, sellConditions, priceData);
  }

  /**
   * Validate a condition node structure
   */
  static validateConditionNode(node: ConditionNode): { valid: boolean; error?: string } {
    if (node.type === 'indicator') {
      if (!node.indicator) {
        return { valid: false, error: 'Indicator node must have indicator property' };
      }
      if (!node.indicator.type) {
        return { valid: false, error: 'Indicator must have type' };
      }
      if (!node.indicator.condition) {
        return { valid: false, error: 'Indicator must have condition' };
      }
      return { valid: true };
    } else if (node.type === 'and' || node.type === 'or') {
      if (!node.children || node.children.length < 2) {
        return { valid: false, error: `${node.type} condition must have at least 2 children` };
      }
      for (const child of node.children) {
        const result = this.validateConditionNode(child);
        if (!result.valid) {
          return result;
        }
      }
      return { valid: true };
    } else if (node.type === 'not') {
      if (!node.children || node.children.length !== 1) {
        return { valid: false, error: 'NOT condition must have exactly 1 child' };
      }
      return this.validateConditionNode(node.children[0]);
    }
    
    return { valid: false, error: `Unknown condition type: ${node.type}` };
  }

  /**
   * Comprehensive validation of a custom strategy
   * Checks structure, logical consistency, and common pitfalls
   */
  static validateStrategy(
    buyConditions: ConditionNode | ConditionNode[],
    sellConditions: ConditionNode | ConditionNode[]
  ): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic structure validation
    if (!buyConditions) {
      errors.push('Buy conditions are required');
    }
    if (!sellConditions) {
      errors.push('Sell conditions are required');
    }

    if (errors.length > 0) {
      return { valid: false, errors, warnings };
    }

    // Normalize to arrays for easier processing
    const buyNodes = Array.isArray(buyConditions) ? buyConditions : [buyConditions];
    const sellNodes = Array.isArray(sellConditions) ? sellConditions : [sellConditions];

    // Validate structure of each condition
    for (let i = 0; i < buyNodes.length; i++) {
      const result = this.validateConditionNode(buyNodes[i]);
      if (!result.valid) {
        errors.push(`Buy condition ${i + 1}: ${result.error}`);
      }
    }

    for (let i = 0; i < sellNodes.length; i++) {
      const result = this.validateConditionNode(sellNodes[i]);
      if (!result.valid) {
        errors.push(`Sell condition ${i + 1}: ${result.error}`);
      }
    }

    // Extract all indicators from conditions for analysis
    const extractIndicators = (node: ConditionNode): Array<{ type: string; condition: string; params: any }> => {
      const indicators: Array<{ type: string; condition: string; params: any }> = [];
      
      if (node.type === 'indicator' && node.indicator) {
        indicators.push({
          type: node.indicator.type,
          condition: node.indicator.condition,
          params: node.indicator.params || {}
        });
      } else if (node.children) {
        for (const child of node.children) {
          indicators.push(...extractIndicators(child));
        }
      }
      
      return indicators;
    };

    const buyIndicators = buyNodes.flatMap(node => extractIndicators(node));
    const sellIndicators = sellNodes.flatMap(node => extractIndicators(node));

    // Check for empty conditions
    if (buyIndicators.length === 0) {
      errors.push('Buy conditions must contain at least one indicator');
    }
    if (sellIndicators.length === 0) {
      errors.push('Sell conditions must contain at least one indicator');
    }

    // Check for logical inconsistencies
    const buyRSI = buyIndicators.find(ind => ind.type === 'rsi');
    const sellRSI = sellIndicators.find(ind => ind.type === 'rsi');

    if (buyRSI && sellRSI) {
      // Check if buying when overbought and selling when oversold (backwards)
      if (buyRSI.condition === 'overbought' && sellRSI.condition === 'oversold') {
        warnings.push('Buying when RSI is overbought and selling when oversold may be counterintuitive. Consider reversing these conditions.');
      }
      // Check if buying when oversold and selling when overbought (correct)
      if (buyRSI.condition === 'oversold' && sellRSI.condition === 'overbought') {
        // This is good, no warning needed
      }
    }

    // Check for identical buy and sell conditions
    const buyStr = JSON.stringify(buyNodes);
    const sellStr = JSON.stringify(sellNodes);
    if (buyStr === sellStr) {
      errors.push('Buy and sell conditions cannot be identical. The strategy would never generate signals.');
    }

    // Check for parameter ranges
    for (const indicator of [...buyIndicators, ...sellIndicators]) {
      if (indicator.type === 'rsi') {
        const period = indicator.params.period;
        if (period && (period < 2 || period > 100)) {
          warnings.push(`RSI period of ${period} is outside the typical range (2-100). Most traders use 14.`);
        }
      } else if (indicator.type === 'sma' || indicator.type === 'ema') {
        const period = indicator.params.period;
        if (period !== undefined && period !== null && period < 1) {
          errors.push(`${indicator.type.toUpperCase()} period must be at least 1`);
        }
        if (period && period > 500) {
          warnings.push(`${indicator.type.toUpperCase()} period of ${period} is very large and may be slow to respond to price changes.`);
        }
      } else if (indicator.type === 'bollingerBands') {
        const multiplier = indicator.params.multiplier;
        if (multiplier && (multiplier < 0.1 || multiplier > 5)) {
          warnings.push(`Bollinger Bands multiplier of ${multiplier} is outside the typical range (0.1-5). Most traders use 2.`);
        }
      } else if (indicator.type === 'macd') {
        const fastPeriod = indicator.params.fastPeriod;
        const slowPeriod = indicator.params.slowPeriod;
        if (fastPeriod && slowPeriod && fastPeriod >= slowPeriod) {
          errors.push('MACD fast period must be less than slow period');
        }
      }
    }

    // Check for conflicting conditions (e.g., buying when price is above upper band and selling when below lower band)
    const buyBB = buyIndicators.find(ind => ind.type === 'bollingerBands' && ind.condition === 'priceAboveUpper');
    const sellBB = sellIndicators.find(ind => ind.type === 'bollingerBands' && ind.condition === 'priceBelowLower');
    if (buyBB && sellBB) {
      warnings.push('Buying when price is above upper Bollinger Band and selling when below lower band may be counterintuitive. Consider if this matches your trading strategy.');
    }

    // Check for missing threshold values where needed
    for (const indicator of [...buyIndicators, ...sellIndicators]) {
      if ((indicator.condition === 'above' || indicator.condition === 'below' || 
           indicator.condition === 'overbought' || indicator.condition === 'oversold') &&
          indicator.type !== 'rsi') {
        // These conditions typically need a value, but it's not strictly required for all indicators
        // We'll just note it as a potential issue
      }
    }

    // Check if strategy is too simple (only one indicator on each side)
    if (buyIndicators.length === 1 && sellIndicators.length === 1) {
      warnings.push('Your strategy uses only one indicator for both buy and sell conditions. Consider adding more conditions for better signal reliability.');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
}
