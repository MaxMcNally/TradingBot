#!/usr/bin/env ts-node
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { CacheManager } from "./CacheManager";
import { SmartCacheManager } from "./SmartCacheManager";
import { YahooDataProvider } from "../dataProviders/yahooProvider";
import path from "path";

const cacheManager = new CacheManager();

const argv = yargs(hideBin(process.argv))
  .command("stats", "Show cache statistics", {}, async () => {
    const stats = await cacheManager.getStats();
    if (stats) {
      console.log("\n=== Cache Statistics ===");
      console.log(`Total Entries: ${stats.overview.totalEntries}`);
      console.log(`Total Size: ${stats.overview.totalSizeMB} MB`);
      console.log(`Hit Rate: ${stats.overview.hitRate}`);
      console.log(`Oldest Entry: ${stats.overview.oldestEntry}`);
      console.log(`Newest Entry: ${stats.overview.newestEntry}`);
      
      console.log("\n=== Provider Statistics ===");
      stats.providerStats.forEach((stat: any) => {
        console.log(`${stat.provider}: ${stat.entries} entries, ${stat.totalSizeMB} MB, avg ${stat.avg_access.toFixed(1)} accesses`);
      });
      
      console.log("\n=== Top Symbols ===");
      stats.topSymbols.slice(0, 10).forEach((stat: any) => {
        console.log(`${stat.symbol}: ${stat.entries} entries, ${stat.totalSizeMB} MB (${stat.earliest_date} to ${stat.latest_date})`);
      });
    }
  })
  .command("cleanup", "Clean up old cache entries", {
    days: { type: "number", default: 30, description: "Remove entries older than N days" },
    maxSize: { type: "number", default: 1000, description: "Max cache size in MB" },
    minAccess: { type: "number", default: 1, description: "Min access count to keep" },
    dryRun: { type: "boolean", default: false, description: "Show what would be removed without actually removing" }
  }, async (args) => {
    const result = await cacheManager.cleanup({
      daysOld: args.days,
      maxSizeMB: args.maxSize,
      minAccessCount: args.minAccess,
      dryRun: args.dryRun
    });
    
    console.log(`\n=== Cleanup Results ===`);
    console.log(`Entries to remove: ${result.entriesRemoved}`);
    console.log(`Size to free: ${result.sizeFreedMB} MB`);
    console.log(`Mode: ${result.dryRun ? 'DRY RUN' : 'EXECUTED'}`);
  })
  .command("export", "Export cache to JSON file", {
    path: { type: "string", demandOption: true, description: "Export file path" },
    symbol: { type: "string", description: "Export only specific symbol" }
  }, async (args) => {
    await cacheManager.exportCache(args.path, args.symbol);
  })
  .command("import", "Import cache from JSON file", {
    path: { type: "string", demandOption: true, description: "Import file path" },
    overwrite: { type: "boolean", default: false, description: "Overwrite existing entries" }
  }, async (args) => {
    await cacheManager.importCache(args.path, args.overwrite);
  })
  .command("prepopulate", "Pre-populate cache for a symbol", {
    symbol: { type: "string", demandOption: true, description: "Symbol to pre-populate" },
    from: { type: "string", demandOption: true, description: "Start date (YYYY-MM-DD)" },
    to: { type: "string", demandOption: true, description: "End date (YYYY-MM-DD)" },
    interval: { type: "string", default: "1d", description: "Data interval" },
    chunkSize: { type: "number", default: 365, description: "Chunk size in days" }
  }, async (args) => {
    const yahooProvider = new YahooDataProvider();
    const smartCache = new SmartCacheManager(yahooProvider, "yahoo");
    
    console.log(`Pre-populating cache for ${args.symbol}...`);
    await smartCache.prePopulateCache(args.symbol, args.interval, args.from, args.to, args.chunkSize);
    
    // Show analysis after pre-population
    const analysis = await smartCache.getCacheAnalysis(args.symbol);
    console.log(`\n=== Cache Analysis for ${args.symbol} ===`);
    console.log(`Cached ranges: ${analysis.totalRanges}`);
    if (analysis.coverage) {
      console.log(`Coverage: ${analysis.coverage.start} to ${analysis.coverage.end} (${analysis.coverage.totalDays} days)`);
    }
  })
  .command("analyze", "Analyze cache for a specific symbol", {
    symbol: { type: "string", demandOption: true, description: "Symbol to analyze" }
  }, async (args) => {
    const yahooProvider = new YahooDataProvider();
    const smartCache = new SmartCacheManager(yahooProvider, "yahoo");
    
    const analysis = await smartCache.getCacheAnalysis(args.symbol);
    console.log(`\n=== Cache Analysis for ${args.symbol} ===`);
    console.log(`Total cached ranges: ${analysis.totalRanges}`);
    
    if (analysis.cachedRanges.length > 0) {
      console.log("\nCached ranges:");
      analysis.cachedRanges.forEach((range: any, index: number) => {
        console.log(`  ${index + 1}. ${range.start} to ${range.end}`);
      });
      
      if (analysis.coverage) {
        console.log(`\nCoverage: ${analysis.coverage.start} to ${analysis.coverage.end} (${analysis.coverage.totalDays} days)`);
      }
    } else {
      console.log("No cached data found for this symbol.");
    }
  })
  .command("config", "Manage cache configuration", {
    get: { type: "boolean", description: "Show current configuration" },
    set: { type: "string", description: "Set configuration key=value" }
  }, async (args) => {
    if (args.get) {
      const config = await cacheManager.getConfig();
      console.log("\n=== Cache Configuration ===");
      Object.entries(config).forEach(([key, value]: [string, any]) => {
        console.log(`${key}: ${value.value} (${value.description})`);
      });
    } else if (args.set) {
      const [key, value] = args.set.split('=');
      if (!key || !value) {
        console.error("Invalid format. Use: key=value");
        process.exit(1);
      }
      await cacheManager.updateConfig(key, value);
    } else {
      console.error("Use --get to show config or --set key=value to set config");
      process.exit(1);
    }
  })
  .demandCommand(1, "You must specify a command")
  .help()
  .parseSync();

// Handle any errors
process.on('unhandledRejection', (error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
