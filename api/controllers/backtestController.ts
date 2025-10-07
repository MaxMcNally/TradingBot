import { Request, Response } from "express";
import { spawn } from "child_process";
import path from "path";
// Removed unused imports

export interface BacktestRequest {
  strategy: string;
  symbols: string | string[];
  startDate: string;
  endDate: string;
  // Data provider
  provider?: 'yahoo' | 'polygon' | 'polygon-flatfiles';
  // Common parameters
  initialCapital?: number;
  sharesPerTrade?: number;
  useCache?: boolean;
  prepopulateCache?: boolean;
  showCacheStats?: boolean;
  // Sentiment Analysis parameters
  lookbackDays?: number;
  pollIntervalMinutes?: number;
  minArticles?: number;
  buyThreshold?: number;
  sellThreshold?: number;
  titleWeight?: number;
  recencyHalfLifeHours?: number;
  newsSource?: 'tiingo' | 'yahoo';
  // Mean Reversion parameters
  window?: number;
  threshold?: number;
  // Moving Average Crossover parameters
  fastWindow?: number;
  slowWindow?: number;
  maType?: 'SMA' | 'EMA';
  // Momentum parameters
  rsiWindow?: number;
  rsiOverbought?: number;
  rsiOversold?: number;
  momentumWindow?: number;
  momentumThreshold?: number;
  // Bollinger Bands parameters
  multiplier?: number;
  // Breakout parameters
  lookbackWindow?: number;
  breakoutThreshold?: number;
  minVolumeRatio?: number;
  confirmationPeriod?: number;
}

export interface BacktestResponse {
  success: boolean;
  data?: any;
  error?: string;
  results?: {
    symbol: string;
    trades: any[];
    finalPortfolioValue: number;
    totalReturn: number;
    winRate: number;
    maxDrawdown: number;
  }[];
  cacheStats?: {
    symbol: string;
    cachedRanges: number;
    coverage?: {
      start: string;
      end: string;
      totalDays: number;
    };
  };
}

