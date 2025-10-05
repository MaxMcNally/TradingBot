import { Request, Response } from "express";
import { spawn } from "child_process";
import path from "path";

export interface BacktestRequest {
  strategy: string;
  symbols: string | string[];
  startDate: string;
  endDate: string;
  window?: number;
  threshold?: number;
  initialCapital?: number;
  sharesPerTrade?: number;
}

export interface BacktestResponse {
  success: boolean;
  data?: any;
  error?: string;
  results?: {
    symbol: string;
    trades: any[];
    finalPortfolioValue: number;
    totalReturn: number;
    winRate: number;
    maxDrawdown: number;
  }[];
}

export const runBacktest = async (req: Request, res: Response) => {
  try {
    const {
      strategy,
      symbols,
      startDate,
      endDate,
      window = 20,
      threshold = 0.05,
      initialCapital = 10000,
      sharesPerTrade = 100
    }: BacktestRequest = req.body;

    // Validate required fields
    if (!strategy || !symbols || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: strategy, symbols, startDate, endDate"
      });
    }

    // Validate strategy
    const validStrategies = ['meanReversion'];
    if (!validStrategies.includes(strategy)) {
      return res.status(400).json({
        success: false,
        error: `Invalid strategy. Valid strategies: ${validStrategies.join(', ')}`
      });
    }

    // Convert symbols to array if it's a string
    const symbolArray = Array.isArray(symbols) ? symbols : [symbols];

    // Validate date format (basic validation)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      return res.status(400).json({
        success: false,
        error: "Invalid date format. Use YYYY-MM-DD format"
      });
    }

    // Validate date range
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start >= end) {
      return res.status(400).json({
        success: false,
        error: "Start date must be before end date"
      });
    }

    // Run backtests for each symbol
    const results = [];
    
    for (const symbol of symbolArray) {
      try {
        const result = await runSingleBacktest({
          symbol,
          startDate,
          endDate,
          window,
          threshold,
          initialCapital,
          sharesPerTrade
        });
        
        results.push({
          symbol,
          ...result
        });
        } catch (error) {
          console.error(`Error running backtest for ${symbol}:`, error);
          const errorMessage = error instanceof Error ? error.message : String(error);
          results.push({
            symbol,
            error: `Failed to run backtest for ${symbol}: ${errorMessage}`
          });
        }
    }

    res.json({
      success: true,
      data: {
        strategy,
        symbols: symbolArray,
        startDate,
        endDate,
        config: {
          window,
          threshold,
          initialCapital,
          sharesPerTrade
        },
        results
      }
    });

  } catch (error) {
    console.error("Backtest API error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error during backtest execution"
    });
  }
};

const runSingleBacktest = async (params: {
  symbol: string;
  startDate: string;
  endDate: string;
  window: number;
  threshold: number;
  initialCapital: number;
  sharesPerTrade: number;
}): Promise<any> => {
  return new Promise((resolve, reject) => {
    const { symbol, startDate, endDate, window, threshold, initialCapital, sharesPerTrade } = params;
    
    // Path to the backtest script
    const backtestScript = path.join(__dirname, '../../src/backtest.ts');
    
    // Build the command arguments
    const args = [
      '--symbol', symbol,
      '--start', startDate,
      '--end', endDate,
      '--window', window.toString(),
      '--threshold', threshold.toString(),
      '--capital', initialCapital.toString(),
      '--shares', sharesPerTrade.toString()
    ];

    console.log(`Running backtest: npx ts-node ${backtestScript} ${args.join(' ')}`);

    // Spawn the backtest process
    const child = spawn('npx', ['ts-node', backtestScript, ...args], {
      cwd: path.join(__dirname, '../..'),
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        try {
          // Parse the JSON output from the backtest script
          const lines = stdout.split('\n');
          const jsonLine = lines.find(line => line.trim().startsWith('{'));
          
          if (jsonLine) {
            const result = JSON.parse(jsonLine);
            resolve(result);
          } else {
            // If no JSON found, try to extract key metrics from the output
            const result = parseBacktestOutput(stdout);
            resolve(result);
          }
        } catch (parseError) {
          console.error('Error parsing backtest output:', parseError);
          console.error('Raw output:', stdout);
          reject(new Error('Failed to parse backtest results'));
        }
      } else {
        console.error(`Backtest process exited with code ${code}`);
        console.error('stderr:', stderr);
        reject(new Error(`Backtest failed with exit code ${code}: ${stderr}`));
      }
    });

    child.on('error', (error) => {
      console.error('Error spawning backtest process:', error);
      reject(new Error(`Failed to start backtest process: ${error.message}`));
    });
  });
};

const parseBacktestOutput = (output: string): any => {
  // Extract key metrics from the console output
  const lines = output.split('\n');
  
  const result: any = {
    trades: [],
    finalPortfolioValue: 0,
    totalReturn: 0,
    winRate: 0,
    maxDrawdown: 0
  };

  for (const line of lines) {
    if (line.includes('Final Portfolio Value:')) {
      const match = line.match(/\$([\d,]+\.?\d*)/);
      if (match) {
        result.finalPortfolioValue = parseFloat(match[1].replace(/,/g, ''));
      }
    }
    
    if (line.includes('Total Return:')) {
      const match = line.match(/([\d.-]+)%/);
      if (match) {
        result.totalReturn = parseFloat(match[1]) / 100;
      }
    }
    
    if (line.includes('Win Rate:')) {
      const match = line.match(/([\d.-]+)%/);
      if (match) {
        result.winRate = parseFloat(match[1]) / 100;
      }
    }
    
    if (line.includes('Max Drawdown:')) {
      const match = line.match(/([\d.-]+)%/);
      if (match) {
        result.maxDrawdown = parseFloat(match[1]) / 100;
      }
    }
    
    if (line.includes('Total Trades:')) {
      const match = line.match(/Total Trades: (\d+)/);
      if (match) {
        result.totalTrades = parseInt(match[1]);
      }
    }
  }

  return result;
};
