export interface StrategyParameter {
  type: 'number' | 'select' | 'boolean';
  description: string;
  default: any;
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
}

export interface StrategyDefinition {
  name: string;
  displayName: string;
  description: string;
  category: string;
  parameters: Record<string, StrategyParameter>;
}

export class StrategiesService {
  private static strategies: StrategyDefinition[] = [
    {
      name: "meanReversion",
      displayName: "Mean Reversion",
      description: "Buy when price is below moving average by threshold, sell when above",
      category: "Mean Reversion",
      parameters: {
        window: {
          type: "number",
          description: "Moving average window in days",
          default: 20,
          min: 5,
          max: 200
        },
        threshold: {
          type: "number",
          description: "Percentage threshold for buy/sell signals (0.05 = 5%)",
          default: 0.05,
          min: 0.01,
          max: 0.2,
          step: 0.01
        }
      }
    },
    {
      name: "movingAverageCrossover",
      displayName: "Moving Average Crossover",
      description: "Buy when fast MA crosses above slow MA, sell when below",
      category: "Trend Following",
      parameters: {
        fastWindow: {
          type: "number",
          description: "Fast moving average window in days",
          default: 10,
          min: 5,
          max: 50
        },
        slowWindow: {
          type: "number",
          description: "Slow moving average window in days",
          default: 30,
          min: 10,
          max: 200
        },
        maType: {
          type: "select",
          description: "Type of moving average",
          default: "SMA",
          options: ["SMA", "EMA"]
        }
      }
    },
    {
      name: "momentum",
      displayName: "Momentum",
      description: "Uses RSI and price momentum for overbought/oversold signals",
      category: "Momentum",
      parameters: {
        rsiWindow: {
          type: "number",
          description: "RSI calculation window in days",
          default: 14,
          min: 5,
          max: 50
        },
        rsiOverbought: {
          type: "number",
          description: "RSI overbought threshold",
          default: 70,
          min: 60,
          max: 90
        },
        rsiOversold: {
          type: "number",
          description: "RSI oversold threshold",
          default: 30,
          min: 10,
          max: 40
        },
        momentumWindow: {
          type: "number",
          description: "Price momentum calculation window in days",
          default: 10,
          min: 5,
          max: 50
        },
        momentumThreshold: {
          type: "number",
          description: "Minimum momentum percentage (0.02 = 2%)",
          default: 0.02,
          min: 0.01,
          max: 0.1,
          step: 0.01
        }
      }
    },
    {
      name: "bollingerBands",
      displayName: "Bollinger Bands",
      description: "Buy when price touches lower band, sell when touches upper band",
      category: "Mean Reversion",
      parameters: {
        window: {
          type: "number",
          description: "Moving average window in days",
          default: 20,
          min: 5,
          max: 50
        },
        multiplier: {
          type: "number",
          description: "Standard deviation multiplier",
          default: 2.0,
          min: 1.0,
          max: 3.0,
          step: 0.1
        }
      }
    },
    {
      name: "breakout",
      displayName: "Breakout",
      description: "Identifies support/resistance levels and trades breakouts",
      category: "Breakout",
      parameters: {
        lookbackWindow: {
          type: "number",
          description: "Window to identify support/resistance levels in days",
          default: 20,
          min: 5,
          max: 100
        },
        breakoutThreshold: {
          type: "number",
          description: "Minimum percentage move to confirm breakout (0.01 = 1%)",
          default: 0.01,
          min: 0.005,
          max: 0.05,
          step: 0.01
        },
        minVolumeRatio: {
          type: "number",
          description: "Minimum volume ratio vs average (1.5 = 50% above average)",
          default: 1.5,
          min: 1.0,
          max: 5.0,
          step: 0.1
        },
        confirmationPeriod: {
          type: "number",
          description: "Days to hold position after breakout",
          default: 2,
          min: 1,
          max: 5
        }
      }
    },
    {
      name: "sentimentAnalysis",
      displayName: "Sentiment Analysis",
      description: "Aggregates recent news sentiment to produce BUY/SELL signals",
      category: "News/Sentiment",
      parameters: {
        lookbackDays: {
          type: "number",
          description: "Days of news to consider",
          default: 3,
          min: 1,
          max: 30
        },
        pollIntervalMinutes: {
          type: "number",
          description: "Polling interval for fetching fresh news",
          default: 0,
          min: 0,
          max: 120
        },
        minArticles: {
          type: "number",
          description: "Minimum number of articles required to act",
          default: 2,
          min: 1,
          max: 50
        },
        buyThreshold: {
          type: "number",
          description: "Aggregate sentiment threshold to trigger BUY (0.4 = 40%)",
          default: 0.4,
          min: 0.0,
          max: 1.0,
          step: 0.05
        },
        sellThreshold: {
          type: "number",
          description: "Aggregate sentiment threshold to trigger SELL (-0.4 = -40%)",
          default: -0.4,
          min: -1.0,
          max: 0.0,
          step: 0.05
        },
        titleWeight: {
          type: "number",
          description: "Relative weight for title vs description",
          default: 2.0,
          min: 0.5,
          max: 5.0,
          step: 0.1
        },
        recencyHalfLifeHours: {
          type: "number",
          description: "Half-life in hours for recency weighting",
          default: 12,
          min: 1,
          max: 72
        }
      }
    }
  ];

