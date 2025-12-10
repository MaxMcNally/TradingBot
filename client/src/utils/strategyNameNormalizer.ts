/**
 * Normalizes strategy names to camelCase format for API consistency
 * This handles cases where database records might still have underscore format
 */

const STRATEGY_NAME_NORMALIZATION: Record<string, string> = {
  // Underscore format -> camelCase format
  'mean_reversion': 'meanReversion',
  'moving_average_crossover': 'movingAverageCrossover',
  'bollinger_bands': 'bollingerBands',
  'sentiment_analysis': 'sentimentAnalysis',
  // Already camelCase (pass through)
  'meanReversion': 'meanReversion',
  'movingAverageCrossover': 'movingAverageCrossover',
  'bollingerBands': 'bollingerBands',
  'sentimentAnalysis': 'sentimentAnalysis',
  'momentum': 'momentum',
  'breakout': 'breakout',
  'custom': 'custom',
};

/**
 * Normalizes a strategy name to camelCase format for API calls
 * @param strategyName Strategy name in any format
 * @returns Strategy name in camelCase format
 */
export function normalizeStrategyName(strategyName: string): string {
  return STRATEGY_NAME_NORMALIZATION[strategyName] || strategyName;
}

