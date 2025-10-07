import { TradingMode, TradingModeType } from './config';

export interface Position {
  shares: number;
  avgPrice: number;
}

export interface PortfolioStatus {
  cash: number;
  positions: Record<string, Position>;
  totalValue: number;
  mode: TradingModeType;
}

export class Portfolio {
  private mode: TradingModeType;
  private cash: number;
  private positions: Record<string, Position>;

  constructor(initialCash: number = 10000, mode: TradingModeType = TradingMode.PAPER, symbols: string[] = []) {
    this.mode = mode;
    this.cash = initialCash;
    // track positions per symbol
    this.positions = {};
    symbols.forEach((symbol) => {
      this.positions[symbol] = { shares: 0, avgPrice: 0 };
    });
  }

  buy(symbol: string, price: number, quantity: number = 1): void {
    if (this.mode === TradingMode.PAPER) {
      const cost = price * quantity;
      if (this.cash >= cost) {
        const pos = this.positions[symbol];
        pos.avgPrice = (pos.avgPrice * pos.shares + cost) / (pos.shares + quantity);
        pos.shares += quantity;
        this.cash -= cost;
        console.log(`[PAPER] Bought ${quantity} ${symbol} at $${price}`);
      }
    } else if (this.mode === TradingMode.LIVE) {
      console.log(`[LIVE] Would place BUY order: ${quantity} ${symbol} at $${price}`);
      // TODO: implement broker API call
    }
  }

  sell(symbol: string, price: number, quantity: number = 1): void {
    if (this.mode === TradingMode.PAPER) {
      const pos = this.positions[symbol];
      if (pos.shares >= quantity) {
        pos.shares -= quantity;
        this.cash += price * quantity;
        console.log(`[PAPER] Sold ${quantity} ${symbol} at $${price}`);
      }
    } else if (this.mode === TradingMode.LIVE) {
      console.log(`[LIVE] Would place SELL order: ${quantity} ${symbol} at $${price}`);
      // TODO: implement broker API call
    }
  }

  status(latestPrices: Record<string, number> = {}): PortfolioStatus {
    let positionsValue = 0;
    // Manual loop is measurably faster than Array.reduce in hot paths
    for (const symbol in this.positions) {
      const pos = this.positions[symbol];
      const price = (symbol in latestPrices) ? latestPrices[symbol] : pos.avgPrice;
      positionsValue += pos.shares * price;
    }
    return {
      cash: this.cash,
      positions: this.positions,
      totalValue: this.cash + positionsValue,
      mode: this.mode,
    };
  }
}
