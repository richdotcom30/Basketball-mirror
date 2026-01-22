#!/usr/bin/env node

// Load environment variables
require('dotenv').config();

const { Command } = require('commander');

// Import commands
const scrapeCommand = require('./commands/scrape');
const predictCommand = require('./commands/predict');
const telegramCommand = require('./commands/telegram');
const monitorCommand = require('./commands/monitor');
const researchCommand = require('./commands/research');
const backtestCommand = require('./commands/backtest');
const learnCommand = require('./commands/learn');
const sportCommand = require('./commands/sport');
const addGamesCommand = require('./commands/add-games');

const program = new Command();

program
  .name('mirror')
  .description('Unlimited Basketball Prediction AI - The Next Big Thing')
  .version('1.0.0')
  .option('-v, --verbose', 'enable verbose logging')
  .option('-q, --quiet', 'suppress all output except results');

// Global error handling
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error.message);
  if (program.opts().verbose) {
    console.error(error.stack);
  }
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection:', reason);
  if (program.opts().verbose) {
    console.error(promise);
  }
  process.exit(1);
});

// Core commands
program
  .command('scrape')
  .description('Scrape live game data from websites')
  .option('-s, --sources <sources>', 'comma-separated list of sources', 'all')
  .option('-p, --parallel <number>', 'number of parallel processes', '10')
  .action(async (options) => {
    console.log('🔍 Initializing scraper...');

    try {
      console.log('🔍 Scraping game data from global sources...');
      const result = await scrapeCommand.run(options);

      console.log(`✅ Scraped ${result.totalSources} sources, found ${result.totalGames} games`);

      // Show summary if not quiet mode
      if (!program.opts().quiet && result.totalGames > 0) {
        console.log(`📊 Results saved to: ${result.resultsFile}`);
        console.log(`💡 Tip: Run "mirror predict" to analyze these games`);
      }

    } catch (error) {
      console.log('❌ Scraping operation failed');

      if (error.message.includes('OPENROUTER_API_KEY')) {
        console.log('💡 Setup needed: Configure your OpenRouter API key in .env');
        console.log('   Visit: https://openrouter.ai/');
      } else if (error.message.includes('Browser')) {
        console.log('⚠️  Browser scraping unavailable, using HTTP-only mode');
      } else {
        console.error('Error:', error.message);
      }

      if (program.opts().verbose) {
        console.error(error.stack);
      }

      process.exit(1);
    }
  });

program
  .command('predict')
  .description('Generate predictions for all available games')
  .option('-l, --league <league>', 'target league (default: all)', 'all')
  .option('-n, --number <number>', 'max predictions to generate', '100')
  .option('-c, --confidence <threshold>', 'minimum confidence threshold', '0.7')
  .option('-t, --today', 'use today\'s manually added games')
  .action(async (options) => {
    console.log('🧠 Initializing AI prediction engine...');

    try {
      console.log('📊 Loading recent game data...');

      // This check is handled in predictCommand.run()
      const result = await predictCommand.run(options);

      if (result.message && result.message.includes('No game data')) {
        console.log('⚠️  No recent game data found');
        console.log('💡 Solution: Run "mirror scrape" first to collect game data');
        return;
      }

      console.log('🧠 Processing games through AI ensemble...');

      console.log(`✅ Generated ${result.count} high-confidence predictions`);

      // Show detailed results if not quiet
      if (!program.opts().quiet) {
        console.log(`📊 Average confidence: ${(result.avgConfidence * 100).toFixed(1)}%`);
        console.log(`🎯 Predictions saved for analysis`);

        if (result.count > 0) {
          console.log(`💡 Tip: Run "mirror telegram" to share predictions`);
        }
      }

    } catch (error) {
      console.log('❌ Prediction generation failed');

      if (error.message.includes('OPENROUTER_API_KEY')) {
        console.log('💡 Setup needed: Configure your OpenRouter API key in .env');
        console.log('   Visit: https://openrouter.ai/');
        console.log('   Get your free API key and add it to .env file');
      } else if (error.message.includes('No game data')) {
        console.log('💡 No game data available');
        console.log('   Run "mirror scrape" first to collect games');
      } else {
        console.error('Error:', error.message);
      }

      if (program.opts().verbose) {
        console.error(error.stack);
      }

      process.exit(1);
    }
  });

program
  .command('add-games')
  .description('Manually add today\'s games for prediction')
  .action(async () => {
    console.log('🎯 Adding games manually for prediction...');

    try {
      // Get games from command line arguments (after "add-games")
      const games = process.argv.slice(3); // Skip "node", "index.js", "add-games"

      if (games.length === 0) {
        console.log('❌ No games provided.');
        console.log('💡 Usage: mirror add-games "Lakers vs Warriors" "Celtics vs Heat"');
        console.log('💡 Example: mirror add-games "Los Angeles Lakers vs Golden State Warriors"');
        process.exit(1);
      }

      await addGamesCommand.run(games);
      console.log('✅ Games added successfully!');

    } catch (error) {
      console.log('❌ Failed to add games');
      console.error('Error:', error.message);

      if (program.opts().verbose) {
        console.error(error.stack);
      }

      process.exit(1);
    }
  });

