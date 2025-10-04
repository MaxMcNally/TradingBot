import { TradingMode } from './config.js';

export class Portfolio {
  constructor(initialCash = 10000, mode = TradingMode.PAPER, symbols = []) {
    this.mode = mode;
    this.cash = initialCash;
    // track positions per symbol
    this.positions = {};
    symbols.forEach((symbol) => {
      this.positions[symbol] = { shares: 0, avgPrice: 0 };
    });
  }

  buy(symbol, price, quantity = 1) {
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

  sell(symbol, price, quantity = 1) {
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

  status(latestPrices = {}) {
    const positionsValue = Object.entries(this.positions).reduce((sum, [symbol, pos]) => {
      const price = latestPrices[symbol] || pos.avgPrice;
      return sum + pos.shares * price;
    }, 0);
    return {
      cash: this.cash,
      positions: this.positions,
      totalValue: this.cash + positionsValue,
      mode: this.mode,
    };
  }
}
