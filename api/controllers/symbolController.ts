import { Request, Response } from "express";
import yahooFinance from 'yahoo-finance2';

// Popular stock symbols with their names
const POPULAR_SYMBOLS = [
  { symbol: "AAPL", name: "Apple Inc.", exchange: "NASDAQ" },
  { symbol: "MSFT", name: "Microsoft Corporation", exchange: "NASDAQ" },
  { symbol: "GOOGL", name: "Alphabet Inc. Class A", exchange: "NASDAQ" },
  { symbol: "AMZN", name: "Amazon.com Inc.", exchange: "NASDAQ" },
  { symbol: "TSLA", name: "Tesla Inc.", exchange: "NASDAQ" },
  { symbol: "META", name: "Meta Platforms Inc.", exchange: "NASDAQ" },
  { symbol: "NVDA", name: "NVIDIA Corporation", exchange: "NASDAQ" },
  { symbol: "NFLX", name: "Netflix Inc.", exchange: "NASDAQ" },
  { symbol: "AMD", name: "Advanced Micro Devices Inc.", exchange: "NASDAQ" },
  { symbol: "INTC", name: "Intel Corporation", exchange: "NASDAQ" },
  { symbol: "CRM", name: "Salesforce Inc.", exchange: "NYSE" },
  { symbol: "ADBE", name: "Adobe Inc.", exchange: "NASDAQ" },
  { symbol: "PYPL", name: "PayPal Holdings Inc.", exchange: "NASDAQ" },
  { symbol: "UBER", name: "Uber Technologies Inc.", exchange: "NYSE" },
  { symbol: "LYFT", name: "Lyft Inc.", exchange: "NASDAQ" },
  { symbol: "SPOT", name: "Spotify Technology S.A.", exchange: "NYSE" },
  { symbol: "SQ", name: "Block Inc.", exchange: "NYSE" },
  { symbol: "ROKU", name: "Roku Inc.", exchange: "NASDAQ" },
  { symbol: "ZM", name: "Zoom Video Communications Inc.", exchange: "NASDAQ" },
  { symbol: "DOCU", name: "DocuSign Inc.", exchange: "NASDAQ" },
  { symbol: "OKTA", name: "Okta Inc.", exchange: "NASDAQ" },
  { symbol: "CRWD", name: "CrowdStrike Holdings Inc.", exchange: "NASDAQ" },
  { symbol: "SNOW", name: "Snowflake Inc.", exchange: "NYSE" },
  { symbol: "PLTR", name: "Palantir Technologies Inc.", exchange: "NYSE" },
  { symbol: "COIN", name: "Coinbase Global Inc.", exchange: "NASDAQ" },
  { symbol: "RBLX", name: "Roblox Corporation", exchange: "NYSE" },
  { symbol: "DDOG", name: "Datadog Inc.", exchange: "NASDAQ" },
  { symbol: "NET", name: "Cloudflare Inc.", exchange: "NYSE" },
  { symbol: "TWLO", name: "Twilio Inc.", exchange: "NYSE" },
  { symbol: "SHOP", name: "Shopify Inc.", exchange: "NYSE" },
  { symbol: "SQ", name: "Square Inc.", exchange: "NYSE" },
  { symbol: "PINS", name: "Pinterest Inc.", exchange: "NYSE" },
  { symbol: "SNAP", name: "Snap Inc.", exchange: "NYSE" },
  { symbol: "TWTR", name: "Twitter Inc.", exchange: "NYSE" },
  { symbol: "DIS", name: "The Walt Disney Company", exchange: "NYSE" },
  { symbol: "NKE", name: "Nike Inc.", exchange: "NYSE" },
  { symbol: "WMT", name: "Walmart Inc.", exchange: "NYSE" },
  { symbol: "JPM", name: "JPMorgan Chase & Co.", exchange: "NYSE" },
  { symbol: "BAC", name: "Bank of America Corporation", exchange: "NYSE" },
  { symbol: "GS", name: "The Goldman Sachs Group Inc.", exchange: "NYSE" },
  { symbol: "V", name: "Visa Inc.", exchange: "NYSE" },
  { symbol: "MA", name: "Mastercard Incorporated", exchange: "NYSE" },
  { symbol: "JNJ", name: "Johnson & Johnson", exchange: "NYSE" },
  { symbol: "PFE", name: "Pfizer Inc.", exchange: "NYSE" },
  { symbol: "UNH", name: "UnitedHealth Group Incorporated", exchange: "NYSE" },
  { symbol: "HD", name: "The Home Depot Inc.", exchange: "NYSE" },
  { symbol: "PG", name: "The Procter & Gamble Company", exchange: "NYSE" },
  { symbol: "KO", name: "The Coca-Cola Company", exchange: "NYSE" },
  { symbol: "PEP", name: "PepsiCo Inc.", exchange: "NASDAQ" },
  { symbol: "ABBV", name: "AbbVie Inc.", exchange: "NYSE" },
  { symbol: "TMO", name: "Thermo Fisher Scientific Inc.", exchange: "NYSE" },
  { symbol: "AVGO", name: "Broadcom Inc.", exchange: "NASDAQ" },
  { symbol: "QCOM", name: "QUALCOMM Incorporated", exchange: "NASDAQ" },
  { symbol: "TXN", name: "Texas Instruments Incorporated", exchange: "NASDAQ" },
  { symbol: "ORCL", name: "Oracle Corporation", exchange: "NYSE" },
  { symbol: "IBM", name: "International Business Machines Corporation", exchange: "NYSE" },
  { symbol: "CSCO", name: "Cisco Systems Inc.", exchange: "NASDAQ" },
  { symbol: "ACN", name: "Accenture plc", exchange: "NYSE" },
  { symbol: "CRM", name: "Salesforce Inc.", exchange: "NYSE" },
  { symbol: "ADBE", name: "Adobe Inc.", exchange: "NASDAQ" },
  { symbol: "INTU", name: "Intuit Inc.", exchange: "NASDAQ" },
  { symbol: "NOW", name: "ServiceNow Inc.", exchange: "NYSE" },
  { symbol: "WDAY", name: "Workday Inc.", exchange: "NASDAQ" },
  { symbol: "TEAM", name: "Atlassian Corporation Plc", exchange: "NASDAQ" },
  { symbol: "ZM", name: "Zoom Video Communications Inc.", exchange: "NASDAQ" },
  { symbol: "DOCU", name: "DocuSign Inc.", exchange: "NASDAQ" },
  { symbol: "OKTA", name: "Okta Inc.", exchange: "NASDAQ" },
  { symbol: "CRWD", name: "CrowdStrike Holdings Inc.", exchange: "NASDAQ" },
  { symbol: "SNOW", name: "Snowflake Inc.", exchange: "NYSE" },
  { symbol: "PLTR", name: "Palantir Technologies Inc.", exchange: "NYSE" },
  { symbol: "COIN", name: "Coinbase Global Inc.", exchange: "NASDAQ" },
  { symbol: "RBLX", name: "Roblox Corporation", exchange: "NYSE" },
  { symbol: "DDOG", name: "Datadog Inc.", exchange: "NASDAQ" },
  { symbol: "NET", name: "Cloudflare Inc.", exchange: "NYSE" },
  { symbol: "TWLO", name: "Twilio Inc.", exchange: "NYSE" },
  { symbol: "SHOP", name: "Shopify Inc.", exchange: "NYSE" },
  { symbol: "PINS", name: "Pinterest Inc.", exchange: "NYSE" },
  { symbol: "SNAP", name: "Snap Inc.", exchange: "NYSE" },
  { symbol: "DIS", name: "The Walt Disney Company", exchange: "NYSE" },
  { symbol: "NKE", name: "Nike Inc.", exchange: "NYSE" },
  { symbol: "WMT", name: "Walmart Inc.", exchange: "NYSE" },
  { symbol: "JPM", name: "JPMorgan Chase & Co.", exchange: "NYSE" },
  { symbol: "BAC", name: "Bank of America Corporation", exchange: "NYSE" },
  { symbol: "GS", name: "The Goldman Sachs Group Inc.", exchange: "NYSE" },
  { symbol: "V", name: "Visa Inc.", exchange: "NYSE" },
  { symbol: "MA", name: "Mastercard Incorporated", exchange: "NYSE" },
  { symbol: "JNJ", name: "Johnson & Johnson", exchange: "NYSE" },
  { symbol: "PFE", name: "Pfizer Inc.", exchange: "NYSE" },
  { symbol: "UNH", name: "UnitedHealth Group Incorporated", exchange: "NYSE" },
  { symbol: "HD", name: "The Home Depot Inc.", exchange: "NYSE" },
  { symbol: "PG", name: "The Procter & Gamble Company", exchange: "NYSE" },
  { symbol: "KO", name: "The Coca-Cola Company", exchange: "NYSE" },
  { symbol: "PEP", name: "PepsiCo Inc.", exchange: "NASDAQ" },
  { symbol: "ABBV", name: "AbbVie Inc.", exchange: "NYSE" },
  { symbol: "TMO", name: "Thermo Fisher Scientific Inc.", exchange: "NYSE" },
  { symbol: "AVGO", name: "Broadcom Inc.", exchange: "NASDAQ" },
  { symbol: "QCOM", name: "QUALCOMM Incorporated", exchange: "NASDAQ" },
  { symbol: "TXN", name: "Texas Instruments Incorporated", exchange: "NASDAQ" },
  { symbol: "ORCL", name: "Oracle Corporation", exchange: "NYSE" },
  { symbol: "IBM", name: "International Business Machines Corporation", exchange: "NYSE" },
  { symbol: "CSCO", name: "Cisco Systems Inc.", exchange: "NASDAQ" },
  { symbol: "ACN", name: "Accenture plc", exchange: "NYSE" },
  { symbol: "INTU", name: "Intuit Inc.", exchange: "NASDAQ" },
  { symbol: "NOW", name: "ServiceNow Inc.", exchange: "NYSE" },
  { symbol: "WDAY", name: "Workday Inc.", exchange: "NASDAQ" },
  { symbol: "TEAM", name: "Atlassian Corporation Plc", exchange: "NASDAQ" }
];

