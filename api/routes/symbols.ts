import { Router, Request, Response } from "express";
import { searchSymbols, getPopularSymbols } from "../controllers/symbolController";

export const symbolRouter = Router();

/**
 * GET /api/symbols/search?q=query
 * 
 * Search for stock symbols by symbol or company name
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
 *         "exchange": "NASDAQ"
 *       }
 *     ],
 *     "query": "aapl"
 *   }
 * }
 */
symbolRouter.get("/search", searchSymbols);

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
