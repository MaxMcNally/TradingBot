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
}
