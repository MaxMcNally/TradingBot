import fs from 'fs';
import { createObjectCsvWriter } from 'csv-writer';

export class Backtester {
  constructor({
    provider, portfolio, strategies, symbols,
  }) {
    this.provider = provider;
    this.portfolio = portfolio;
    this.strategies = strategies;
    this.symbols = symbols;
    this.trades = []; // log of all trades
  }

  async run({
    from, to, interval = 'day', csvFile = 'trade_history.csv',
  }) {
    console.log(`📈 Running backtest from ${from} to ${to} with interval ${interval}`);
    const latestPrices = {};
    let peakValue = this.portfolio.cash;
    let maxDrawdown = 0;

    for (const symbol of this.symbols) {
      const historical = await this.provider.getHistorical(symbol, interval, from, to);
      console.log(`Fetched ${historical.length} bars for ${symbol}`);

      for (const bar of historical) {
        const price = bar.c; // close price
        latestPrices[symbol] = price;

        // update strategy
        const strategy = this.strategies[symbol];
        strategy.addPrice(price);
        const signal = strategy.getSignal();

        // execute trade and log it
        if (signal === 'BUY') {
          this.portfolio.buy(symbol, price);
          this.trades.push({
            date: bar.t, symbol, action: 'BUY', price, quantity: 1, pnl: 0,
          });
        }
        if (signal === 'SELL') {
          // calculate P/L
          const pos = this.portfolio.positions[symbol];
          const tradePnl = (price - pos.avgPrice) * 1; // qty = 1
          this.portfolio.sell(symbol, price);
          this.trades.push({
            date: bar.t, symbol, action: 'SELL', price, quantity: 1, pnl: tradePnl,
          });
        }

        // track portfolio value for drawdown
        const { totalValue } = this.portfolio.status(latestPrices);
        peakValue = Math.max(peakValue, totalValue);
        const drawdown = (peakValue - totalValue) / peakValue;
        maxDrawdown = Math.max(maxDrawdown, drawdown);
      }
    }

    // final portfolio status
    const status = this.portfolio.status(latestPrices);
    console.log('✅ Backtest complete. Final portfolio status:');
    console.table(status.positions);
    console.log(`Cash: $${status.cash.toFixed(2)} | Total Value: $${status.totalValue.toFixed(2)}`);
    console.log(`Max Drawdown: ${(maxDrawdown * 100).toFixed(2)}%`);

    // total trades & win rate
    const buys = this.trades.filter((t) => t.action === 'BUY').length;
    const sells = this.trades.filter((t) => t.action === 'SELL').length;
    const winningTrades = this.trades.filter((t) => t.action === 'SELL' && t.pnl > 0).length;
    const winRate = sells > 0 ? (winningTrades / sells) * 100 : 0;
    console.log(`Total Trades: ${this.trades.length} | Buys: ${buys} | Sells: ${sells} | Winning Trades: ${winningTrades} | Win Rate: ${winRate.toFixed(2)}%`);

    // export to CSV
    await this.exportCsv(csvFile);
    console.log(`📄 Trade history exported to ${csvFile}`);
  }

  async runWithBars(allBars, csvFile = 'trade_history.csv') {
    const latestPrices = {};
    let peakValue = this.portfolio.cash;
    let maxDrawdown = 0;

    for (const symbol of this.symbols) {
      const historical = allBars[symbol] || [];
      console.log(`Processing ${historical.length} bars for ${symbol}`);

      for (const bar of historical) {
        const price = bar.c;
        latestPrices[symbol] = price;

        // update strategy
        const strategy = this.strategies[symbol];
        strategy.addPrice(price);
        const signal = strategy.getSignal();

        // execute trade and log it
        if (signal === 'BUY') {
          this.portfolio.buy(symbol, price);
          this.trades.push({
            date: bar.t, symbol, action: 'BUY', price, quantity: 1, pnl: 0,
          });
        }
        if (signal === 'SELL') {
          const pos = this.portfolio.positions[symbol];
          const tradePnl = (price - pos.avgPrice) * 1;
          this.portfolio.sell(symbol, price);
          this.trades.push({
            date: bar.t, symbol, action: 'SELL', price, quantity: 1, pnl: tradePnl,
          });
        }

        // track drawdown
        const { totalValue } = this.portfolio.status(latestPrices);
        peakValue = Math.max(peakValue, totalValue);
        const drawdown = (peakValue - totalValue) / peakValue;
        maxDrawdown = Math.max(maxDrawdown, drawdown);
      }
    }

    // final status
    const status = this.portfolio.status(latestPrices);
    console.log('✅ Backtest complete. Final portfolio status:');
    console.table(status.positions);
    console.log(`Cash: $${status.cash.toFixed(2)} | Total Value: $${status.totalValue.toFixed(2)}`);
    console.log(`Max Drawdown: ${(maxDrawdown * 100).toFixed(2)}%`);

    // win rate
    const buys = this.trades.filter((t) => t.action === 'BUY').length;
    const sells = this.trades.filter((t) => t.action === 'SELL').length;
    const winningTrades = this.trades.filter((t) => t.action === 'SELL' && t.pnl > 0).length;
    const winRate = sells > 0 ? (winningTrades / sells) * 100 : 0;
    console.log(`Total Trades: ${this.trades.length} | Buys: ${buys} | Sells: ${sells} | Winning Trades: ${winningTrades} | Win Rate: ${winRate.toFixed(2)}%`);

    await this.exportCsv(csvFile);
    console.log(`📄 Trade history exported to ${csvFile}`);
  }

  async exportCsv(filePath) {
    if (this.trades.length === 0) return;

    const csvWriter = createObjectCsvWriter({
      path: filePath,
      header: [
        { id: 'date', title: 'Date' },
        { id: 'symbol', title: 'Symbol' },
        { id: 'action', title: 'Action' },
        { id: 'price', title: 'Price' },
        { id: 'quantity', title: 'Quantity' },
        { id: 'pnl', title: 'PnL' },
      ],
    });

    await csvWriter.writeRecords(this.trades);
  }
}
