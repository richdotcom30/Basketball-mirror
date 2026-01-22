// Mirror - Telegram Bot Database Manager
// Phase 4: Telegram Bot Database

const { Telegraf } = require('telegraf');
const fs = require('fs').promises;
const path = require('path');

class TelegramBotManager {
  constructor(options = {}) {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!this.botToken) {
      throw new Error('TELEGRAM_BOT_TOKEN environment variable not set');
    }

    this.bot = new Telegraf(this.botToken);
    this.isInitialized = false;

    // Channel configuration
    this.channels = {
      predictions: options.predictionsChannel || '@mirror_predictions',
      performance: options.performanceChannel || '@mirror_performance',
      alerts: options.alertsChannel || '@mirror_alerts',
      logs: options.logsChannel || '@mirror_logs'
    };

    // Bot state
    this.messageQueue = [];
    this.isProcessingQueue = false;
    this.rateLimitDelay = 1000; // 1 second between messages
    this.maxRetries = 3;

    // Statistics
    this.stats = {
      messagesSent: 0,
      predictionsBroadcasted: 0,
      errors: 0,
      lastActivity: null
    };

    this.setupBotCommands();
    this.setupEventHandlers();
  }

  setupBotCommands() {
    // Basic commands
    this.bot.start((ctx) => {
      ctx.reply(`🤖 *Mirror AI Bot* - Unlimited Basketball Predictions

Welcome! I'm your AI-powered prediction assistant.

*Available Commands:*
/predict - Generate new predictions
/status - System status and performance
/help - Show all commands
/history - View prediction history
/stats - Performance statistics

_Send me "interactive" to start guided mode_`, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🎯 Generate Predictions', callback_data: 'predict' }],
            [{ text: '📊 View Status', callback_data: 'status' }],
            [{ text: '📖 Help', callback_data: 'help' }]
          ]
        }
      });
    });

    this.bot.help((ctx) => {
      ctx.reply(`*Mirror Bot Commands:*

🎯 */predict* - Generate AI predictions
📊 */status* - System health and metrics
📈 */stats* - Performance statistics
📜 */history* - Recent predictions
🔧 */config* - Bot configuration
🧹 */clear* - Clear message history

*Interactive Mode:*
Send "interactive" to start guided interface

*Broadcast Channels:*
• @mirror_predictions - Live predictions
• @mirror_performance - Performance data
• @mirror_alerts - High-confidence alerts
• @mirror_logs - System logs

*Tips:*
• Use confidence filters for better predictions
• Monitor performance metrics regularly
• High-confidence predictions (>80%) have best win rates`, {
        parse_mode: 'Markdown'
      });
    });

    // Prediction commands
    this.bot.command('predict', async (ctx) => {
      await ctx.reply('🎯 *Generating Predictions...*', { parse_mode: 'Markdown' });

      try {
        // Import prediction engine dynamically to avoid circular dependencies
        const PredictionEngine = require('../core/PredictionEngine');
        const engine = new PredictionEngine();

        // Get recent games (simplified for demo)
        const games = await this.getRecentGamesForPredictions();

        if (games.length === 0) {
          return ctx.reply('⚠️ No recent game data available. Please run scraping first.');
        }

        const result = await engine.predictGames(games.slice(0, 10));

        // Format and send predictions
        const predictionText = this.formatPredictionsForTelegram(result.predictions);
        await ctx.reply(predictionText, { parse_mode: 'Markdown' });

        // Broadcast to predictions channel
        await this.broadcastPredictions(result.predictions);

        // Update stats
        this.stats.predictionsBroadcasted += result.predictions.length;

      } catch (error) {
        console.error('Bot prediction error:', error);
        await ctx.reply(`❌ Prediction failed: ${error.message}`);
      }
    });

    this.bot.command('status', async (ctx) => {
      const status = await this.getSystemStatus();
      await ctx.reply(status, { parse_mode: 'Markdown' });
    });

    this.bot.command('stats', async (ctx) => {
      const stats = this.getPerformanceStats();
      await ctx.reply(stats, { parse_mode: 'Markdown' });
    });

    this.bot.command('history', async (ctx) => {
      const history = await this.getPredictionHistory();
      await ctx.reply(history, { parse_mode: 'Markdown' });
    });

    // Interactive mode
    this.bot.on('text', async (ctx) => {
      const message = ctx.message.text.toLowerCase().trim();

      if (message === 'interactive') {
        await this.startInteractiveMode(ctx);
      }
    });

    // Callback queries for inline buttons
    this.bot.on('callback_query', async (ctx) => {
      const data = ctx.callbackData;

      switch (data) {
        case 'predict':
          await ctx.answerCbQuery();
          await ctx.editMessageText('🎯 Generating predictions...');
          // Trigger prediction command
          await this.handlePredictCommand(ctx);
          break;

        case 'status':
          await ctx.answerCbQuery();
          const status = await this.getSystemStatus();
          await ctx.editMessageText(status, { parse_mode: 'Markdown' });
          break;

        case 'help':
          await ctx.answerCbQuery();
          await ctx.editMessageText(`*Mirror Bot Help*

🎯 Generate Predictions: Click the button above
📊 Check Status: Monitor system health
📈 View Stats: Performance metrics
📜 History: Recent predictions

Use /help for full command list`, { parse_mode: 'Markdown' });
          break;
      }
    });
  }

  setupEventHandlers() {
    this.bot.catch((err, ctx) => {
      console.error('Bot error:', err);
      this.stats.errors++;

      if (ctx) {
        ctx.reply('❌ An error occurred. Please try again later.').catch(console.error);
      }
    });
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      console.log('🤖 Initializing Telegram bot...');

      // Test bot connection
      const botInfo = await this.bot.telegram.getMe();
      console.log(`✅ Bot connected: @${botInfo.username}`);

      // Validate channels exist
      await this.validateChannels();

      this.isInitialized = true;
      console.log('✅ Telegram bot fully initialized');

    } catch (error) {
      console.error('❌ Bot initialization failed:', error.message);
      throw error;
    }
  }

  async validateChannels() {
    console.log('📺 Validating Telegram channels...');

    for (const [key, channel] of Object.entries(this.channels)) {
      try {
        // Try to get chat info (this will fail if bot isn't admin or channel doesn't exist)
        await this.bot.telegram.getChat(channel);
        console.log(`✅ Channel ${key}: ${channel}`);
      } catch (error) {
        console.warn(`⚠️  Channel ${key} (${channel}) not accessible:`, error.message);
        console.warn('   Make sure the bot is added as administrator to the channel');
      }
    }
  }

  async start() {
    await this.initialize();
    console.log('🚀 Starting Telegram bot...');
    await this.bot.launch();
    console.log('✅ Telegram bot is running');
  }

  async stop() {
    console.log('🛑 Stopping Telegram bot...');
    await this.bot.stop();
    console.log('✅ Telegram bot stopped');
  }

  async broadcastPredictions(predictions) {
    if (!Array.isArray(predictions) || predictions.length === 0) {
      console.warn('No predictions to broadcast');
      return;
    }

    console.log(`📡 Broadcasting ${predictions.length} predictions to Telegram...`);

    const message = this.formatPredictionsForTelegram(predictions);

    try {
      await this.sendToChannel(this.channels.predictions, message);
      console.log('✅ Predictions broadcasted successfully');

      // Store in performance channel
      const performanceData = {
        timestamp: new Date().toISOString(),
        predictionsCount: predictions.length,
        averageConfidence: predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length,
        highConfidenceCount: predictions.filter(p => p.confidence > 0.8).length
      };

      await this.sendToChannel(this.channels.performance, JSON.stringify(performanceData, null, 2));

    } catch (error) {
      console.error('❌ Broadcasting failed:', error.message);
      this.stats.errors++;
    }
  }

  async sendAlert(message, priority = 'normal') {
    const channel = priority === 'high' ? this.channels.alerts : this.channels.predictions;

    try {
      await this.sendToChannel(channel, `🚨 *ALERT*: ${message}`, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error('Alert sending failed:', error.message);
    }
  }

  async sendToChannel(channel, message, options = {}) {
    // Add to queue for rate limiting
    this.messageQueue.push({ channel, message, options });

    if (!this.isProcessingQueue) {
      await this.processMessageQueue();
    }
  }

  async processMessageQueue() {
    if (this.isProcessingQueue || this.messageQueue.length === 0) return;

    this.isProcessingQueue = true;

    while (this.messageQueue.length > 0) {
      const { channel, message, options } = this.messageQueue.shift();

      try {
        await this.bot.telegram.sendMessage(channel, message, options);
        this.stats.messagesSent++;
        this.stats.lastActivity = new Date();

        // Rate limiting
        if (this.messageQueue.length > 0) {
          await this.delay(this.rateLimitDelay);
        }

      } catch (error) {
        console.error(`Failed to send message to ${channel}:`, error.message);
        this.stats.errors++;
      }
    }

    this.isProcessingQueue = false;
  }

  async storePredictionData(predictionData) {
    // Store prediction results in Telegram channel as "database"
    const dataMessage = {
      type: 'prediction_result',
      timestamp: new Date().toISOString(),
      data: predictionData
    };

    try {
      await this.sendToChannel(
        this.channels.performance,
        `\`\`\`json\n${JSON.stringify(dataMessage, null, 2)}\n\`\`\``,
        { parse_mode: 'Markdown' }
      );
    } catch (error) {
      console.error('Failed to store prediction data:', error.message);
    }
  }

  async getPredictionHistory(limit = 10) {
    // In a real implementation, this would scrape the channel history
    // For now, return a placeholder
    return `*Recent Predictions History*

📊 Last ${limit} predictions:
• No historical data available yet
• Run /predict to generate new predictions
• History will be stored in Telegram channels

💡 *Tip*: All predictions are automatically archived in @mirror_performance`;
  }

  async getRecentGamesForPredictions() {
    // Simplified: In real implementation, this would fetch from scraped data
    // For demo purposes, return mock games
    return [
      {
        id: 'demo-game-1',
        homeTeam: 'Los Angeles Lakers',
        awayTeam: 'Golden State Warriors',
        league: 'NBA',
        date: new Date().toISOString().split('T')[0],
        time: '20:00'
      },
      {
        id: 'demo-game-2',
        homeTeam: 'Boston Celtics',
        awayTeam: 'Miami Heat',
        league: 'NBA',
        date: new Date().toISOString().split('T')[0],
        time: '19:30'
      }
    ];
  }

  formatPredictionsForTelegram(predictions) {
    if (!Array.isArray(predictions) || predictions.length === 0) {
      return '⚠️ No predictions available';
    }

    let message = `🎯 *Mirror AI Predictions*\n\n`;

    predictions.slice(0, 10).forEach((pred, i) => {
      const confidencePercent = (pred.confidence * 100).toFixed(1);
      const edgePercent = pred.edge ? pred.edge.toFixed(1) : '0.0';

      message += `${i + 1}. *${pred.gameId}*\n`;
      message += `   ${pred.prediction}\n`;
      message += `   📊 Confidence: ${confidencePercent}%\n`;
      message += `   💰 Edge: ${edgePercent}%\n\n`;
    });

    message += `📈 Generated ${predictions.length} predictions\n`;
    message += `🎪 Powered by 4-model AI ensemble\n`;
    message += `⏰ ${new Date().toLocaleString()}`;

    return message;
  }

  async getSystemStatus() {
    const status = {
      version: '1.0.0',
      uptime: process.uptime(),
      memory: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
      predictionsToday: this.stats.predictionsBroadcasted,
      messagesSent: this.stats.messagesSent,
      errors: this.stats.errors,
      lastActivity: this.stats.lastActivity ? this.stats.lastActivity.toLocaleString() : 'None'
    };

    return `*Mirror System Status*

🟢 *Operational*
📊 *Statistics:*
• Uptime: ${Math.round(status.uptime / 60)} minutes
• Memory: ${status.memory}
• Predictions Today: ${status.predictionsToday}
• Messages Sent: ${status.messagesSent}
• Errors: ${status.errors}

🕐 Last Activity: ${status.lastActivity}
🤖 Bot Version: ${status.version}`;
  }

  getPerformanceStats() {
    return `*Performance Statistics*

📈 *Predictions:*
• Total Generated: ${this.stats.predictionsBroadcasted}
• Success Rate: ${this.stats.messagesSent > 0 ? Math.round((this.stats.messagesSent / (this.stats.messagesSent + this.stats.errors)) * 100) : 0}%

💬 *Messages:*
• Total Sent: ${this.stats.messagesSent}
• Error Rate: ${this.stats.messagesSent > 0 ? Math.round((this.stats.errors / (this.stats.messagesSent + this.stats.errors)) * 100) : 0}%

🎯 *Channels:*
• Predictions: ${this.channels.predictions}
• Performance: ${this.channels.performance}
• Alerts: ${this.channels.alerts}`;
  }

  async handlePredictCommand(ctx) {
    // Implementation for callback query prediction
    try {
      await ctx.reply('🎯 Generating predictions...');

      const PredictionEngine = require('../core/PredictionEngine');
      const engine = new PredictionEngine();
      const games = await this.getRecentGamesForPredictions();

      if (games.length === 0) {
        return ctx.reply('⚠️ No game data available. Run scraping first.');
      }

      const result = await engine.predictGames(games.slice(0, 5));
      const message = this.formatPredictionsForTelegram(result.predictions);

      await ctx.reply(message, { parse_mode: 'Markdown' });

    } catch (error) {
      await ctx.reply(`❌ Prediction failed: ${error.message}`);
    }
  }

  async startInteractiveMode(ctx) {
    await ctx.reply(`🎮 *Interactive Mode Started*

I'll guide you through Mirror's features:

1. *Data Collection*: Scrape global basketball games
2. *AI Predictions*: Generate intelligent predictions
3. *Broadcasting*: Share results to channels
4. *Analytics*: Track performance metrics

Send /predict to start, or use the buttons below:`, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🎯 Predict Now', callback_data: 'predict' }],
          [{ text: '📊 Status', callback_data: 'status' }],
          [{ text: '❓ Help', callback_data: 'help' }]
        ]
      }
    });
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getStats() {
    return { ...this.stats };
  }
}

module.exports = TelegramBotManager;
