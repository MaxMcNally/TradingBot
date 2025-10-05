#!/usr/bin/env node

import { Command } from 'commander';
import { TradingBot } from '../bot/TradingBot';
import { UserManager } from '../bot/UserManager';
import { PolygonProvider } from '../dataProviders/PolygonProvider';
import { defaultTradingConfig } from '../config/tradingConfig';
import { TradingMode } from '../config';
import { TradingDatabase } from '../database/tradingSchema';
import dotenv from 'dotenv';

dotenv.config();

const program = new Command();

program
  .name('trading-bot')
  .description('Advanced Trading Bot CLI')
  .version('1.0.0');

// Start command
program
  .command('start')
  .description('Start the trading bot')
  .option('-m, --mode <mode>', 'Trading mode (paper|live)', 'paper')
  .option('-c, --cash <amount>', 'Initial cash amount', '10000')
  .option('-s, --symbols <symbols>', 'Comma-separated list of symbols', 'SPY,QQQ,AAPL,TSLA')
  .option('-u, --username <username>', 'Username for authentication', 'admin')
  .option('-p, --password <password>', 'Password for authentication', 'admin123')
  .option('--api-key <key>', 'Polygon API key (or set POLYGON_API_KEY env var)')
  .action(async (options) => {
    try {
      const mode = options.mode === 'live' ? TradingMode.LIVE : TradingMode.PAPER;
      const initialCash = parseFloat(options.cash);
      const symbols = options.symbols.split(',').map((s: string) => s.trim());
      const apiKey = options.apiKey || process.env.POLYGON_API_KEY;
      const username = options.username;
      const password = options.password;

      if (!apiKey) {
        console.error('❌ Error: Polygon API key is required');
        console.error('   Set POLYGON_API_KEY environment variable or use --api-key option');
        process.exit(1);
      }

      // Authenticate user
      console.log(`🔐 Authenticating user: ${username}`);
      const authResult = await UserManager.authenticateUser(username, password);
      
      if (!authResult.success) {
        console.error(`❌ Authentication failed: ${authResult.message}`);
        process.exit(1);
      }

      const user = authResult.user;
      console.log(`✅ Authenticated as: ${user.username} (ID: ${user.id})`);

      console.log(`🚀 Starting trading bot in ${mode.toUpperCase()} mode`);
      console.log(`💰 Initial cash: $${initialCash.toFixed(2)}`);
      console.log(`📊 Symbols: ${symbols.join(', ')}`);

      const provider = new PolygonProvider(apiKey);
      const config = {
        ...defaultTradingConfig,
        mode,
        initialCash,
        symbols,
        dataProvider: {
          ...defaultTradingConfig.dataProvider,
          apiKey
        }
      };

      const bot = new TradingBot(config, provider, user.id);

      // Set up event listeners
      bot.on('trade', (trade) => {
        console.log(`📈 ${trade.action} ${trade.quantity} ${trade.symbol} @ $${trade.price.toFixed(2)}`);
      });

      bot.on('portfolio-update', (status) => {
        console.log(`💼 Portfolio: $${status.totalValue.toFixed(2)} | Cash: $${status.cash.toFixed(2)}`);
      });

      bot.on('error', (error) => {
        console.error('❌ Bot error:', error.message);
      });

      await bot.start();

      // Handle graceful shutdown
      const shutdown = async () => {
        console.log('\n🛑 Shutting down...');
        await bot.stop();
        process.exit(0);
      };

      process.on('SIGINT', shutdown);
      process.on('SIGTERM', shutdown);

    } catch (error) {
      console.error('❌ Failed to start bot:', error);
      process.exit(1);
    }
  });

