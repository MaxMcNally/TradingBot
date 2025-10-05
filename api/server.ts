import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";

import {authRouter} from "./routes/auth";
import {settingsRouter} from "./routes/settings";
import {backtestRouter} from "./routes/backtest";
import {symbolRouter} from "./routes/symbols";
import {cacheRouter} from "./routes/cache";
import tradingRouter from "./routes/trading";
import { initDatabase } from "./initDb";
import { sessionMonitor } from "./services/sessionMonitor";
import testRouter from "./routes/test";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8001;
// ✅ Enable CORS properly
app.use(
  cors({
    origin: [
      "http://localhost:5173", // Vite dev server
      "http://localhost:5174", // Vite dev server (alternate port)
      "http://127.0.0.1:5173", // Alternate local URL
      "http://127.0.0.1:5174", // Alternate local URL (alternate port)
      process.env.FRONTEND_URL as  string, // Optional for deployed frontend
    ],
    credentials: true, // Allow cookies and auth headers
  })
);

app.use(bodyParser.json());
// Routes
app.use("/api/auth", authRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/backtest", backtestRouter);
app.use("/api/symbols", symbolRouter);
app.use("/api/cache", cacheRouter);
app.use("/api/trading", tradingRouter);
app.use("/api/test", testRouter);
app.get("/ping", (req, res) => {
  console.log("Ping route hit ✅");
  res.json({ status: "ok" });
});
// Initialize database and start server
initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      
      // Start the session monitor
      sessionMonitor.start();
    });
  })
  .catch((error) => {
    console.error("Failed to initialize database:", error);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully...');
  sessionMonitor.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  sessionMonitor.stop();
  process.exit(0);
});
