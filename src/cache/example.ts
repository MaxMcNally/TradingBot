#!/usr/bin/env ts-node
/**
 * Example script demonstrating the caching system
 * Run with: npx ts-node src/cache/example.ts
 */

import { YahooDataProvider } from "../dataProviders/yahooProvider";
import { SmartCacheManager } from "./SmartCacheManager";
import { CacheManager } from "./CacheManager";

async function demonstrateCaching() {
  console.log("🚀 Trading Bot Cache Layer Demo\n");

  const yahooProvider = new YahooDataProvider();
  const smartCache = new SmartCacheManager(yahooProvider, "yahoo");
  const cacheManager = new CacheManager();

  const symbol = "AAPL";
  const startDate = "2023-01-01";
  const endDate = "2023-12-31";

  console.log(`📊 Fetching data for ${symbol} from ${startDate} to ${endDate}\n`);

  // First fetch - will hit the API
  console.log("1️⃣ First fetch (should hit API):");
  const start1 = Date.now();
  const data1 = await smartCache.getHistoricalSmart(symbol, "1d", startDate, endDate);
  const time1 = Date.now() - start1;
  console.log(`   ✅ Fetched ${data1.length} data points in ${time1}ms\n`);

  // Second fetch - should use cache
  console.log("2️⃣ Second fetch (should use cache):");
  const start2 = Date.now();
  const data2 = await smartCache.getHistoricalSmart(symbol, "1d", startDate, endDate);
  const time2 = Date.now() - start2;
  console.log(`   ✅ Fetched ${data2.length} data points in ${time2}ms`);
  console.log(`   🚀 Speed improvement: ${Math.round((time1 / time2) * 100) / 100}x faster\n`);

  // Partial fetch - should use cache for overlapping data
  console.log("3️⃣ Partial fetch (should use cache + minimal API calls):");
  const partialStart = "2023-06-01";
  const partialEnd = "2023-08-31";
  const start3 = Date.now();
  const data3 = await smartCache.getHistoricalSmart(symbol, "1d", partialStart, partialEnd);
  const time3 = Date.now() - start3;
  console.log(`   ✅ Fetched ${data3.length} data points in ${time3}ms\n`);

  // Show cache statistics
  console.log("📈 Cache Statistics:");
  const stats = await cacheManager.getStats();
  if (stats) {
    console.log(`   Total entries: ${stats.overview.totalEntries}`);
    console.log(`   Total size: ${stats.overview.totalSizeMB} MB`);
    console.log(`   Hit rate: ${stats.overview.hitRate}\n`);
  }

  // Show symbol-specific analysis
  console.log("🔍 Symbol Analysis:");
  const analysis = await smartCache.getCacheAnalysis(symbol);
  console.log(`   Symbol: ${symbol}`);
  console.log(`   Cached ranges: ${analysis.totalRanges}`);
  if (analysis.coverage) {
    console.log(`   Coverage: ${analysis.coverage.start} to ${analysis.coverage.end} (${analysis.coverage.totalDays} days)`);
  }

  console.log("\n✨ Demo complete! The cache layer successfully minimized API calls.");
}

// Run the demo
demonstrateCaching().catch(console.error);