export const searchSymbols = async (req: Request, res: Response) => {
  try {
    const { q, useYahoo = 'true' } = req.query;
    
    if (!q || typeof q !== 'string') {
      return res.status(400).json({
        success: false,
        error: "Query parameter 'q' is required"
      });
    }

    const query = q.toLowerCase().trim();
    
    if (query.length < 1) {
      return res.json({
        success: true,
        data: {
          symbols: POPULAR_SYMBOLS.slice(0, 20) // Return top 20 if no query
        }
      });
    }

    // Use Yahoo Finance search if requested (default behavior)
    if (useYahoo === 'true') {
      try {
        const yahooResults = await searchWithYahooFinance(query);
        return res.json({
          success: true,
          data: {
            symbols: yahooResults,
            query: q,
            source: 'yahoo-finance'
          }
        });
      } catch (yahooError) {
        console.warn("Yahoo Finance search failed, falling back to static list:", yahooError);
        // Fall back to static search if Yahoo Finance fails
      }
    }

    // Fallback to static search
    const filteredSymbols = POPULAR_SYMBOLS.filter(symbol => 
      symbol.symbol.toLowerCase().includes(query) ||
      symbol.name.toLowerCase().includes(query)
    ).slice(0, 20); // Limit to 20 results

    res.json({
      success: true,
      data: {
        symbols: filteredSymbols,
        query: q,
        source: 'static'
      }
    });

  } catch (error) {
    console.error("Symbol search error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error during symbol search"
    });
  }
};

