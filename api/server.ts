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
import { authenticateToken } from "./middleware/auth";

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

// Global auth guard for API routes – allow only specific public auth endpoints
app.use("/api", (req, res, next) => {
  // Allow CORS preflight requests
  if (req.method === "OPTIONS") {
    return next();
  }

  // Public auth endpoints (no token required)
  const publicAuthRoutes = [
    { method: "POST", path: "/auth/login" },
    { method: "POST", path: "/auth/signup" },
    { method: "POST", path: "/auth/2fa/verify" },
    { method: "POST", path: "/auth/password/reset/request" },
    { method: "POST", path: "/auth/password/reset/confirm" },
    // Optional: allow logout without token for idempotency
    { method: "POST", path: "/auth/logout" },
  ];

  const isPublic = publicAuthRoutes.some(
    (r) => r.method === req.method && req.path === r.path
  );

  if (isPublic) {
    return next();
  }

  // For all other /api routes, require a valid token
  return authenticateToken(req as any, res as any, next as any);
});


// Routes
console.log("Mounting API routes...");
app.use("/api/auth", authRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/backtest", backtestRouter);
app.use("/api/symbols", symbolRouter);
app.use("/api/cache", cacheRouter);
app.use("/api/trading", tradingRouter);
app.use("/api/strategies", strategyRouter);
app.use("/api/test", testRouter);
console.log("API routes mounted successfully");

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
