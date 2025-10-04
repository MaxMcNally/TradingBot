import dotenv from "dotenv";
import { Portfolio } from "./portfolio.js";
import { MovingAverageStrategy } from "./strategies/movingAverage.js";
import { Backtester } from "./backtester.js";
import { PolygonS3Provider } from "./dataProviders/polygonS3Provider.js";
import stocks from "./data/stocks.json" with { type: "json" };

dotenv.config();

// parse ticker from command line
const args = process.argv.slice(2);
let tickerArg = null;
args.forEach(arg => {
  if (arg.startsWith("--ticker=")) {
    tickerArg = arg.split("=")[1].toUpperCase();
  }
});

const symbols = tickerArg ? [tickerArg] : stocks.symbols;

console.log(`Running backtest for: ${symbols.join(", ")}`);

// setup PolygonS3Provider
const provider = new PolygonS3Provider({
  accessKeyId: process.env.POLYGON_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.POLYGON_AWS_SECRET_ACCESS_KEY,
});

// setup portfolio and strategies
const portfolio = new Portfolio(10000, "paper", symbols);
const strategies = {};
symbols.forEach(symbol => {
  strategies[symbol] = new MovingAverageStrategy(5, 10);
});

const backtester = new Backtester({ provider, portfolio, strategies, symbols });

// run backtest
(async () => {
  for (const symbol of symbols) {
    const bars = [];

    // list available files in trades folder for 2024 March (adjust folder as needed)
    const files = await provider.listFiles("us_stocks_sip/");
    console.log("Files",files);
    const tickerFiles = files
      .map(f => f.Key)
      .filter(k => k.endsWith(".csv.gz"));

    console.log(`Found ${tickerFiles.length} files in folder for ${symbol}`);

    for (const key of tickerFiles) {
      try {
        const dailyTrades = await provider.fetchCSVGz(key);
        const tickerTrades = dailyTrades.filter(t => t.symbol === symbol);

        if (tickerTrades.length === 0) continue;

        // Aggregate OHLCV bar
        const o = parseFloat(tickerTrades[0].price);
        const c = parseFloat(tickerTrades[tickerTrades.length - 1].price);
        const h = Math.max(...tickerTrades.map(t => parseFloat(t.price)));
        const l = Math.min(...tickerTrades.map(t => parseFloat(t.price)));
        const v = tickerTrades.reduce((sum, t) => sum + parseInt(t.size), 0);
        const vw = tickerTrades.reduce((sum, t) => sum + parseFloat(t.price) * parseInt(t.size), 0) / v;
        const n = tickerTrades.length;

        // timestamp from filename
        const dateStr = key.match(/(\d{4}-\d{2}-\d{2})\.csv\.gz$/)[1];
        const t = new Date(dateStr).getTime();

        bars.push({ t, o, h, l, c, v, vw, n });
      } catch (err) {
        if (err.$metadata?.httpStatusCode === 404) {
          console.warn(`No trades file for ${key}`);
        } else {
          console.error(`Error fetching ${key}:`, err.message);
        }
      }
    }

    // run backtest for this symbol
    const allBars = { [symbol]: bars };
    await backtester.runWithBars(allBars, `trade_history_${symbol}.csv`);
    console.log(`Backtest completed for ${symbol}, saved to trade_history_${symbol}.csv`);
  }
})();
