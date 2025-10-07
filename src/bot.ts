import dotenv from "dotenv";
import { PolygonProvider } from "./dataProviders/PolygonProvider";
import { YahooDataProvider } from "./dataProviders/yahooProvider";
import { TradingBot } from "./bot/TradingBot";
import { UserManager } from "./bot/UserManager";
import { defaultTradingConfig } from "./config/tradingConfig";
import { TradingMode } from "./config";
import { DataProvider } from "./dataProviders/baseProvider";
import { StrategyConfig } from "./config/tradingConfig";
import process from "process";

dotenv.config();

/**
 * Creates the appropriate data provider based on configuration
 */
function createDataProvider(): DataProvider {
  const providerType = process.env.DATA_PROVIDER || 'polygon';
  const polygonApiKey = process.env.POLYGON_API_KEY;

  switch (providerType.toLowerCase()) {
    case 'polygon':
      if (!polygonApiKey) {
        throw new Error("POLYGON_API_KEY environment variable is required for Polygon provider");
      }
      console.log('📡 Using Polygon.io data provider');
      return new PolygonProvider(polygonApiKey);
    
    case 'yahoo':
      console.log('📡 Using Yahoo Finance data provider');
      return new YahooDataProvider();
    
    default:
      throw new Error(`Unsupported data provider: ${providerType}. Supported providers: polygon, yahoo`);
  }
}

/**
 * Creates strategy configurations based on strategy type and symbols
 */
function createStrategyConfigs(strategyType: string, symbols: string[]): StrategyConfig[] {
  const strategies: StrategyConfig[] = [];

  switch (strategyType.toLowerCase()) {
    case 'movingaverage':
    case 'ma':
      strategies.push({
        name: 'MovingAverage',
        enabled: true,
        parameters: {
          shortWindow: parseInt(process.env.MA_SHORT_WINDOW || '5'),
          longWindow: parseInt(process.env.MA_LONG_WINDOW || '10')
        },
        symbols
      });
      break;

    case 'meanreversion':
    case 'mr':
      strategies.push({
        name: 'MeanReversion',
        enabled: true,
        parameters: {
          window: parseInt(process.env.MR_WINDOW || '20'),
          threshold: parseFloat(process.env.MR_THRESHOLD || '0.05')
        },
        symbols
      });
      break;

    case 'momentum':
      strategies.push({
        name: 'Momentum',
        enabled: true,
        parameters: {
          rsiWindow: parseInt(process.env.MOMENTUM_RSI_WINDOW || '14'),
          rsiOverbought: parseInt(process.env.MOMENTUM_RSI_OVERBOUGHT || '70'),
          rsiOversold: parseInt(process.env.MOMENTUM_RSI_OVERSOLD || '30'),
          momentumWindow: parseInt(process.env.MOMENTUM_WINDOW || '10'),
          momentumThreshold: parseFloat(process.env.MOMENTUM_THRESHOLD || '0.02')
        },
        symbols
      });
      break;

    case 'bollinger':
    case 'bb':
      strategies.push({
        name: 'BollingerBands',
        enabled: true,
        parameters: {
          window: parseInt(process.env.BB_WINDOW || '20'),
          multiplier: parseFloat(process.env.BB_MULTIPLIER || '2.0')
        },
        symbols
      });
      break;

    case 'sentiment':
    case 'sentimentanalysis':
      strategies.push({
        name: 'SentimentAnalysis',
        enabled: true,
        parameters: {
          lookbackDays: parseInt(process.env.SENTIMENT_LOOKBACK_DAYS || '3'),
          pollIntervalMinutes: parseInt(process.env.SENTIMENT_POLL_MINUTES || '15'),
          minArticles: parseInt(process.env.SENTIMENT_MIN_ARTICLES || '3'),
          buyThreshold: parseFloat(process.env.SENTIMENT_BUY_THRESHOLD || '0.4'),
          sellThreshold: parseFloat(process.env.SENTIMENT_SELL_THRESHOLD || '-0.4'),
          titleWeight: parseFloat(process.env.SENTIMENT_TITLE_WEIGHT || '2.0'),
          recencyHalfLifeHours: parseInt(process.env.SENTIMENT_HALF_LIFE_HOURS || '12'),
          tiingoApiKey: process.env.TIINGO_API_KEY
        },
        symbols
      });
      break;

    default:
      console.warn(`Unknown strategy type: ${strategyType}. Using default MovingAverage strategy.`);
      strategies.push({
        name: 'MovingAverage',
        enabled: true,
        parameters: {
          shortWindow: 5,
          longWindow: 10
        },
        symbols
      });
  }

  return strategies;
}

