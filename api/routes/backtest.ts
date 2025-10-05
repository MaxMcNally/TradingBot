import { Router, Request, Response } from "express";
import { runBacktest } from "../controllers/backtestController";

export const backtestRouter = Router();

/**
 * POST /api/backtest/run
 * 
 * Run a backtest with the specified parameters
 * 
 * Request body:
 * {
 *   "strategy": "meanReversion",
 *   "symbols": ["AAPL", "TSLA"] or "AAPL",
 *   "startDate": "2023-01-01",
 *   "endDate": "2023-12-31",
 *   "window": 20,           // optional, default: 20
 *   "threshold": 0.05,      // optional, default: 0.05
 *   "initialCapital": 10000, // optional, default: 10000
 *   "sharesPerTrade": 100   // optional, default: 100
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "strategy": "meanReversion",
 *     "symbols": ["AAPL", "TSLA"],
 *     "startDate": "2023-01-01",
 *     "endDate": "2023-12-31",
 *     "config": {
 *       "window": 20,
 *       "threshold": 0.05,
 *       "initialCapital": 10000,
 *       "sharesPerTrade": 100
 *     },
 *     "results": [
 *       {
 *         "symbol": "AAPL",
 *         "trades": [...],
 *         "finalPortfolioValue": 10500,
 *         "totalReturn": 0.05,
 *         "winRate": 0.6,
 *         "maxDrawdown": 0.1
 *       }
 *     ]
 *   }
 * }
 */
backtestRouter.post("/run", runBacktest);

/**
 * GET /api/backtest/strategies
 * 
 * Get list of available strategies
 */
backtestRouter.get("/strategies", (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      strategies: [
        {
          name: "meanReversion",
          description: "Mean Reversion Strategy - Buy when price is below moving average by threshold, sell when above",
          parameters: {
            window: {
              type: "number",
              description: "Moving average window in days",
              default: 20,
              min: 5,
              max: 200
            },
            threshold: {
              type: "number",
              description: "Percentage threshold for buy/sell signals (0.05 = 5%)",
              default: 0.05,
              min: 0.01,
              max: 0.2
            },
            initialCapital: {
              type: "number",
              description: "Starting capital amount",
              default: 10000,
              min: 1000
            },
            sharesPerTrade: {
              type: "number",
              description: "Maximum shares per trade",
              default: 100,
              min: 1
            }
          }
        }
      ]
    }
  });
});

/**
 * GET /api/backtest/health
 * 
 * Health check for backtest service
 */
backtestRouter.get("/health", (req: Request, res: Response) => {
  res.json({
    success: true,
    message: "Backtest service is healthy",
    timestamp: new Date().toISOString()
  });
});