export const runBacktest = async (req: Request, res: Response) => {
  try {
    const {
      strategy,
      symbols,
      startDate,
      endDate,
      // Data provider
      provider = 'yahoo',
      // Common parameters
      initialCapital = 10000,
      sharesPerTrade = 100,
      useCache = true,
      prepopulateCache = false,
      showCacheStats = false,
      // Sentiment Analysis defaults
      lookbackDays = 3,
      pollIntervalMinutes = 0,
      minArticles = 2,
      buyThreshold = 0.4,
      sellThreshold = -0.4,
      titleWeight = 2.0,
      recencyHalfLifeHours = 12,
      newsSource = 'yahoo',
      // Strategy-specific parameters with defaults
      window = 20,
      threshold = 0.05,
      fastWindow = 10,
      slowWindow = 30,
      maType = 'SMA',
      rsiWindow = 14,
      rsiOverbought = 70,
      rsiOversold = 30,
      momentumWindow = 10,
      momentumThreshold = 0.02,
      multiplier = 2.0,
      lookbackWindow = 20,
      breakoutThreshold = 0.01,
      minVolumeRatio = 1.5,
      confirmationPeriod = 2
    }: BacktestRequest = req.body;

    // Validate required fields
    if (!strategy || !symbols || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: strategy, symbols, startDate, endDate"
      });
    }

    // Validate strategy
    const validStrategies = [
      'meanReversion',
      'movingAverageCrossover', 
      'momentum',
      'bollingerBands',
      'breakout',
      'sentimentAnalysis'
    ];
    if (!validStrategies.includes(strategy)) {
      return res.status(400).json({
        success: false,
        error: `Invalid strategy. Valid strategies: ${validStrategies.join(', ')}`
      });
    }

    // Validate provider
    const validProviders = ['yahoo', 'polygon', 'polygon-flatfiles'];
    if (!validProviders.includes(provider)) {
      return res.status(400).json({
        success: false,
        error: `Invalid provider. Valid providers: ${validProviders.join(', ')}`
      });
    }

    // Convert symbols to array if it's a string
    const symbolArray = Array.isArray(symbols) ? symbols : [symbols];

    // Validate date format (basic validation)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      return res.status(400).json({
        success: false,
        error: "Invalid date format. Use YYYY-MM-DD format"
      });
    }

    // Validate date range
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start >= end) {
      return res.status(400).json({
        success: false,
        error: "Start date must be before end date"
      });
    }

    // Run backtests for each symbol
    const results: any[] = [];
    
    for (const symbol of symbolArray) {
      try {
        const result = await runSingleBacktest({
          symbol,
          startDate,
          endDate,
          strategy,
          provider,
          // Common parameters
          initialCapital,
          sharesPerTrade,
          useCache,
          prepopulateCache,
          showCacheStats,
          // Strategy-specific parameters
          window,
          threshold,
          fastWindow,
          slowWindow,
          maType,
          rsiWindow,
          rsiOverbought,
          rsiOversold,
          momentumWindow,
          momentumThreshold,
          multiplier,
          lookbackWindow,
          breakoutThreshold,
          minVolumeRatio,
          confirmationPeriod,
          // Sentiment
          lookbackDays,
          pollIntervalMinutes,
          minArticles,
          buyThreshold,
          sellThreshold,
          titleWeight,
          recencyHalfLifeHours,
          newsSource
        });
        
        results.push({
          symbol,
          ...result
        });
        } catch (error) {
          console.error(`Error running backtest for ${symbol}:`, error);
          const errorMessage = error instanceof Error ? error.message : String(error);
          results.push({
            symbol,
            error: `Failed to run backtest for ${symbol}: ${errorMessage}`
          });
        }
    }

    // Calculate aggregated metrics
    const validResults = results.filter(r => !r.error && r.finalPortfolioValue !== undefined);
    
    let totalReturn = 0;
    let finalPortfolioValue = 0;
    let totalTrades = 0;
    let totalWins = 0;
    let maxDrawdown = 0;
    
    if (validResults.length > 0) {
      // Calculate weighted average return based on initial capital allocation
      const totalInitialCapital = initialCapital * validResults.length;
      let weightedReturnSum = 0;
      
      validResults.forEach(result => {
        const weight = initialCapital / totalInitialCapital;
        weightedReturnSum += result.totalReturn * weight;
        finalPortfolioValue += result.finalPortfolioValue;
        totalTrades += result.totalTrades || 0;
        totalWins += (result.winRate || 0) * (result.totalTrades || 0) / 100;
        maxDrawdown = Math.max(maxDrawdown, result.maxDrawdown || 0);
      });
      
      totalReturn = weightedReturnSum;
    }

    const winRate = totalTrades > 0 ? totalWins / totalTrades : 0;

    res.json({
      success: true,
      data: {
        strategy,
        symbols: symbolArray,
        startDate,
        endDate,
        provider,
        // Overall aggregated metrics
        totalReturn,
        finalPortfolioValue,
        winRate,
        totalTrades,
        maxDrawdown,
        config: {
          // Data provider
          provider,
          // Common parameters
          initialCapital,
          sharesPerTrade,
          // Strategy-specific parameters
          window,
          threshold,
          fastWindow,
          slowWindow,
          maType,
          rsiWindow,
          rsiOverbought,
          rsiOversold,
          momentumWindow,
          momentumThreshold,
          multiplier,
          lookbackWindow,
          breakoutThreshold,
          minVolumeRatio,
          confirmationPeriod,
          // Sentiment
          lookbackDays,
          pollIntervalMinutes,
          minArticles,
          buyThreshold,
          sellThreshold,
          titleWeight,
          recencyHalfLifeHours,
          newsSource
        },
        results
      }
    });

  } catch (error) {
    console.error("Backtest API error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error during backtest execution"
    });
  }
};

