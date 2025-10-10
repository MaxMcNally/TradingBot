import { ConfigManager, TradingConfig, WarmupConfig } from '../../config/tradingConfig';

describe('ConfigManager - Warmup Functionality', () => {
  let configManager: ConfigManager;

  beforeEach(() => {
    configManager = new ConfigManager();
  });

  describe('getMaxLookbackWindow', () => {
    it('should calculate correct lookback for MovingAverage strategy', () => {
      const config: Partial<TradingConfig> = {
        strategies: [
          {
            name: 'MovingAverage',
            enabled: true,
            parameters: { shortWindow: 5, longWindow: 30 },
            symbols: ['AAPL']
          }
        ]
      };
      configManager = new ConfigManager(config);
      
      const maxLookback = configManager.getMaxLookbackWindow();
      expect(maxLookback).toBe(30); // Should use the longer window
    });

    it('should calculate correct lookback for multiple strategies', () => {
      const config: Partial<TradingConfig> = {
        strategies: [
          {
            name: 'MovingAverage',
            enabled: true,
            parameters: { shortWindow: 5, longWindow: 20 },
            symbols: ['AAPL']
          },
          {
            name: 'Breakout',
            enabled: true,
            parameters: { lookbackWindow: 50 },
            symbols: ['AAPL']
          },
          {
            name: 'Momentum',
            enabled: true,
            parameters: { rsiWindow: 14, momentumWindow: 10 },
            symbols: ['AAPL']
          }
        ]
      };
      configManager = new ConfigManager(config);
      
      const maxLookback = configManager.getMaxLookbackWindow();
      expect(maxLookback).toBe(50); // Should use the maximum across all strategies
    });

    it('should handle user-configured longer lookback windows', () => {
      const config: Partial<TradingConfig> = {
        strategies: [
          {
            name: 'MovingAverage',
            enabled: true,
            parameters: { shortWindow: 10, longWindow: 100 }, // User chose longer window
            symbols: ['AAPL']
          },
          {
            name: 'Breakout',
            enabled: true,
            parameters: { lookbackWindow: 75 }, // User chose longer window
            symbols: ['AAPL']
          }
        ]
      };
      configManager = new ConfigManager(config);
      
      const maxLookback = configManager.getMaxLookbackWindow();
      expect(maxLookback).toBe(100); // Should use the maximum
    });

    it('should ignore disabled strategies', () => {
      const config: Partial<TradingConfig> = {
        strategies: [
          {
            name: 'MovingAverage',
            enabled: true,
            parameters: { shortWindow: 5, longWindow: 20 },
            symbols: ['AAPL']
          },
          {
            name: 'Breakout',
            enabled: false, // Disabled strategy
            parameters: { lookbackWindow: 100 },
            symbols: ['AAPL']
          }
        ]
      };
      configManager = new ConfigManager(config);
      
      const maxLookback = configManager.getMaxLookbackWindow();
      expect(maxLookback).toBe(20); // Should only consider enabled strategies
    });

    it('should handle unknown strategy types with conservative default', () => {
      const config: Partial<TradingConfig> = {
        strategies: [
          {
            name: 'UnknownStrategy',
            enabled: true,
            parameters: { someParam: 10 },
            symbols: ['AAPL']
          }
        ]
      };
      configManager = new ConfigManager(config);
      
      const maxLookback = configManager.getMaxLookbackWindow();
      expect(maxLookback).toBe(30); // Should use conservative default
    });

    it('should return 0 when no strategies are enabled', () => {
      const config: Partial<TradingConfig> = {
        strategies: [
          {
            name: 'MovingAverage',
            enabled: false,
            parameters: { shortWindow: 5, longWindow: 20 },
            symbols: ['AAPL']
          }
        ]
      };
      configManager = new ConfigManager(config);
      
      const maxLookback = configManager.getMaxLookbackWindow();
      expect(maxLookback).toBe(0);
    });
  });

  describe('getWarmupConfig', () => {
    it('should return default warmup configuration', () => {
      const warmupConfig = configManager.getWarmupConfig();
      
      expect(warmupConfig).toEqual({
        enabled: true,
        maxLookbackDays: 200,
        bufferDays: 10,
        skipWeekends: true,
        dataInterval: 'day',
        failOnWarmupError: false
      });
    });

    it('should merge user configuration with defaults', () => {
      const config: Partial<TradingConfig> = {
        warmup: {
          enabled: true,
          maxLookbackDays: 150,
          bufferDays: 5,
          skipWeekends: false,
          dataInterval: 'hour',
          failOnWarmupError: true
        }
      };
      configManager = new ConfigManager(config);
      
      const warmupConfig = configManager.getWarmupConfig();
      
      expect(warmupConfig).toEqual({
        enabled: true,
        maxLookbackDays: 150,
        bufferDays: 5,
        skipWeekends: false,
        dataInterval: 'hour',
        failOnWarmupError: true
      });
    });

    it('should use defaults for missing warmup properties', () => {
      const config: Partial<TradingConfig> = {
        warmup: {
          enabled: false,
          maxLookbackDays: 100,
          bufferDays: 10,
          skipWeekends: true,
          dataInterval: 'day' as const,
          failOnWarmupError: false
        }
      };
      configManager = new ConfigManager(config);
      
      const warmupConfig = configManager.getWarmupConfig();
      
      expect(warmupConfig).toEqual({
        enabled: false,
        maxLookbackDays: 100,
        bufferDays: 10, // Default
        skipWeekends: true, // Default
        dataInterval: 'day', // Default
        failOnWarmupError: false // Default
      });
    });
  });

  describe('validateConfig with warmup', () => {
    it('should validate warmup configuration successfully', () => {
      const config: Partial<TradingConfig> = {
        strategies: [
          {
            name: 'MovingAverage',
            enabled: true,
            parameters: { shortWindow: 5, longWindow: 30 },
            symbols: ['AAPL']
          }
        ],
        warmup: {
          enabled: true,
          maxLookbackDays: 200,
          bufferDays: 10,
          skipWeekends: true,
          dataInterval: 'day' as const,
          failOnWarmupError: false
        }
      };
      configManager = new ConfigManager(config);
      
      const validation = configManager.validateConfig();
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should fail validation when lookback exceeds max allowed', () => {
      const config: Partial<TradingConfig> = {
        strategies: [
          {
            name: 'MovingAverage',
            enabled: true,
            parameters: { shortWindow: 5, longWindow: 250 }, // Exceeds maxLookbackDays
            symbols: ['AAPL']
          }
        ],
        warmup: {
          enabled: true,
          maxLookbackDays: 200, // Less than strategy requirement
          bufferDays: 10,
          skipWeekends: true,
          dataInterval: 'day' as const,
          failOnWarmupError: false
        }
      };
      configManager = new ConfigManager(config);
      
      const validation = configManager.validateConfig();
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain(
        'Strategy lookback window (250 days) exceeds maximum allowed (200 days)'
      );
    });

    it('should pass validation when warmup is disabled', () => {
      const config: Partial<TradingConfig> = {
        strategies: [
          {
            name: 'MovingAverage',
            enabled: true,
            parameters: { shortWindow: 5, longWindow: 250 }, // Would exceed maxLookbackDays
            symbols: ['AAPL']
          }
        ],
        warmup: {
          enabled: false, // Warmup disabled, so no validation needed
          maxLookbackDays: 200,
          bufferDays: 10,
          skipWeekends: true,
          dataInterval: 'day' as const,
          failOnWarmupError: false
        }
      };
      configManager = new ConfigManager(config);
      
      const validation = configManager.validateConfig();
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });
  });

  describe('Strategy-specific lookback calculations', () => {
    it('should handle MeanReversion strategy', () => {
      const config: Partial<TradingConfig> = {
        strategies: [
          {
            name: 'MeanReversion',
            enabled: true,
            parameters: { window: 25 },
            symbols: ['AAPL']
          }
        ]
      };
      configManager = new ConfigManager(config);
      
      const maxLookback = configManager.getMaxLookbackWindow();
      expect(maxLookback).toBe(25);
    });

    it('should handle Momentum strategy with multiple windows', () => {
      const config: Partial<TradingConfig> = {
        strategies: [
          {
            name: 'Momentum',
            enabled: true,
            parameters: { rsiWindow: 21, momentumWindow: 15 },
            symbols: ['AAPL']
          }
        ]
      };
      configManager = new ConfigManager(config);
      
      const maxLookback = configManager.getMaxLookbackWindow();
      expect(maxLookback).toBe(21); // Should use the longer of the two
    });

    it('should handle BollingerBands strategy', () => {
      const config: Partial<TradingConfig> = {
        strategies: [
          {
            name: 'BollingerBands',
            enabled: true,
            parameters: { window: 35 },
            symbols: ['AAPL']
          }
        ]
      };
      configManager = new ConfigManager(config);
      
      const maxLookback = configManager.getMaxLookbackWindow();
      expect(maxLookback).toBe(35);
    });

    it('should handle SentimentAnalysis strategy', () => {
      const config: Partial<TradingConfig> = {
        strategies: [
          {
            name: 'SentimentAnalysis',
            enabled: true,
            parameters: { lookbackDays: 7 },
            symbols: ['AAPL']
          }
        ]
      };
      configManager = new ConfigManager(config);
      
      const maxLookback = configManager.getMaxLookbackWindow();
      expect(maxLookback).toBe(7);
    });
  });
});
