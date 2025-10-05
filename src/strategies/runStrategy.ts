export interface Trade {
  symbol: string;
  date: string;
  action: "BUY" | "SELL";
  price: number;
  shares: number;
}

export interface BacktestResult {
  trades: Trade[];
  finalPortfolioValue: number;
}

export function runStrategy(
  symbol: string,
  data: { date: string; close: number }[]
): BacktestResult {
  const trades: Trade[] = [];

  // example simple strategy: buy at first day, sell at last
  if (data.length >= 2) {
    trades.push({
      symbol,
      date: data[0].date,
      action: "BUY",
      price: data[0].close,
      shares: 100,
    });

    trades.push({
      symbol,
      date: data[data.length - 1].date,
      action: "SELL",
      price: data[data.length - 1].close,
      shares: 100,
    });
  }

  const finalPortfolioValue = trades.reduce(
    (acc, t) =>
      t.action === "BUY" ? acc - t.price * t.shares : acc + t.price * t.shares,
    0
  );

  return { trades, finalPortfolioValue };
}
