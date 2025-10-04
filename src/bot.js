import dotenv from "dotenv";
import { PolygonProvider } from "./dataProviders/polygonProvider.js";
import { MovingAverageStrategy } from "./strategies/movingAverage.js";
import { Portfolio } from "./portfolio.js";
import { TradingMode } from "./config.js";
import stocks from "./config/stocks.json" assert { type: "json" };

dotenv.config();

const mode = process.env.TRADING_MODE || TradingMode.PAPER;
console.log(`🚀 Starting bot in ${mode.toUpperCase()} mode`);

const provider = new PolygonProvider(process.env.POLYGON_API_KEY);
const portfolio = new Portfolio(10000, mode, stocks.symbols);

// create one strategy per symbol
const strategies = {};
stocks.symbols.forEach((symbol) => {
  strategies[symbol] = new MovingAverageStrategy(5, 10);
});

async function run() {
  console.log(`📊 Subscribing to: ${stocks.symbols.join(", ")}`);

  // fetch initial quotes
  const latestPrices = {};
  for (const symbol of stocks.symbols) {
    const quote = await provider.getQuote(symbol);
    latestPrices[symbol] = quote.price;
    console.log(`Initial Quote [${symbol}]:`, quote);
  }

  // subscribe to live stream
  provider.connectStream(stocks.symbols, (data) => {
    const trades = data.filter((d) => d.ev === "T");
    if (trades.length === 0) return;

    trades.forEach((trade) => {
      const { sym: symbol, p: price } = trade;
      latestPrices[symbol] = price;

      // add price to that symbol's strategy
      const strategy = strategies[symbol];
      strategy.addPrice(price);
      const signal = strategy.getSignal();

      // execute trade per symbol
      if (signal === "BUY") portfolio.buy(symbol, price);
      if (signal === "SELL") portfolio.sell(symbol, price);
    });

    // print portfolio status
    const status = portfolio.status(latestPrices);
    console.log(
      `Mode: ${status.mode} | Total Value: $${status.totalValue.toFixed(
        2
      )} | Cash: $${status.cash.toFixed(2)}`
    );
    console.table(status.positions);
  });
}

run();
