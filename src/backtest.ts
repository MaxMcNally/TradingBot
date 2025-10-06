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
import {YahooDataProvider} from "./dataProviders/yahooProvider"
import {PolygonProvider} from "./dataProviders/PolygonProvider"
import {PolygonFlatFilesProvider} from "./dataProviders/PolygonFlatFilesProvider"
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
  .parseSync();

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
    dataProvider = new PolygonFlatFilesProvider({
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
    await smartCache.prePopulateCache(argv.symbol, "1d", argv.start, argv.end);
  }
  
  // Get data (with or without cache based on --no-cache flag)
  const data = argv.noCache 
    ? await dataProvider.getHistorical(argv.symbol, "1d", argv.start, argv.end)
    : await smartCache.getHistoricalSmart(argv.symbol, "1d", argv.start, argv.end);
  
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