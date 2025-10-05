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
          category: "Mean Reversion",
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
        },
        {
          name: "movingAverageCrossover",
          description: "Moving Average Crossover Strategy - Buy when fast MA crosses above slow MA, sell when below",
          category: "Trend Following",
          parameters: {
            fastWindow: {
              type: "number",
              description: "Fast moving average window in days",
              default: 10,
              min: 5,
              max: 50
            },
            slowWindow: {
              type: "number",
              description: "Slow moving average window in days",
              default: 30,
              min: 10,
              max: 200
            },
            maType: {
              type: "select",
              description: "Type of moving average",
              default: "SMA",
              options: ["SMA", "EMA"]
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
        },
        {
          name: "momentum",
          description: "Momentum Strategy - Uses RSI and price momentum for overbought/oversold signals",
          category: "Momentum",
          parameters: {
            rsiWindow: {
              type: "number",
              description: "RSI calculation window in days",
              default: 14,
              min: 5,
              max: 50
            },
            rsiOverbought: {
              type: "number",
              description: "RSI overbought threshold",
              default: 70,
              min: 60,
              max: 90
            },
            rsiOversold: {
              type: "number",
              description: "RSI oversold threshold",
              default: 30,
              min: 10,
              max: 40
            },
            momentumWindow: {
              type: "number",
              description: "Price momentum calculation window in days",
              default: 10,
              min: 5,
              max: 30
            },
            momentumThreshold: {
              type: "number",
              description: "Minimum momentum percentage (0.02 = 2%)",
              default: 0.02,
              min: 0.01,
              max: 0.1
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
        },
        {
          name: "bollingerBands",
          description: "Bollinger Bands Strategy - Buy when price touches lower band, sell when touches upper band",
          category: "Mean Reversion",
          parameters: {
            window: {
              type: "number",
              description: "Moving average window in days",
              default: 20,
              min: 5,
              max: 50
            },
            multiplier: {
              type: "number",
              description: "Standard deviation multiplier",
              default: 2.0,
              min: 1.0,
              max: 3.0
            },
            maType: {
              type: "select",
              description: "Type of moving average",
              default: "SMA",
              options: ["SMA", "EMA"]
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
        },
        {
          name: "breakout",
          description: "Breakout Strategy - Identifies support/resistance levels and trades breakouts",
          category: "Breakout",
          parameters: {
            lookbackWindow: {
              type: "number",
              description: "Window to identify support/resistance levels in days",
              default: 20,
              min: 10,
              max: 100
            },
            breakoutThreshold: {
              type: "number",
              description: "Minimum percentage move to confirm breakout (0.01 = 1%)",
              default: 0.01,
              min: 0.005,
              max: 0.05
            },
            minVolumeRatio: {
              type: "number",
              description: "Minimum volume ratio vs average (1.5 = 50% above average)",
              default: 1.5,
              min: 1.0,
              max: 3.0
            },
            confirmationPeriod: {
              type: "number",
              description: "Days to hold position after breakout",
              default: 2,
              min: 1,
              max: 10
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
