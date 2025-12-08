/**
 * Utility to load custom strategies from database and convert to bot config
 */

import { StrategyConfig } from '../config/tradingConfig';
import { ConditionNode } from '../utils/indicators/executor';

/**
 * Convert custom strategy data to StrategyConfig format for the bot
 */
export function customStrategyToConfig(
  customStrategy: {
    name: string;
    buy_conditions: ConditionNode | ConditionNode[];
    sell_conditions: ConditionNode | ConditionNode[];
  },
  symbols: string[]
): StrategyConfig {
  return {
    name: 'CUSTOM',
    enabled: true,
    parameters: {
      name: customStrategy.name,
      buy_conditions: customStrategy.buy_conditions,
      sell_conditions: customStrategy.sell_conditions
    },
    symbols
  };
}

