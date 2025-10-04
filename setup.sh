#!/bin/bash

# Ensure we are inside the project root
mkdir -p src/dataProviders
mkdir -p src/strategies

# Create baseProvider.js
cat > src/dataProviders/baseProvider.js <<'EOF'
export class DataProvider {
  async getQuote(symbol) {
    throw new Error("getQuote() must be implemented");
  }

  async getHistorical(symbol, interval = "day", from, to) {
    throw new Error("getHistorical() must be implemented");
  }

  connectStream(symbols, onData) {
    throw new Error("connectStream() must be implemented");
  }
}
EOF

# Create polygonProvider.js
cat > src/dataProviders/polygonProvider.js <<'EOF'
import fetch from "node-fetch";
import WebSocket from "ws";
import { DataProvider } from "./baseProvider.js";

const BASE_URL = "https://api.polygon.io";

export class PolygonProvider extends DataProvider {
  constructor(apiKey) {
    super();
    this.apiKey = apiKey;
  }

  async getQuote(symbol) {
    const url = `${BASE_URL}/v2/last/trade/${symbol}?apiKey=${this.apiKey}`;
    const res = await fetch(url);
    const data = await res.json();
    return {
      symbol,
      price: data?.results?.p ?? null,
      timestamp: data?.results?.t ?? null,
    };
  }

  async getHistorical(symbol, interval = "day", from, to) {
    const url = `${BASE_URL}/v2/aggs/ticker/${symbol}/range/1/${interval}/${from}/${to}?apiKey=${this.apiKey}`;
    const res = await fetch(url);
    const data = await res.json();
    return data.results || [];
  }

  connectStream(symbols, onData) {
    const ws = new WebSocket(`wss://socket.polygon.io/stocks`);
    ws.on("open", () => {
      ws.send(JSON.stringify({ action: "auth", params: this.apiKey }));
      ws.send(
        JSON.stringify({
          action: "subscribe",
          params: symbols.map((s) => `T.${s}`).join(","),
        })
      );
    });
    ws.on("message", (msg) => {
      const data = JSON.parse(msg);
      onData(data);
    });
    ws.on("error", (err) => console.error("WS error:", err));
    return ws;
  }
}
EOF

# Create movingAverage.js
cat > src/strategies/movingAverage.js <<'EOF'
export class MovingAverageStrategy {
  constructor(shortWindow = 5, longWindow = 10) {
    this.shortWindow = shortWindow;
    this.longWindow = longWindow;
    this.prices = [];
  }

  addPrice(price) {
    this.prices.push(price);
    if (this.prices.length > this.longWindow) {
      this.prices.shift();
    }
  }

  getSignal() {
    if (this.prices.length < this.longWindow) return null;

    const shortMA = avg(this.prices.slice(-this.shortWindow));
    const longMA = avg(this.prices);

    if (shortMA > longMA) return "BUY";
    if (shortMA < longMA) return "SELL";
    return null;
  }
}

function avg(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}
EOF

# Create portfolio.js
cat > src/portfolio.js <<'EOF'
export class Portfolio {
  constructor(initialCash = 10000) {
    this.cash = initialCash;
    this.position = 0;
  }

  buy(price) {
    if (this.cash >= price) {
      this.position += 1;
      this.cash -= price;
      console.log(`Bought 1 share at $${price}`);
    }
  }

  sell(price) {
    if (this.position > 0) {
      this.position -= 1;
      this.cash += price;
      console.log(`Sold 1 share at $${price}`);
    }
  }

  status(price) {
    const value = this.cash + this.position * price;
    return {
      cash: this.cash,
      position: this.position,
      totalValue: value,
    };
  }
}
EOF

# Create bot.js
cat > src/bot.js <<'EOF'
import dotenv from "dotenv";
import { PolygonProvider } from "./dataProviders/polygonProvider.js";
import { MovingAverageStrategy } from "./strategies/movingAverage.js";
import { Portfolio } from "./portfolio.js";

dotenv.config();

const provider = new PolygonProvider(process.env.POLYGON_API_KEY);
const strategy = new MovingAverageStrategy(5, 10);
const portfolio = new Portfolio(10000);

async function run() {
  const quote = await provider.getQuote("AAPL");
  console.log("Latest Quote:", quote);

  provider.connectStream(["AAPL"], (data) => {
    const trade = data.find((d) => d.ev === "T");
    if (!trade) return;

    const price = trade.p;
    strategy.addPrice(price);

    const signal = strategy.getSignal();
    if (signal === "BUY") portfolio.buy(price);
    if (signal === "SELL") portfolio.sell(price);

    const status = portfolio.status(price);
    console.log(
      `Price: $${price.toFixed(2)} | Signal: ${signal ?? "HOLD"} | Cash: ${status.cash.toFixed(
        2
      )} | Position: ${status.position} | Value: ${status.totalValue.toFixed(2)}`
    );
  });
}

run();


echo "✅ Project structure created under ./src"
