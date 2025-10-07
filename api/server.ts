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
import {strategyRouter} from "./routes/strategies";
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
      "https://client-qa-qa.up.railway.app", // Railway QA client
      "https://client-production-2ded.up.railway.app", // Railway production client
      process.env.FRONTEND_URL as string, // Optional for deployed frontend
    ],
    credentials: true, // Allow cookies and auth headers
  })
);

app.use(bodyParser.json());


// Routes
console.log("Mounting API routes...");
try {
  console.log("Mounting auth router...");
  app.use("/api/auth", authRouter);
  console.log("Mounting settings router...");
  app.use("/api/settings", settingsRouter);
  console.log("Mounting backtest router...");
  app.use("/api/backtest", backtestRouter);
  console.log("Mounting symbols router...");
  app.use("/api/symbols", symbolRouter);
  console.log("Mounting cache router...");
  app.use("/api/cache", cacheRouter);
  console.log("Mounting trading router...");
  app.use("/api/trading", tradingRouter);
  console.log("Mounting strategies router...");
  app.use("/api/strategies", strategyRouter);
  console.log("Mounting test router...");
  app.use("/api/test", testRouter);
  console.log("API routes mounted successfully");
} catch (error) {
  console.error("Error mounting routes:", error);
}

app.get("/ping", (req, res) => {
  console.log("Ping route hit ✅");
  res.json({ status: "ok" });
});

app.get("/", (req, res) => {
  console.log("Root route hit ✅");
  res.json({ status: "ok", message: "API server is running" });
});

app.get("/api", (req, res) => {
  console.log("API root route hit ✅");
  res.json({ status: "ok", message: "API routes are available" });
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