const runSingleBacktest = async (params: {
  symbol: string;
  startDate: string;
  endDate: string;
  strategy: string;
  provider: string;
  // Common parameters
  initialCapital: number;
  sharesPerTrade: number;
  useCache: boolean;
  prepopulateCache: boolean;
  showCacheStats: boolean;
  // Strategy-specific parameters
  window: number;
  threshold: number;
  fastWindow: number;
  slowWindow: number;
  maType: 'SMA' | 'EMA';
  rsiWindow: number;
  rsiOverbought: number;
  rsiOversold: number;
  momentumWindow: number;
  momentumThreshold: number;
  multiplier: number;
  lookbackWindow: number;
  breakoutThreshold: number;
  minVolumeRatio: number;
  confirmationPeriod: number;
  // Sentiment
  lookbackDays: number;
  pollIntervalMinutes: number;
  minArticles: number;
  buyThreshold: number;
  sellThreshold: number;
  titleWeight: number;
  recencyHalfLifeHours: number;
  newsSource: string;
}): Promise<any> => {
  return new Promise((resolve, reject) => {
    const { 
      symbol, startDate, endDate, strategy, provider,
      initialCapital, sharesPerTrade, useCache, prepopulateCache, showCacheStats,
      window, threshold, fastWindow, slowWindow, maType,
      rsiWindow, rsiOverbought, rsiOversold, momentumWindow, momentumThreshold,
      multiplier, lookbackWindow, breakoutThreshold, minVolumeRatio, confirmationPeriod,
      lookbackDays, pollIntervalMinutes, minArticles, buyThreshold, sellThreshold, titleWeight, recencyHalfLifeHours, newsSource
    } = params;
    
    // Path to the backtest script
    const backtestScript = path.join(__dirname, '../../src/backtest.ts');
    
    // Build the command arguments
    const args = [
      '--symbol', symbol,
      '--start', startDate,
      '--end', endDate,
      '--strategy', strategy,
      '--provider', provider,
      '--capital', initialCapital.toString(),
      '--shares', sharesPerTrade.toString()
    ];

    // Add strategy-specific parameters
    if (strategy === 'meanReversion') {
      args.push('--window', window.toString());
      args.push('--threshold', threshold.toString());
    } else if (strategy === 'movingAverageCrossover') {
      args.push('--fastWindow', fastWindow.toString());
      args.push('--slowWindow', slowWindow.toString());
      args.push('--maType', maType);
    } else if (strategy === 'momentum') {
      args.push('--rsiWindow', rsiWindow.toString());
      args.push('--rsiOverbought', rsiOverbought.toString());
      args.push('--rsiOversold', rsiOversold.toString());
      args.push('--momentumWindow', momentumWindow.toString());
      args.push('--momentumThreshold', momentumThreshold.toString());
    } else if (strategy === 'bollingerBands') {
      args.push('--window', window.toString());
      args.push('--multiplier', multiplier.toString());
      args.push('--maType', maType);
    } else if (strategy === 'breakout') {
      args.push('--lookbackWindow', lookbackWindow.toString());
      args.push('--breakoutThreshold', breakoutThreshold.toString());
      args.push('--minVolumeRatio', minVolumeRatio.toString());
      args.push('--confirmationPeriod', confirmationPeriod.toString());
    } else if (strategy === 'sentimentAnalysis') {
      args.push('--lookbackDays', lookbackDays.toString());
      args.push('--pollIntervalMinutes', pollIntervalMinutes.toString());
      args.push('--minArticles', minArticles.toString());
      args.push('--buyThreshold', buyThreshold.toString());
      args.push('--sellThreshold', sellThreshold.toString());
      args.push('--titleWeight', titleWeight.toString());
      args.push('--recencyHalfLifeHours', recencyHalfLifeHours.toString());
      args.push('--newsSource', newsSource);
    }

    // Add cache-related flags
    if (!useCache) {
      args.push('--no-cache');
    }
    if (prepopulateCache) {
      args.push('--prepopulate');
    }
    if (showCacheStats) {
      args.push('--cache-stats');
    }

    console.log(`Running backtest: npx ts-node ${backtestScript} ${args.join(' ')}`);

    // Spawn the backtest process
    const child = spawn('npx', ['ts-node', backtestScript, ...args], {
      cwd: path.join(__dirname, '../..'),
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        try {
          // Parse the JSON output from the backtest script
          const lines = stdout.split('\n');
          const jsonLine = lines.find(line => line.trim().startsWith('{'));
          
          if (jsonLine) {
            const result = JSON.parse(jsonLine);
            resolve(result);
          } else {
            // If no JSON found, try to extract key metrics from the output
            const result = parseBacktestOutput(stdout);
            resolve(result);
          }
        } catch (parseError) {
          console.error('Error parsing backtest output:', parseError);
          console.error('Raw output:', stdout);
          reject(new Error('Failed to parse backtest results'));
        }
      } else {
        console.error(`Backtest process exited with code ${code}`);
        console.error('stderr:', stderr);
        reject(new Error(`Backtest failed with exit code ${code}: ${stderr}`));
      }
    });

    child.on('error', (error) => {
      console.error('Error spawning backtest process:', error);
      reject(new Error(`Failed to start backtest process: ${error.message}`));
    });
  });
};

const parseBacktestOutput = (output: string): any => {
  // Extract key metrics from the console output
  const lines = output.split('\n');
  
  const result: any = {
    trades: [],
    finalPortfolioValue: 0,
    totalReturn: 0,
    winRate: 0,
    maxDrawdown: 0
  };

  for (const line of lines) {
    if (line.includes('Final Portfolio Value:')) {
      const match = line.match(/\$([\d,]+\.?\d*)/);
      if (match) {
        result.finalPortfolioValue = parseFloat(match[1].replace(/,/g, ''));
      }
    }
    
    if (line.includes('Total Return:')) {
      const match = line.match(/([\d.-]+)%/);
      if (match) {
        result.totalReturn = parseFloat(match[1]) / 100;
      }
    }
    
    if (line.includes('Win Rate:')) {
      const match = line.match(/([\d.-]+)%/);
      if (match) {
        result.winRate = parseFloat(match[1]) / 100;
      }
    }
    
    if (line.includes('Max Drawdown:')) {
      const match = line.match(/([\d.-]+)%/);
      if (match) {
        result.maxDrawdown = parseFloat(match[1]) / 100;
      }
    }
    
    if (line.includes('Total Trades:')) {
      const match = line.match(/Total Trades: (\d+)/);
      if (match) {
        result.totalTrades = parseInt(match[1]);
      }
    }
  }

  return result;
};
