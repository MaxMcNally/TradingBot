import dotenv from "dotenv";
import { PolygonProvider } from "./dataProviders/PolygonProvider";
import { TradingBot } from "./bot/TradingBot";
import { UserManager } from "./bot/UserManager";
import { defaultTradingConfig } from "./config/tradingConfig";
import { TradingMode } from "./config";
import process from "process";

dotenv.config();

async function main(): Promise<void> {
  try {
    // Load configuration from environment variables
    const mode = (process.env.TRADING_MODE as any) || TradingMode.PAPER;
    const initialCash = parseFloat(process.env.INITIAL_CASH || "10000");
    const symbols = process.env.SYMBOLS?.split(',') || defaultTradingConfig.symbols;
    const polygonApiKey = process.env.POLYGON_API_KEY;
    const username = process.env.TRADING_USERNAME || "admin";
    const password = process.env.TRADING_PASSWORD || "admin123";

    if (!polygonApiKey) {
      throw new Error("POLYGON_API_KEY environment variable is required");
    }

    // Authenticate user
    console.log(`🔐 Authenticating user: ${username}`);
    const authResult = await UserManager.authenticateUser(username, password);
    
    if (!authResult.success) {
      throw new Error(`Authentication failed: ${authResult.message}`);
    }

    const user = authResult.user;
    console.log(`✅ Authenticated as: ${user.username} (ID: ${user.id})`);

    // Create data provider
    const provider = new PolygonProvider(polygonApiKey);

    // Create trading configuration
    const config = {
      ...defaultTradingConfig,
      mode,
      initialCash,
      symbols,
      dataProvider: {
        ...defaultTradingConfig.dataProvider,
        apiKey: polygonApiKey
      }
    };

    // Create and configure trading bot
    const bot = new TradingBot(config, provider, user.id);

    // Set up event listeners
    bot.on('trade', (trade) => {
      console.log(`📈 Trade executed: ${trade.action} ${trade.quantity} ${trade.symbol} at $${trade.price.toFixed(2)}`);
    });

    bot.on('portfolio-update', (status) => {
      console.log(`💼 Portfolio Update: $${status.totalValue.toFixed(2)} (${status.mode} mode)`);
    });

    bot.on('error', (error) => {
      console.error('❌ Bot error:', error.message);
    });

    bot.on('session-started', (session) => {
      console.log(`🚀 Trading session started: ${session.id}`);
    });

    bot.on('session-ended', (session) => {
      console.log(`🛑 Trading session ended: ${session.id}`);
      console.log(`📊 Final stats: ${session.total_trades} trades, ${session.winning_trades} winners`);
    });

    // Start the bot
    await bot.start();

    // Handle graceful shutdown
    const shutdown = async () => {
      console.log('\n🛑 Shutting down trading bot...');
      await bot.stop();
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

    // Keep the process running
    console.log('🤖 Trading bot is running. Press Ctrl+C to stop.');

  } catch (error) {
    console.error('❌ Failed to start trading bot:', error);
    process.exit(1);
  }
}

// Start the application
main().catch(console.error);