// New function to search using Yahoo Finance
const searchWithYahooFinance = async (query: string) => {
  try {
    const searchResults = await yahooFinance.search(query, {
      quotesCount: 20,
      newsCount: 0
    });

    // Transform Yahoo Finance results to match our expected format
    const symbols = searchResults.quotes
      .filter(quote => {
        // Only include results that have the required properties for stock quotes
        return 'symbol' in quote && 'longname' in quote && quote.symbol && quote.longname;
      })
      .map(quote => {
        // Type assertion since we've filtered for the correct type
        const stockQuote = quote as any;
        return {
          symbol: stockQuote.symbol,
          name: stockQuote.longname || stockQuote.shortname || stockQuote.symbol,
          exchange: stockQuote.exchange || 'Unknown',
          type: stockQuote.type || 'EQUITY',
          market: stockQuote.market || 'Unknown'
        };
      })
      .slice(0, 20); // Limit to 20 results

    return symbols;
  } catch (error) {
    console.error("Yahoo Finance search error:", error);
    throw error;
  }
};

export const getPopularSymbols = (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      data: {
        symbols: POPULAR_SYMBOLS.slice(0, 50) // Return top 50 popular symbols
      }
    });
  } catch (error) {
    console.error("Get popular symbols error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
};

// New dedicated Yahoo Finance search endpoint
export const searchWithYahoo = async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    
    if (!q || typeof q !== 'string') {
      return res.status(400).json({
        success: false,
        error: "Query parameter 'q' is required"
      });
    }

    const query = q.toLowerCase().trim();
    
    if (query.length < 1) {
      return res.status(400).json({
        success: false,
        error: "Query parameter 'q' cannot be empty"
      });
    }

    const yahooResults = await searchWithYahooFinance(query);
    
    res.json({
      success: true,
      data: {
        symbols: yahooResults,
        query: q,
        source: 'yahoo-finance',
        count: yahooResults.length
      }
    });

  } catch (error) {
    console.error("Yahoo Finance search error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to search with Yahoo Finance. Please try again later."
    });
  }
};
