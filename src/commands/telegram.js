// Mirror - Telegram Command
// Send predictions to Telegram channels

const TelegramBotManager = require('../telegram/TelegramBotManager');

class TelegramCommand {
  constructor() {
    this.botManager = null;
  }

  async run(options) {
    console.log('🤖 Initializing Telegram bot...');

    try {
      // Initialize bot manager
      this.botManager = new TelegramBotManager({
        predictionsChannel: process.env.MIRROR_PREDICTIONS_CHANNEL,
        performanceChannel: process.env.MIRROR_PERFORMANCE_CHANNEL,
        alertsChannel: process.env.MIRROR_ALERTS_CHANNEL,
        logsChannel: process.env.MIRROR_LOGS_CHANNEL
      });

      await this.botManager.initialize();

      console.log('📱 Connecting to Telegram...');
      await this.botManager.start();

      console.log('✅ Telegram bot started successfully');

      console.log('');
      console.log('🎯 Bot Commands Available:');
      console.log('   /predict  - Generate AI predictions');
      console.log('   /status   - System status');
      console.log('   /stats    - Performance metrics');
      console.log('   /history  - Prediction history');
      console.log('   /help     - Show all commands');
      console.log('');
      console.log('📺 Channels:');
      console.log(`   Predictions: ${this.botManager.channels.predictions}`);
      console.log(`   Performance: ${this.botManager.channels.performance}`);
      console.log(`   Alerts: ${this.botManager.channels.alerts}`);
      console.log('');
      console.log('💡 The bot is now running and will respond to commands.');
      console.log('   Press Ctrl+C to stop the bot.');

      // Keep the process alive
      console.log('');
      console.log('🟢 Bot is active and listening for commands...');

      // Handle graceful shutdown
      process.on('SIGINT', async () => {
        console.log('\n🛑 Shutting down Telegram bot...');
        await this.botManager.stop();
        console.log('✅ Bot stopped successfully');
        process.exit(0);
      });

      process.on('SIGTERM', async () => {
        console.log('\n🛑 Received termination signal...');
        await this.botManager.stop();
        process.exit(0);
      });

      // Keep the process running
      await new Promise(() => {}); // Never resolves, keeps process alive

    } catch (error) {
      console.log('❌ Telegram bot failed to start');

      if (error.message.includes('TELEGRAM_BOT_TOKEN')) {
        console.log('');
        console.log('💡 Setup needed: Configure your Telegram bot token');
        console.log('   1. Message @BotFather on Telegram');
        console.log('   2. Create a new bot with /newbot');
        console.log('   3. Copy the bot token to .env file');
        console.log('   4. Create channels and add bot as administrator');
      } else {
        console.error('❌ Error:', error.message);
      }

      if (this.botManager) {
        await this.botManager.stop().catch(console.error);
      }

      throw error;
    }
  }

  async sendPredictions(predictions, options = {}) {
    if (!this.botManager) {
      throw new Error('Telegram bot not initialized. Run "mirror telegram" first.');
    }

    try {
      await this.botManager.broadcastPredictions(predictions);
      console.log(`✅ Broadcasted ${predictions.length} predictions to Telegram`);

      // Send high-confidence alerts if any
      const highConfidencePreds = predictions.filter(p => p.confidence > 0.8);
      if (highConfidencePreds.length > 0) {
        await this.botManager.sendAlert(
          `High-confidence predictions available: ${highConfidencePreds.length} predictions with >80% confidence`,
          'high'
        );
      }

      return {
        sent: true,
        predictionsCount: predictions.length,
        highConfidenceCount: highConfidencePreds.length,
        channels: this.botManager.channels
      };

    } catch (error) {
      console.error('❌ Failed to send predictions:', error.message);
      throw error;
    }
  }

  async sendAlert(message, priority = 'normal') {
    if (!this.botManager) {
      throw new Error('Telegram bot not initialized');
    }

    await this.botManager.sendAlert(message, priority);
  }

  async storeData(data) {
    if (!this.botManager) {
      throw new Error('Telegram bot not initialized');
    }

    await this.botManager.storePredictionData(data);
  }

  getStats() {
    return this.botManager ? this.botManager.getStats() : null;
  }
}

module.exports = new TelegramCommand();
