#!/usr/bin/env ts-node
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { runStrategy, StrategyConfig } from "./strategies/runStrategy";
import { 
  runMeanReversionStrategy,
  runMovingAverageCrossoverStrategy,
  runMomentumStrategy,
  runBollingerBandsStrategy,
  runBreakoutStrategy
} from "./strategies";
import { CustomStrategy, CustomStrategyConfig } from "./strategies/customStrategy";
import { CustomStrategyExecutor, ConditionNode } from "./utils/indicators/executor";
import { PriceData } from "./utils/indicators/types";
import {YahooDataProvider} from "./dataProviders/yahooProvider"
import {PolygonProvider} from "./dataProviders/PolygonProvider"
import {PolygonFlatFilesCLIProvider} from "./dataProviders/PolygonFlatFilesCLIProvider"
import {SmartCacheManager} from "./cache/SmartCacheManager"

const argv = yargs(hideBin(process.argv))
  .option("symbol", { type: "string", demandOption: true })
  .option("start", { type: "string", demandOption: true })
  .option("end", { type: "string", demandOption: true })
  .option("strategy", { type: "string", default: "meanReversion", description: "Strategy to use" })
  .option("provider", { type: "string", default: "yahoo", choices: ["yahoo", "polygon", "polygon-flatfiles"], description: "Data provider to use" })
  // Common parameters
  .option("capital", { type: "number", default: 10000, description: "Initial capital" })
  .option("shares", { type: "number", default: 100, description: "Shares per trade" })
  .option("no-cache", { type: "boolean", default: false, description: "Disable caching for this run" })
  .option("prepopulate", { type: "boolean", default: false, description: "Pre-populate cache before running backtest" })
  .option("cache-stats", { type: "boolean", default: false, description: "Show cache statistics after backtest" })
  // Sentiment Analysis parameters
  .option("lookbackDays", { type: "number", default: 3, description: "Days of news to consider" })
  .option("pollIntervalMinutes", { type: "number", default: 0, description: "Polling interval in minutes for news" })
  .option("minArticles", { type: "number", default: 2, description: "Minimum news articles required" })
  .option("buyThreshold", { type: "number", default: 0.4, description: "Aggregate sentiment threshold to BUY" })
  .option("sellThreshold", { type: "number", default: -0.4, description: "Aggregate sentiment threshold to SELL" })
  .option("titleWeight", { type: "number", default: 2.0, description: "Weight of title vs description" })
  .option("recencyHalfLifeHours", { type: "number", default: 12, description: "Half-life in hours for recency weighting" })
  .option("newsSource", { type: "string", default: "yahoo", choices: ["tiingo", "yahoo"], description: "News provider for sentiment strategy" })
  // Mean Reversion parameters
  .option("window", { type: "number", default: 20, description: "Moving average window (x days)" })
  .option("threshold", { type: "number", default: 0.05, description: "Percentage threshold (y percent, e.g., 0.05 for 5%)" })
  // Moving Average Crossover parameters
  .option("fastWindow", { type: "number", default: 10, description: "Fast moving average window" })
  .option("slowWindow", { type: "number", default: 30, description: "Slow moving average window" })
  .option("maType", { type: "string", default: "SMA", choices: ["SMA", "EMA"], description: "Moving average type" })
  // Momentum parameters
  .option("rsiWindow", { type: "number", default: 14, description: "RSI calculation window" })
  .option("rsiOverbought", { type: "number", default: 70, description: "RSI overbought threshold" })
  .option("rsiOversold", { type: "number", default: 30, description: "RSI oversold threshold" })
  .option("momentumWindow", { type: "number", default: 10, description: "Momentum calculation window" })
  .option("momentumThreshold", { type: "number", default: 0.02, description: "Momentum threshold" })
  // Bollinger Bands parameters
  .option("multiplier", { type: "number", default: 2.0, description: "Standard deviation multiplier" })
  // Breakout parameters
  .option("lookbackWindow", { type: "number", default: 20, description: "Lookback window for support/resistance" })
  .option("breakoutThreshold", { type: "number", default: 0.01, description: "Breakout threshold" })
  .option("minVolumeRatio", { type: "number", default: 1.5, description: "Minimum volume ratio" })
  .option("confirmationPeriod", { type: "number", default: 2, description: "Confirmation period in days" })
  // Custom strategy support
  .option("custom-strategy", { type: "string", description: "JSON-encoded custom strategy config" })
  // Session settings support
  .option("session-settings", { type: "string", description: "JSON-encoded session settings" })
  .parseSync();

/**
 * Run a custom strategy backtest on historical data
 */
