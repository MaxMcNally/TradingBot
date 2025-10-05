import { Router, Request, Response } from "express";
import { searchSymbols, getPopularSymbols, searchWithYahoo } from "../controllers/symbolController";

export const symbolRouter = Router();

/**
 * GET /api/symbols/search?q=query&useYahoo=true
 * 
 * Search for stock symbols by symbol or company name
 * Uses Yahoo Finance by default, falls back to static list if Yahoo Finance fails
 * 
 * Query parameters:
 * - q: Search query (required)
 * - useYahoo: Use Yahoo Finance search (optional, default: true)
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "symbols": [
 *       {
 *         "symbol": "AAPL",
 *         "name": "Apple Inc.",
 *         "exchange": "NASDAQ",
 *         "type": "EQUITY",
 *         "market": "us_market"
 *       }
 *     ],
 *     "query": "aapl",
 *     "source": "yahoo-finance"
 *   }
 * }
 */
symbolRouter.get("/search", searchSymbols);

/**
 * GET /api/symbols/yahoo-search?q=query
 * 
 * Search for stock symbols using Yahoo Finance API exclusively
 * 
 * Query parameters:
 * - q: Search query (required)
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "symbols": [
 *       {
 *         "symbol": "AAPL",
 *         "name": "Apple Inc.",
 *         "exchange": "NASDAQ",
 *         "type": "EQUITY",
 *         "market": "us_market"
 *       }
 *     ],
 *     "query": "aapl",
 *     "source": "yahoo-finance",
 *     "count": 1
 *   }
 * }
 */
symbolRouter.get("/yahoo-search", searchWithYahoo);

/**
 * GET /api/symbols/popular
 * 
 * Get list of popular stock symbols
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "symbols": [
 *       {
 *         "symbol": "AAPL",
 *         "name": "Apple Inc.",
 *         "exchange": "NASDAQ"
 *       }
 *     ]
 *   }
 * }
 */
symbolRouter.get("/popular", getPopularSymbols);