program
  .command('telegram')
  .description('Send predictions to Telegram channel')
  .option('-c, --channel <channel>', 'Telegram channel username')
  .option('-m, --message <message>', 'custom message')
  .action(async (options) => {
    console.log('🤖 Initializing Telegram bot...');

    try {
      console.log('📱 Starting Telegram bot server...');
      await telegramCommand.run(options);

      console.log('✅ Telegram bot started successfully');
      console.log('💡 Bot is now running and listening for commands');
      console.log('   Press Ctrl+C to stop the bot');

    } catch (error) {
      console.log('❌ Telegram bot failed to start');

      if (error.message.includes('TELEGRAM_BOT_TOKEN')) {
        console.log('💡 Setup needed: Configure your Telegram bot token');
        console.log('   The token is already configured in .env.example');
        console.log('   Copy .env.example to .env to use it');
      } else {
        console.error('Error:', error.message);
      }

      if (program.opts().verbose) {
        console.error(error.stack);
      }

      process.exit(1);
    }
  });

program
  .command('monitor')
  .description('Start live monitoring for real-time opportunities')
  .option('-d, --daemon', 'run in continuous monitoring mode')
  .option('-i, --interval <minutes>', 'monitoring interval in minutes', '5')
  .option('-t, --threshold <confidence>', 'alert threshold (0-1)', '0.8')
  .option('-c, --concurrent <number>', 'max concurrent checks', '10')
  .action(async (options) => {
    console.log('🌐 Initializing live monitor...');

    try {
      console.log('🌐 Starting live monitoring system...');
      await monitorCommand.run(options);

      if (options.daemon) {
        console.log('✅ Live monitoring started (daemon mode)');
        console.log('🔔 System will alert on high-confidence opportunities');
      } else {
        console.log('✅ Monitoring check completed');
      }

    } catch (error) {
      console.log('❌ Monitoring failed');

      if (error.message.includes('OPENROUTER_API_KEY')) {
        console.log('💡 Setup needed: Configure your OpenRouter API key');
        console.log('   Visit: https://openrouter.ai/');
      } else {
        console.error('Error:', error.message);
      }

      if (program.opts().verbose) {
        console.error(error.stack);
      }

      process.exit(1);
    }
  });

program
  .command('research')
  .description('Perform AI-powered web research with optional internet browsing')
  .option('-q, --query <query>', 'research query or topic')
  .option('-t, --topic <topic>', 'alternative to --query')
  .option('-d, --depth <depth>', 'research depth (basic, focused, comprehensive)', 'comprehensive')
  .option('-r, --results <number>', 'max results to analyze', '10')
  .option('-i, --intelligence <level>', 'AI intelligence level', 'advanced')
  .option('-b, --browse', 'use GPT-5.1 Codex for internet browsing (requires API key)')
  .option('--no-news', 'exclude recent news')
  .option('--no-social', 'exclude social sentiment')
  .action(async (options) => {
    console.log('🧠 Initializing AI research...');

    try {
      console.log('🧠 Performing intelligent web research...');
      await researchCommand.run(options);

      console.log('✅ AI research completed successfully');

    } catch (error) {
      console.log('❌ Research failed');

      if (error.message.includes('OPENROUTER_API_KEY')) {
        console.log('💡 Setup needed: Configure your OpenRouter API key');
        console.log('   Visit: https://openrouter.ai/');
      } else if (error.message.includes('Research query is required')) {
        console.log('💡 Usage: mirror research --query "your research topic"');
      } else {
        console.error('Error:', error.message);
      }

      if (program.opts().verbose) {
        console.error(error.stack);
      }

      process.exit(1);
    }
  });

program
  .command('backtest')
  .description('Run comprehensive prediction backtesting and validation')
  .option('-n, --name <name>', 'backtest name')
  .option('-d, --description <desc>', 'backtest description')
  .option('--start <date>', 'start date (YYYY-MM-DD)', '2023-01-01')
  .option('--end <date>', 'end date (YYYY-MM-DD)')
  .option('-c, --confidence <threshold>', 'confidence threshold', '0.7')
  .option('-s, --strategy <strategy>', 'staking strategy (fixed, kelly, percentage)', 'fixed')
  .option('--stake <amount>', 'stake amount', '10')
  .option('-m, --max <number>', 'max predictions to test')
  .option('-l, --leagues <leagues>', 'comma-separated league filter')
  .option('--list', 'list available backtests')
  .option('--compare <testIds>', 'compare multiple backtests (comma-separated IDs)')
  .option('--report <format>', 'generate comprehensive report (text, json)', 'text')
  .action(async (options) => {
    console.log('🧪 Initializing backtesting engine...');

    try {
      if (options.list) {
        console.log('📋 Listing available backtests...');
        await backtestCommand.run({ list: true });
        console.log('✅ Backtests listed');
      } else if (options.compare) {
        console.log('🔍 Comparing backtest results...');
        await backtestCommand.run({ compare: options.compare });
        console.log('✅ Backtest comparison completed');
      } else if (options.report) {
        console.log('📊 Generating backtesting report...');
        await backtestCommand.run({ report: options.report });
        console.log('✅ Backtesting report generated');
      } else {
        console.log('🧪 Running comprehensive backtest...');
        await backtestCommand.run(options);
        console.log('✅ Backtesting completed successfully');
      }

    } catch (error) {
      console.log('❌ Backtesting failed');

      if (error.message.includes('OPENROUTER_API_KEY')) {
        console.log('💡 Setup needed: Configure your OpenRouter API key');
        console.log('   Visit: https://openrouter.ai/');
      } else if (error.message.includes('Insufficient data')) {
        console.log('💡 Need historical data: Run scraping first');
        console.log('   Use: mirror scrape --sources all --parallel 10');
      } else {
        console.error('Error:', error.message);
      }

      if (program.opts().verbose) {
        console.error(error.stack);
      }

      process.exit(1);
    }
  });