function runCustomStrategyStrategy(
  symbol: string,
  data: { date: string; close: number; open: number; volume?: number }[],
  config: {
    buy_conditions: ConditionNode | ConditionNode[];
    sell_conditions: ConditionNode | ConditionNode[];
    name: string;
    initialCapital: number;
    sharesPerTrade: number;
  }
): {
  trades: any[];
  finalPortfolioValue: number;
  totalReturn: number;
  winRate: number;
  maxDrawdown: number;
  portfolioHistory: Array<{
    date: string;
    portfolioValue: number;
    cash: number;
    shares: number;
    price: number;
  }>;
} {
  const trades: any[] = [];
  let currentShares = 0;
  let cash = config.initialCapital;
  let portfolioHistory: Array<{
    date: string;
    portfolioValue: number;
    cash: number;
    shares: number;
    price: number;
  }> = [];
  let winningTrades = 0;
  let totalTrades = 0;
  let maxPortfolioValue = config.initialCapital;
  let maxDrawdown = 0;

  // Convert formatted data to PriceData format for CustomStrategyExecutor
  const priceDataHistory: PriceData[] = data.map((d) => ({
    date: d.date,
    open: d.open,
    high: d.open, // Approximate high with open
    low: d.open, // Approximate low with open
    close: d.close,
    volume: d.volume || 1
  }));

  // Track entry prices for win rate calculation
  const entryPrices: number[] = [];

  for (let i = 0; i < data.length; i++) {
    const dayData = data[i];
    
    // Get price data up to current point
    const currentPriceData = priceDataHistory.slice(0, i + 1);
    
    // Need at least 10 data points for custom strategy to work
    if (currentPriceData.length < 10) {
      // Still track portfolio value
      const currentPortfolioValue = cash + (currentShares * dayData.close);
      portfolioHistory.push({
        date: dayData.date,
        portfolioValue: currentPortfolioValue,
        cash: cash,
        shares: currentShares,
        price: dayData.close
      });
      continue;
    }

    // Execute custom strategy to get signal
    let signal: 'BUY' | 'SELL' | null = null;
    try {
      signal = CustomStrategyExecutor.executeStrategy(
        config.buy_conditions,
        config.sell_conditions,
        currentPriceData
      );
    } catch (error) {
      console.error(`Error executing custom strategy at ${dayData.date}:`, error);
      signal = null;
    }

    if (signal === 'BUY' && cash >= dayData.close && currentShares === 0) {
      // Execute buy order
      const sharesToBuy = Math.floor(cash / dayData.close);
      const actualShares = Math.min(sharesToBuy, config.sharesPerTrade);
      const cost = actualShares * dayData.close;
      
      cash -= cost;
      currentShares += actualShares;
      entryPrices.push(dayData.close);
      
      trades.push({
        symbol,
        date: dayData.date,
        action: "BUY",
        price: dayData.close,
        shares: actualShares
      });
    } else if (signal === 'SELL' && currentShares > 0) {
      // Execute sell order
      const sharesToSell = Math.min(currentShares, config.sharesPerTrade);
      const proceeds = sharesToSell * dayData.close;
      
      cash += proceeds;
      currentShares -= sharesToSell;
      
      // Calculate P&L for this trade
      const entryPrice = entryPrices.shift() || dayData.close;
      const pnl = (dayData.close - entryPrice) * sharesToSell;
      
      trades.push({
        symbol,
        date: dayData.date,
        action: "SELL",
        price: dayData.close,
        shares: sharesToSell
      });

      // Track winning trades for win rate calculation
      if (pnl > 0) {
        winningTrades++;
      }
      totalTrades++;
    }

    // Calculate current portfolio value
    const currentPortfolioValue = cash + (currentShares * dayData.close);
    
    // Track detailed portfolio history
    portfolioHistory.push({
      date: dayData.date,
      portfolioValue: currentPortfolioValue,
      cash: cash,
      shares: currentShares,
      price: dayData.close
    });
    
    if (currentPortfolioValue > maxPortfolioValue) {
      maxPortfolioValue = currentPortfolioValue;
    } else {
      const currentDrawdown = (maxPortfolioValue - currentPortfolioValue) / maxPortfolioValue;
      if (currentDrawdown > maxDrawdown) {
        maxDrawdown = currentDrawdown;
      }
    }
  }

  // Calculate final portfolio value
  const finalPrice = data.length > 0 ? data[data.length - 1].close : 0;
  const finalPortfolioValue = cash + (currentShares * finalPrice);
  const totalReturn = (finalPortfolioValue - config.initialCapital) / config.initialCapital;
  const winRate = totalTrades > 0 ? winningTrades / totalTrades : 0;

  return { 
    trades, 
    finalPortfolioValue, 
    totalReturn,
    winRate,
    maxDrawdown,
    portfolioHistory
  };
}