async function main(): Promise<void> {
  try {
    // Load configuration from environment variables
    const mode = (process.env.TRADING_MODE as any) || TradingMode.PAPER;
    const initialCash = parseFloat(process.env.INITIAL_CASH || "10000");
    const symbols = process.env.SYMBOLS?.split(',') || defaultTradingConfig.symbols;
    const username = process.env.TRADING_USERNAME || "admin";
    const password = process.env.TRADING_PASSWORD || "admin123";
    const strategyType = process.env.STRATEGY_TYPE || "MovingAverage";

    console.log('🤖 Starting Trading Bot...');
    console.log(`📊 Mode: ${mode.toUpperCase()}`);
    console.log(`💰 Initial Cash: $${initialCash.toFixed(2)}`);
    console.log(`📈 Symbols: ${symbols.join(', ')}`);
    console.log(`🎯 Strategy: ${strategyType}`);

    // Authenticate user
    console.log(`🔐 Authenticating user: ${username}`);
    const authResult = await UserManager.authenticateUser(username, password);
    
    if (!authResult.success) {
      throw new Error(`Authentication failed: ${authResult.message}`);
    }

    const user = authResult.user;
    console.log(`✅ Authenticated as: ${user.username} (ID: ${user.id})`);

    // Create data provider
    const provider = createDataProvider();

    // Create trading configuration with enhanced strategy support
    const config = {
      ...defaultTradingConfig,
      mode,
      initialCash,
      symbols,
      strategies: createStrategyConfigs(strategyType, symbols),
      dataProvider: {
        ...defaultTradingConfig.dataProvider,
        type: (process.env.DATA_PROVIDER as 'polygon' | 'yahoo' | 'twelve_data') || 'polygon',
        apiKey: process.env.POLYGON_API_KEY
      }
    };

    // Create and configure trading bot
    const bot = new TradingBot(config, provider, user.id);

    // Set up enhanced event listeners
    bot.on('trade', (trade) => {
      const timestamp = new Date().toLocaleTimeString();
      console.log(`[${timestamp}] 📈 Trade executed: ${trade.action} ${trade.quantity} ${trade.symbol} at $${trade.price.toFixed(2)}`);
      if (trade.pnl !== undefined) {
        const pnlColor = trade.pnl >= 0 ? '🟢' : '🔴';
        console.log(`[${timestamp}] ${pnlColor} P&L: $${trade.pnl.toFixed(2)}`);
      }
    });

    bot.on('portfolio-update', (status) => {
      const timestamp = new Date().toLocaleTimeString();
      const pnl = status.totalValue - initialCash;
      const pnlColor = pnl >= 0 ? '🟢' : '🔴';
      console.log(`[${timestamp}] 💼 Portfolio: $${status.totalValue.toFixed(2)} | Cash: $${status.cash.toFixed(2)} | ${pnlColor} P&L: $${pnl.toFixed(2)}`);
    });

    bot.on('error', (error) => {
      const timestamp = new Date().toLocaleTimeString();
      console.error(`[${timestamp}] ❌ Bot error:`, error.message);
      console.error('Stack trace:', error.stack);
    });

    bot.on('session-started', (session) => {
      const timestamp = new Date().toLocaleTimeString();
      console.log(`[${timestamp}] 🚀 Trading session started: ${session.id}`);
      console.log(`[${timestamp}] 📊 Session mode: ${session.mode.toUpperCase()}`);
      console.log(`[${timestamp}] 💰 Initial cash: $${session.initial_cash.toFixed(2)}`);
    });

    bot.on('session-ended', (session) => {
      const timestamp = new Date().toLocaleTimeString();
      console.log(`[${timestamp}] 🛑 Trading session ended: ${session.id}`);
      console.log(`[${timestamp}] 📊 Final stats: ${session.total_trades} trades, ${session.winning_trades} winners`);
      if (session.total_trades > 0) {
        const winRate = ((session.winning_trades / session.total_trades) * 100).toFixed(1);
        console.log(`[${timestamp}] 🎯 Win rate: ${winRate}%`);
      }
      if (session.total_pnl !== undefined) {
        const pnlColor = session.total_pnl >= 0 ? '🟢' : '🔴';
        console.log(`[${timestamp}] ${pnlColor} Total P&L: $${session.total_pnl.toFixed(2)}`);
      }
    });

    // Start the bot
    await bot.start();

    // Add status monitoring
    const statusInterval = setInterval(() => {
      const status = bot.getStatus();
      const timestamp = new Date().toLocaleTimeString();
      console.log(`[${timestamp}] 📊 Status: Running | Trades: ${status.totalTrades} | P&L: $${status.totalPnL.toFixed(2)}`);
    }, 60000); // Every minute

    // Handle graceful shutdown
    const shutdown = async () => {
      console.log('\n🛑 Shutting down trading bot...');
      clearInterval(statusInterval);
      await bot.stop();
      console.log('✅ Trading bot stopped successfully');
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

    // Keep the process running
    console.log('🤖 Trading bot is running. Press Ctrl+C to stop.');
    console.log('📊 Status updates every minute');

  } catch (error) {
    console.error('❌ Failed to start trading bot:', error);
    process.exit(1);
  }
}

// Start the application
main().catch(console.error);