  /**
   * Get all available strategies
   */
  static getAllStrategies(): StrategyDefinition[] {
    return this.strategies;
  }

  /**
   * Get a specific strategy by name
   */
  static getStrategyByName(name: string): StrategyDefinition | undefined {
    return this.strategies.find(strategy => strategy.name === name);
  }

  /**
   * Get default parameters for a strategy
   */
  static getDefaultParameters(strategyName: string): Record<string, any> {
    const strategy = this.getStrategyByName(strategyName);
    if (!strategy) {
      return {};
    }

    const defaults: Record<string, any> = {};
    Object.entries(strategy.parameters).forEach(([key, param]) => {
      defaults[key] = param.default;
    });

    return defaults;
  }

  /**
   * Get strategies formatted for backtest API (with trading parameters)
   */
  static getStrategiesForBacktest(): any[] {
    return this.strategies.map(strategy => ({
      name: strategy.name,
      displayName: strategy.displayName,
      description: strategy.description,
      category: strategy.category,
      parameters: {
        ...strategy.parameters,
        // Add trading-specific parameters
        initialCapital: {
          type: "number",
          description: "Starting capital amount",
          default: 10000,
          min: 1000
        },
        sharesPerTrade: {
          type: "number",
          description: "Maximum shares per trade",
          default: 100,
          min: 1
        }
      }
    }));
  }

  /**
   * Get strategies formatted for trading API (simplified)
   */
  static getStrategiesForTrading(): any[] {
    return this.strategies.map(strategy => ({
      name: strategy.name,
      displayName: strategy.displayName,
      description: strategy.description,
      category: strategy.category,
      parameters: this.getDefaultParameters(strategy.name),
      enabled: true,
      symbols: []
    }));
  }

  /**
   * Validate strategy parameters against the strategy definition
   */
  static validateParameters(strategyName: string, parameters: Record<string, any>): { valid: boolean; errors: string[] } {
    const strategy = this.getStrategyByName(strategyName);
    if (!strategy) {
      return { valid: false, errors: [`Unknown strategy: ${strategyName}`] };
    }

    const errors: string[] = [];

    Object.entries(strategy.parameters).forEach(([key, paramDef]) => {
      const value = parameters[key];
      
      if (value === undefined || value === null) {
        // Optional parameters are allowed to be undefined
        return;
      }

      if (paramDef.type === 'number') {
        const numValue = Number(value);
        if (isNaN(numValue)) {
          errors.push(`${key} must be a valid number`);
          return;
        }

        if (paramDef.min !== undefined && numValue < paramDef.min) {
          errors.push(`${key} must be at least ${paramDef.min}`);
        }
        if (paramDef.max !== undefined && numValue > paramDef.max) {
          errors.push(`${key} must be at most ${paramDef.max}`);
        }
      } else if (paramDef.type === 'select') {
        if (paramDef.options && !paramDef.options.includes(value)) {
          errors.push(`${key} must be one of: ${paramDef.options.join(', ')}`);
        }
      }
    });

    return { valid: errors.length === 0, errors };
  }
}