async function main() {
  // Validate API key requirement for Polygon REST API provider
  if (argv.provider === "polygon" && !process.env.POLYGON_API_KEY) {
    console.error("Error: POLYGON_API_KEY environment variable is required when using polygon provider");
    console.error("Please set your Polygon API key: export POLYGON_API_KEY=your_api_key_here");
    process.exit(1);
  }

  // Validate S3 credentials for flat files provider
  if (argv.provider === "polygon-flatfiles" && (!process.env.POLYGON_AWS_ACCESS_KEY_ID || !process.env.POLYGON_AWS_SECRET_ACCESS_KEY)) {
    console.error("Error: S3 credentials are required for polygon-flatfiles provider");
    console.error("Please set your S3 credentials:");
    console.error("  export POLYGON_AWS_ACCESS_KEY_ID=your_s3_access_key");
    console.error("  export POLYGON_AWS_SECRET_ACCESS_KEY=your_s3_secret_key");
    process.exit(1);
  }

  // Initialize data provider based on configuration
  let dataProvider;
  let cacheKey;
  
  if (argv.provider === "polygon") {
    dataProvider = new PolygonProvider(process.env.POLYGON_API_KEY!);
    cacheKey = "polygon";
  } else if (argv.provider === "polygon-flatfiles") {
    dataProvider = new PolygonFlatFilesCLIProvider({
      accessKeyId: process.env.POLYGON_AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.POLYGON_AWS_SECRET_ACCESS_KEY!,
    });
    cacheKey = "polygon-flatfiles";
  } else {
    dataProvider = new YahooDataProvider();
    cacheKey = "yahoo";
  }
  
  const smartCache = new SmartCacheManager(dataProvider, cacheKey)
  
  // Pre-populate cache if requested
  if (argv.prepopulate) {
    console.log("Pre-populating cache...");
    await smartCache.prePopulateCache(argv.symbol, "day", argv.start, argv.end);
  }
  
  // Get data (with or without cache based on --no-cache flag)
  const data = argv.noCache 
    ? await dataProvider.getHistorical(argv.symbol, "day", argv.start, argv.end)
    : await smartCache.getHistoricalSmart(argv.symbol, "day", argv.start, argv.end);
  
  if(data){
    const formattedData = data.map((d) => {
      const {date, close, open, volume} = d;
      return {
        date: new Date(date).toDateString(),
        close, 
        open,
        volume: volume || 1
      };
    });

    let result: any;
    let strategyDescription: string;

    // Run the appropriate strategy based on the strategy parameter
    switch (argv.strategy) {
      case 'meanReversion':
        result = runMeanReversionStrategy(argv.symbol, formattedData, {
          window: argv.window,
          threshold: argv.threshold,
          initialCapital: argv.capital,
          sharesPerTrade: argv.shares
        });
        strategyDescription = `${argv.window}-day MA with ${(argv.threshold * 100).toFixed(1)}% threshold`;
        break;

      case 'movingAverageCrossover':
        result = runMovingAverageCrossoverStrategy(argv.symbol, formattedData, {
          fastWindow: argv.fastWindow,
          slowWindow: argv.slowWindow,
          maType: argv.maType as 'SMA' | 'EMA',
          initialCapital: argv.capital,
          sharesPerTrade: argv.shares
        });
        strategyDescription = `${argv.fastWindow}/${argv.slowWindow}-day ${argv.maType} crossover`;
        break;

      case 'momentum':
        result = runMomentumStrategy(argv.symbol, formattedData, {
          rsiWindow: argv.rsiWindow,
          rsiOverbought: argv.rsiOverbought,
          rsiOversold: argv.rsiOversold,
          momentumWindow: argv.momentumWindow,
          momentumThreshold: argv.momentumThreshold,
          initialCapital: argv.capital,
          sharesPerTrade: argv.shares
        });
        strategyDescription = `RSI(${argv.rsiWindow}) ${argv.rsiOversold}/${argv.rsiOverbought}, Momentum(${argv.momentumWindow}) ${(argv.momentumThreshold * 100).toFixed(1)}%`;
        break;

      case 'bollingerBands':
        result = runBollingerBandsStrategy(argv.symbol, formattedData, {
          window: argv.window,
          multiplier: argv.multiplier,
          maType: argv.maType as 'SMA' | 'EMA',
          initialCapital: argv.capital,
          sharesPerTrade: argv.shares
        });
        strategyDescription = `${argv.window}-day ${argv.maType} with ${argv.multiplier}x standard deviation`;
        break;

      case 'breakout':
        result = runBreakoutStrategy(argv.symbol, formattedData, {
          lookbackWindow: argv.lookbackWindow,
          breakoutThreshold: argv.breakoutThreshold,
          minVolumeRatio: argv.minVolumeRatio,
          confirmationPeriod: argv.confirmationPeriod,
          initialCapital: argv.capital,
          sharesPerTrade: argv.shares
        });
        strategyDescription = `${argv.lookbackWindow}-day levels, ${(argv.breakoutThreshold * 100).toFixed(1)}% threshold, ${argv.confirmationPeriod}-day hold`;
        break;

      case 'sentimentAnalysis':
        // Placeholder aggregation behavior: backtest not available in core yet.
        // Return neutral, allowing API to include this strategy in the list and client to configure.
        result = {
          trades: [],
          finalPortfolioValue: argv.capital,
          totalReturn: 0,
          winRate: 0,
          maxDrawdown: 0,
        };
        strategyDescription = `News Sentiment (lookback=${argv.lookbackDays}d, buy>=${argv.buyThreshold}, sell<=${argv.sellThreshold}, source=${argv.newsSource})`;
        break;

      case 'custom':
        if (!argv.customStrategy) {
          throw new Error('Custom strategy config is required when strategy is "custom"');
        }
        const customConfig = JSON.parse(argv.customStrategy as string);
        result = runCustomStrategyStrategy(argv.symbol, formattedData, {
          buy_conditions: customConfig.buy_conditions,
          sell_conditions: customConfig.sell_conditions,
          name: `Custom Strategy ${customConfig.id || ''}`,
          initialCapital: argv.capital,
          sharesPerTrade: argv.shares
        });
        strategyDescription = `Custom Strategy (ID: ${customConfig.id || 'N/A'})`;
        break;

      default:
        // Fallback to legacy runStrategy for backward compatibility
        const config: StrategyConfig = {
          window: argv.window,
          threshold: argv.threshold,
          initialCapital: argv.capital,
          sharesPerTrade: argv.shares
        };
        result = runStrategy(argv.symbol, formattedData, config);
        strategyDescription = `${argv.window}-day MA with ${(argv.threshold * 100).toFixed(1)}% threshold`;
    }
    
    console.log(`\n=== Backtest Results for ${argv.symbol} ===`);
    console.log(`Period: ${argv.start} to ${argv.end}`);
    console.log(`Data Provider: ${argv.provider.toUpperCase()}`);
    console.log(`Strategy: ${strategyDescription}`);
    console.log(`Initial Capital: $${argv.capital.toLocaleString()}`);
    console.log(`Final Portfolio Value: $${result.finalPortfolioValue.toLocaleString()}`);
    console.log(`Total Return: ${(result.totalReturn * 100).toFixed(2)}%`);
    console.log(`Win Rate: ${(result.winRate * 100).toFixed(1)}%`);
    console.log(`Max Drawdown: ${(result.maxDrawdown * 100).toFixed(2)}%`);
    console.log(`Total Trades: ${result.trades.length}`);
    
    console.log(`\n=== Trade Details ===`);
    result.trades.forEach((trade: any, index: number) => {
      let extraInfo = '';
      if (trade.deviation) {
        extraInfo = ` (${(trade.deviation * 100).toFixed(1)}% from MA)`;
      } else if (trade.rsi) {
        extraInfo = ` (RSI: ${trade.rsi.toFixed(1)})`;
      } else if (trade.momentum) {
        extraInfo = ` (Momentum: ${(trade.momentum * 100).toFixed(1)}%)`;
      } else if (trade.bandPosition !== undefined) {
        extraInfo = ` (Band Position: ${(trade.bandPosition * 100).toFixed(1)}%)`;
      } else if (trade.breakoutType) {
        extraInfo = ` (${trade.breakoutType} breakout)`;
      }
      console.log(`${index + 1}. ${trade.date}: ${trade.action} ${trade.shares} shares at $${trade.price.toFixed(2)}${extraInfo}`);
    });
    
    // Output the complete result as JSON for the API to parse
    console.log(`\n=== JSON_RESULT ===`);
    console.log(JSON.stringify(result));
    
    // Show cache statistics if requested
    if (argv.cacheStats && !argv.noCache) {
      console.log(`\n=== Cache Statistics ===`);
      const cacheAnalysis = await smartCache.getCacheAnalysis(argv.symbol);
      console.log(`Provider: ${argv.provider.toUpperCase()}`);
      console.log(`Symbol: ${argv.symbol}`);
      console.log(`Cached ranges: ${cacheAnalysis.totalRanges}`);
      if (cacheAnalysis.coverage) {
        console.log(`Coverage: ${cacheAnalysis.coverage.start} to ${cacheAnalysis.coverage.end} (${cacheAnalysis.coverage.totalDays} days)`);
      }
    }
  } else {
    console.error("Failed to fetch data for symbol:", argv.symbol);
  }
}

main().catch(console.error);