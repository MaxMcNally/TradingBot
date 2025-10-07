import { runMeanReversionStrategy } from './meanReversionStrategy';

export interface Trade {
  symbol: string;
  date: string;
  action: "BUY" | "SELL";
  price: number;
  shares: number;
  movingAverage?: number;
  deviation?: number;
}

export interface BacktestResult {
  trades: Trade[];
  finalPortfolioValue: number;
  totalReturn: number;
  winRate: number;
  maxDrawdown: number;
}

export interface StrategyConfig {
  window: number;        // x-day moving average window
  threshold: number;     // y percent threshold (e.g., 0.05 for 5%)
  initialCapital: number;
  sharesPerTrade: number;
}

export function runStrategy(
  symbol: string,
  data: { date: string; close: number, open: number }[],
  config: StrategyConfig = {
    window: 20,
    threshold: 0.05,
    initialCapital: 10000,
    sharesPerTrade: 100
  }
): BacktestResult {
  // Use the dedicated mean reversion strategy (already optimized for O(1) rolling MA)
  const result = runMeanReversionStrategy(symbol, data, config);
  
  // Convert the result to match the expected interface
  return {
    trades: result.trades,
    finalPortfolioValue: result.finalPortfolioValue,
    totalReturn: result.totalReturn,
    winRate: result.winRate,
    maxDrawdown: result.maxDrawdown
  };
}