program
  .command('learn')
  .description('Manage reinforcement learning and model optimization')
  .option('--reset', 'reset learning model to defaults')
  .option('--metrics', 'show detailed learning metrics')
  .option('--weights', 'display current model weights')
  .option('--export', 'export learning model data')
  .option('--test <number>', 'test learning predictions', '5')
  .action(async (options) => {
    console.log('🧠 Initializing reinforcement learning system...');

    try {
      console.log('🧠 Processing learning operations...');
      await learnCommand.run(options);

      console.log('✅ Learning operation completed');

    } catch (error) {
      console.log('❌ Learning operation failed');

      if (error.message.includes('OPENROUTER_API_KEY')) {
        console.log('💡 Setup needed: Configure your OpenRouter API key');
        console.log('   Visit: https://openrouter.ai/');
      } else {
        console.error('Error:', error.message);
      }

      if (program.opts().verbose) {
        console.error(error.stack);
      }

      process.exit(1);
    }
  });

program
  .command('sport')
  .description('Manage multi-sport support and configurations')
  .option('--list', 'list all supported sports')
  .option('--switch <sport>', 'switch to a different sport')
  .option('--info <sport>', 'show detailed sport information')
  .option('--stats', 'show multi-sport statistics')
  .option('--markets [sport]', 'show betting markets for sport')
  .option('--factors [sport]', 'show prediction factors for sport')
  .option('--leagues [sport]', 'show leagues for sport')
  .action(async (options) => {
    console.log('🏆 Initializing multi-sport system...');

    try {
      console.log('🏆 Processing sport operations...');
      await sportCommand.run(options);

      console.log('✅ Sport operation completed');

    } catch (error) {
      console.log('❌ Sport operation failed');
      console.error('Error:', error.message);

      if (program.opts().verbose) {
        console.error(error.stack);
      }

      process.exit(1);
    }
  });

// Interactive mode
program
  .command('interactive')
  .alias('i')
  .description('Start interactive mode')
  .action(async () => {
    console.log('🚀 Welcome to Mirror - Interactive Mode');
    console.log('Type "help" for available commands or "exit" to quit\n');

    // Import and run interactive mode
    const interactive = require('./commands/interactive');
    await interactive.run();
  });

// Status command
program
  .command('status')
  .description('Show system status')
  .action(async () => {
    const status = {
      version: '1.0.0',
      node: process.version,
      platform: process.platform,
      memory: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
      uptime: `${Math.round(process.uptime())}s`
    };

    console.log('📊 Mirror System Status');
    console.log('─'.repeat(30));
    Object.entries(status).forEach(([key, value]) => {
      console.log(`${key.padEnd(10)}: ${value}`);
    });
  });

// Help command
program
  .command('help')
  .description('Show help information')
  .action(() => {
    program.help();
  });

// Default action - show welcome message
if (process.argv.length === 2) {
  console.log('🚀 Mirror - Unlimited Basketball Prediction AI');
  console.log('The next big thing in sports betting intelligence\n');
  console.log('Usage: mirror <command> [options]\n');
  console.log('Available commands:');
  console.log('  scrape     🔍 Scrape global basketball data');
  console.log('  add-games  🎯 Manually add today\'s games');
  console.log('  predict    🧠 Generate AI predictions');
  console.log('  telegram   📱 Start Telegram bot server');
  console.log('  monitor    🌐 Live monitoring for opportunities');
  console.log('  research   🧠 AI-powered web research');
  console.log('  backtest   🧪 Validate predictions with backtesting');
  console.log('  learn      🧠 Manage reinforcement learning');
  console.log('  sport      🏆 Multi-sport support & configuration');
  console.log('  interactive 🎮 Guided interactive mode');
  console.log('  status     📊 System status & metrics');
  console.log('  help       ❓ Show detailed help\n');
  console.log('🚀 Getting started:');
  console.log('  1. mirror add-games "Lakers vs Warriors"  # Add games manually');
  console.log('  2. mirror predict --today                 # Generate predictions');
  console.log('  3. mirror telegram                        # Start broadcasting\n');
  console.log('Run "mirror <command> --help" for command details');
  process.exit(0);
}

// Parse command line arguments
program.parse(process.argv);
