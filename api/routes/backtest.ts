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
 *   "provider": "yahoo",    // optional, default: "yahoo" (yahoo, polygon, polygon-flatfiles)
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
 *     "provider": "yahoo",
 *     "config": {
 *       "provider": "yahoo",
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
 * GET /api/backtest/providers
 * 
 * Get list of available data providers
 */
backtestRouter.get("/providers", (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      providers: [
        {
          name: "yahoo",
          displayName: "Yahoo Finance",
          description: "Free historical market data provider",
          cost: "Free",
          rateLimits: "Moderate (suitable for backtesting)",
          dataQuality: "Good for historical data",
          setup: "No API key required",
          environmentVariables: []
        },
        {
          name: "polygon",
          displayName: "Polygon.io REST API",
          description: "Professional market data via REST API",
          cost: "Paid service (free tier available)",
          rateLimits: "Higher limits with paid plans",
          dataQuality: "Professional-grade market data",
          setup: "Requires API key",
          environmentVariables: [
            {
              name: "POLYGON_API_KEY",
              description: "Polygon.io API key",
              required: true
            }
          ]
        },
        {
          name: "polygon-flatfiles",
          displayName: "Polygon.io Flat Files",
          description: "Large historical datasets via S3",
          cost: "Paid service (requires Flat Files subscription)",
          rateLimits: "No API rate limits (S3-based downloads)",
          dataQuality: "Professional-grade historical market data",
          setup: "Requires S3 credentials",
          bestFor: "Large historical datasets, bulk data downloads",
          environmentVariables: [
            {
              name: "POLYGON_AWS_ACCESS_KEY_ID",
              description: "Polygon.io S3 access key",
              required: true
            },
            {
              name: "POLYGON_AWS_SECRET_ACCESS_KEY",
              description: "Polygon.io S3 secret key",
              required: true
            }
          ]
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
