#!/usr/bin/env ts-node
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { runStrategy, StrategyConfig } from "./strategies/runStrategy";
import {YahooDataProvider} from "./dataProviders/yahooProvider"

const argv = yargs(hideBin(process.argv))
  .option("symbol", { type: "string", demandOption: true })
  .option("start", { type: "string", demandOption: true })
  .option("end", { type: "string", demandOption: true })
  .option("window", { type: "number", default: 20, description: "Moving average window (x days)" })
  .option("threshold", { type: "number", default: 0.05, description: "Percentage threshold (y percent, e.g., 0.05 for 5%)" })
  .option("capital", { type: "number", default: 10000, description: "Initial capital" })
  .option("shares", { type: "number", default: 100, description: "Shares per trade" })
  .parseSync();

async function main() {
  const dataProvider = new YahooDataProvider()
  const data = await dataProvider.getHistorical(argv.symbol, argv.start, argv.end);
  
  if(data){
    const config: StrategyConfig = {
      window: argv.window,
      threshold: argv.threshold,
      initialCapital: argv.capital,
      sharesPerTrade: argv.shares
    };

    const result = runStrategy(argv.symbol, data?.map((d)=> {
      const {date,close, open} = d;
      return {date : date.toDateString(),close, open}
    }), config); 
    
    console.log(`\n=== Backtest Results for ${argv.symbol} ===`);
    console.log(`Period: ${argv.start} to ${argv.end}`);
    console.log(`Strategy: ${argv.window}-day MA with ${(argv.threshold * 100).toFixed(1)}% threshold`);
    console.log(`Initial Capital: $${argv.capital.toLocaleString()}`);
    console.log(`Final Portfolio Value: $${result.finalPortfolioValue.toLocaleString()}`);
    console.log(`Total Return: ${(result.totalReturn * 100).toFixed(2)}%`);
    console.log(`Win Rate: ${(result.winRate * 100).toFixed(1)}%`);
    console.log(`Max Drawdown: ${(result.maxDrawdown * 100).toFixed(2)}%`);
    console.log(`Total Trades: ${result.trades.length}`);
    
    console.log(`\n=== Trade Details ===`);
    result.trades.forEach((trade, index) => {
      const deviation = trade.deviation ? ` (${(trade.deviation * 100).toFixed(1)}% from MA)` : '';
      console.log(`${index + 1}. ${trade.date}: ${trade.action} ${trade.shares} shares at $${trade.price.toFixed(2)}${deviation}`);
    });
  } else {
    console.error("Failed to fetch data for symbol:", argv.symbol);
  }
}

main().catch(console.error);