// Status command
program
  .command('status')
  .description('Show current bot status and recent trades')
  .option('-u, --username <username>', 'Username for authentication', 'admin')
  .option('-p, --password <password>', 'Password for authentication', 'admin123')
  .option('-l, --limit <number>', 'Number of recent trades to show', '10')
  .action(async (options) => {
    try {
      await TradingDatabase.initializeTables();
      
      // Authenticate user
      const authResult = await UserManager.authenticateUser(options.username, options.password);
      
      if (!authResult.success) {
        console.error(`❌ Authentication failed: ${authResult.message}`);
        process.exit(1);
      }

      const user = authResult.user;
      console.log(`👤 User: ${user.username} (ID: ${user.id})`);
      
      const activeSession = await TradingDatabase.getActiveTradingSession(user.id);
      if (activeSession) {
        console.log('\n🤖 Active Trading Session:');
        console.log(`   ID: ${activeSession.id}`);
        console.log(`   Mode: ${activeSession.mode}`);
        console.log(`   Start: ${activeSession.start_time}`);
        console.log(`   Trades: ${activeSession.total_trades}`);
        console.log(`   Winners: ${activeSession.winning_trades}`);
        console.log(`   P&L: $${activeSession.total_pnl?.toFixed(2) || '0.00'}`);
      } else {
        console.log('\n🤖 No active trading session');
      }

      // Get user trading stats
      const stats = await UserManager.getUserTradingStats(user.id);
      if (stats) {
        console.log('\n📊 Trading Statistics:');
        console.log(`   Total Trades: ${stats.totalTrades}`);
        console.log(`   Winning Trades: ${stats.winningTrades}`);
        console.log(`   Win Rate: ${stats.winRate.toFixed(2)}%`);
        console.log(`   Total P&L: $${stats.totalPnL.toFixed(2)}`);
        console.log(`   Active Sessions: ${stats.activeSessions}`);
        if (stats.lastTradeDate) {
          console.log(`   Last Trade: ${stats.lastTradeDate}`);
        }
      }

      // Get portfolio summary
      const portfolio = await UserManager.getUserPortfolioSummary(user.id);
      if (portfolio) {
        console.log('\n💼 Portfolio Summary:');
        console.log(`   Current Value: $${portfolio.currentValue.toFixed(2)}`);
        console.log(`   Cash: $${portfolio.cash.toFixed(2)}`);
        console.log(`   Positions: ${portfolio.totalPositions}`);
        console.log(`   Mode: ${portfolio.mode}`);
        console.log(`   Last Update: ${portfolio.lastUpdate}`);
      }

      const recentTrades = await UserManager.getUserRecentTrades(user.id, parseInt(options.limit));
      if (recentTrades.length > 0) {
        console.log(`\n📈 Recent Trades (${recentTrades.length}):`);
        recentTrades.forEach(trade => {
          const pnl = trade.pnl ? ` (P&L: $${trade.pnl.toFixed(2)})` : '';
          console.log(`   ${trade.action} ${trade.quantity} ${trade.symbol} @ $${trade.price.toFixed(2)}${pnl}`);
        });
      }

    } catch (error) {
      console.error('❌ Failed to get status:', error);
      process.exit(1);
    }
  });

// History command
program
  .command('history')
  .description('Show trading history')
  .option('-d, --days <number>', 'Number of days to show', '7')
  .option('-s, --symbol <symbol>', 'Filter by symbol')
  .action(async (options) => {
    try {
      await TradingDatabase.initializeTables();
      
      const days = parseInt(options.days);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      // This would need to be implemented in TradingDatabase
      console.log(`📊 Trading history for the last ${days} days`);
      console.log('(History filtering not yet implemented)');
      
    } catch (error) {
      console.error('❌ Failed to get history:', error);
      process.exit(1);
    }
  });

// Config command
program
  .command('config')
  .description('Show current configuration')
  .action(() => {
    console.log('⚙️  Default Trading Configuration:');
    console.log(JSON.stringify(defaultTradingConfig, null, 2));
  });

// User management command
program
  .command('user')
  .description('User management commands')
  .command('create')
  .description('Create a new user')
  .option('-u, --username <username>', 'Username')
  .option('-p, --password <password>', 'Password')
  .option('-e, --email <email>', 'Email address')
  .action(async (options) => {
    try {
      if (!options.username || !options.password) {
        console.error('❌ Username and password are required');
        process.exit(1);
      }

      const result = await UserManager.createUser(options.username, options.password, options.email);
      
      if (result.success) {
        console.log(`✅ User created successfully: ${result.user.username} (ID: ${result.user.id})`);
      } else {
        console.error(`❌ Failed to create user: ${result.message}`);
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Failed to create user:', error);
      process.exit(1);
    }
  });

// Database command
program
  .command('db')
  .description('Database management commands')
  .command('init')
  .description('Initialize database tables')
  .action(async () => {
    try {
      await TradingDatabase.initializeTables();
      console.log('✅ Database tables initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize database:', error);
      process.exit(1);
    }
  });

program.parse();
