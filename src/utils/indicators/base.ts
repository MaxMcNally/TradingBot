/**
 * Base classes for chainable indicators
 */

import { Condition, PriceData } from './types';

/**
 * Base condition class that implements logical operators
 */
export abstract class BaseCondition implements Condition {
  abstract evaluate(prices: PriceData[]): boolean;

  and(other: Condition): Condition {
    return new AndCondition(this, other);
  }

  or(other: Condition): Condition {
    return new OrCondition(this, other);
  }

  not(): Condition {
    return new NotCondition(this);
  }
}

/**
 * AND condition - both conditions must be true
 */
class AndCondition extends BaseCondition {
  constructor(
    private left: Condition,
    private right: Condition
  ) {
    super();
  }

  evaluate(prices: PriceData[]): boolean {
    return this.left.evaluate(prices) && this.right.evaluate(prices);
  }
}

/**
 * OR condition - at least one condition must be true
 */
class OrCondition extends BaseCondition {
  constructor(
    private left: Condition,
    private right: Condition
  ) {
    super();
  }

  evaluate(prices: PriceData[]): boolean {
    return this.left.evaluate(prices) || this.right.evaluate(prices);
  }
}

/**
 * NOT condition - negates the condition
 */
class NotCondition extends BaseCondition {
  constructor(private condition: Condition) {
    super();
  }

  evaluate(prices: PriceData[]): boolean {
    return !this.condition.evaluate(prices);
  }
}

/**
 * Signal generator that uses conditions to produce trading signals
 */
export class ConditionSignalGenerator {
  private buyCondition: Condition | null = null;
  private sellCondition: Condition | null = null;

  /**
   * Set the condition for generating BUY signals
   */
  whenBuy(condition: Condition): this {
    this.buyCondition = condition;
    return this;
  }

  /**
   * Set the condition for generating SELL signals
   */
  whenSell(condition: Condition): this {
    this.sellCondition = condition;
    return this;
  }

  /**
   * Generate a signal based on the conditions
   */
  generateSignal(prices: PriceData[]): 'BUY' | 'SELL' | null {
    if (this.buyCondition && this.buyCondition.evaluate(prices)) {
      return 'BUY';
    }
    if (this.sellCondition && this.sellCondition.evaluate(prices)) {
      return 'SELL';
    }
    return null;
  }
}

