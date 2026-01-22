// Mirror - Live Monitoring System
// Phase 5: Web Integration & Automation

const WebScraper = require('../scrapers/WebScraper');
const OpenRouterClient = require('../ai/OpenRouterClient');
const TelegramBotManager = require('../telegram/TelegramBotManager');

class LiveMonitor {
  constructor(options = {}) {
    this.scraper = new WebScraper(options.scraper);
    this.ai = new OpenRouterClient(options.ai);
    this.telegram = options.telegram;

    // Monitoring configuration
    this.monitoringInterval = options.interval || 5 * 60 * 1000; // 5 minutes
    this.alertThreshold = options.alertThreshold || 0.8; // 80% confidence
    this.maxConcurrentChecks = options.maxConcurrent || 10;

    // State tracking
    this.isMonitoring = false;
    this.lastCheckTime = null;
    this.activeGames = new Map();
    this.monitoringStats = {
      checksPerformed: 0,
      alertsTriggered: 0,
      predictionsGenerated: 0,
      errors: 0
    };

    // Game state tracking
    this.gameStates = new Map(); // gameId -> {lastState, lastUpdate, predictions}

    // Auto-trigger configuration
    this.autoTriggerEnabled = options.autoTrigger || true;
    this.triggerConditions = {
      newGames: true,
      oddsChanges: true,
      injuryUpdates: true,
      highConfidenceOpportunities: true
    };
  }

  async startMonitoring() {
    if (this.isMonitoring) {
      console.log('🔄 Live monitoring already running');
      return;
    }

    console.log('🚀 Starting live monitoring system...');
    console.log(`📊 Check interval: ${this.monitoringInterval / 1000} seconds`);
    console.log(`🎯 Alert threshold: ${(this.alertThreshold * 100).toFixed(1)}% confidence`);

    this.isMonitoring = true;

    // Initial check
    await this.performMonitoringCheck();

    // Set up recurring checks
    this.monitoringTimer = setInterval(async () => {
      try {
        await this.performMonitoringCheck();
      } catch (error) {
        console.error('❌ Monitoring check failed:', error.message);
        this.monitoringStats.errors++;
      }
    }, this.monitoringInterval);

    console.log('✅ Live monitoring system active');
    console.log('🔔 Will alert on high-confidence opportunities');

    // Handle graceful shutdown
    process.on('SIGINT', () => this.stopMonitoring());
    process.on('SIGTERM', () => this.stopMonitoring());
  }

  async stopMonitoring() {
    console.log('🛑 Stopping live monitoring system...');

    this.isMonitoring = false;

    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = null;
    }

    console.log('✅ Live monitoring stopped');
    console.log(`📊 Session stats: ${JSON.stringify(this.monitoringStats, null, 2)}`);
  }

  async performMonitoringCheck() {
    console.log(`🔍 Performing live monitoring check... (${new Date().toLocaleTimeString()})`);

    const startTime = Date.now();
    this.lastCheckTime = new Date();

    try {
      // 1. Scrape live game data
      const scrapeResults = await this.scrapeLiveData();

      // 2. Analyze for changes and opportunities
      const opportunities = await this.analyzeLiveData(scrapeResults);

      // 3. Generate predictions for high-value opportunities
      const predictions = await this.generateLivePredictions(opportunities);

      // 4. Send alerts for high-confidence predictions
      await this.sendLiveAlerts(predictions);

      // 5. Update monitoring stats
      this.monitoringStats.checksPerformed++;

      const duration = Date.now() - startTime;
      console.log(`✅ Monitoring check complete (${duration}ms, ${predictions.length} predictions)`);

    } catch (error) {
      console.error('❌ Monitoring check error:', error.message);
      this.monitoringStats.errors++;
    }
  }

  async scrapeLiveData() {
    console.log('🌐 Scraping live game data...');

    // Scrape a subset of active sources for live monitoring
    const activeSources = [
      'nba', 'euroleague', 'acb', 'tbl', // High-traffic sources
      'wnba', 'eurocup', 'lnb_france'    // Additional coverage
    ];

    const results = [];

    // Process sources with concurrency limit
    const batches = this.chunkArray(activeSources, 3); // 3 concurrent

    for (const batch of batches) {
      const batchPromises = batch.map(source =>
        this.scraper.scrapeSource(source, { timeout: 15000 }) // Shorter timeout for live monitoring
      );

      const batchResults = await Promise.allSettled(batchPromises);

      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          console.warn('⚠️ Source scraping failed:', result.reason.message);
        }
      }

      // Small delay between batches
      if (batches.length > 1) {
        await this.delay(1000);
      }
    }

    console.log(`📊 Scraped ${results.length} sources, found ${results.reduce((sum, r) => sum + r.games.length, 0)} games`);
    return results;
  }

  async analyzeLiveData(scrapeResults) {
    console.log('🔬 Analyzing live data for opportunities...');

    const opportunities = [];
    const allGames = [];

    // Flatten all games from results
    scrapeResults.forEach(result => {
      if (result.games && Array.isArray(result.games)) {
        allGames.push(...result.games.map(game => ({
          ...game,
          source: result.source,
          scrapeTimestamp: result.timestamp
        })));
      }
    });

    // Check for changes and opportunities
    for (const game of allGames) {
      const gameId = game.id;
      const previousState = this.gameStates.get(gameId);

      // New game detection
      if (!previousState) {
        if (this.triggerConditions.newGames) {
          opportunities.push({
            type: 'new_game',
            game,
            reason: 'New game detected',
            priority: 'medium'
          });
        }
      } else {
        // Check for significant changes
        const changes = this.detectGameChanges(previousState, game);
        if (changes.length > 0 && this.triggerConditions.oddsChanges) {
          opportunities.push({
            type: 'game_change',
            game,
            changes,
            reason: `Game changes detected: ${changes.join(', ')}`,
            priority: 'high'
          });
        }
      }

      // Update game state
      this.gameStates.set(gameId, {
        ...game,
        lastUpdate: new Date(),
        changes: []
      });
    }

    // Look for high-value opportunities
    if (this.triggerConditions.highConfidenceOpportunities) {
      const highValueOpps = await this.findHighValueOpportunities(allGames);
      opportunities.push(...highValueOpps);
    }

    console.log(`🎯 Found ${opportunities.length} monitoring opportunities`);
    return opportunities;
  }

  async findHighValueOpportunities(games) {
    const opportunities = [];

    // Use AI to analyze games for high-value opportunities
    for (const game of games.slice(0, 20)) { // Limit to avoid overwhelming AI
      try {
        // Quick AI analysis for opportunity detection
        const analysis = await this.ai.analyzeGame(game, {
          context: 'live_monitoring',
          quickAnalysis: true
        });

        // Check if AI identifies high-confidence opportunity
        if (analysis.confidence >= this.alertThreshold) {
          opportunities.push({
            type: 'high_confidence_opportunity',
            game,
            analysis,
            reason: `AI detected high-confidence opportunity (${(analysis.confidence * 100).toFixed(1)}% confidence)`,
            priority: 'urgent'
          });
        }

        // Rate limiting for AI calls
        await this.delay(500);

      } catch (error) {
        console.warn(`⚠️ AI analysis failed for ${game.id}:`, error.message);
      }
    }

    return opportunities;
  }

  async generateLivePredictions(opportunities) {
    if (!this.autoTriggerEnabled) {
      return [];
    }

    console.log('🎯 Generating live predictions for opportunities...');

    const predictions = [];
    const highPriorityOpps = opportunities.filter(opp => opp.priority === 'urgent' || opp.priority === 'high');

    // Focus on high-priority opportunities
    for (const opportunity of highPriorityOpps.slice(0, 5)) { // Limit predictions
      try {
        const game = opportunity.game;

        // Generate full prediction using PredictionEngine
        const PredictionEngine = require('./PredictionEngine');
        const engine = new PredictionEngine({
          minConfidence: this.alertThreshold,
          maxPredictions: 1
        });

        const result = await engine.predictGames([game]);

        if (result.predictions.length > 0) {
          const prediction = result.predictions[0];
          prediction.opportunity = opportunity;
          prediction.generatedBy = 'live_monitor';
          prediction.timestamp = new Date().toISOString();

          predictions.push(prediction);
          this.monitoringStats.predictionsGenerated++;
        }

      } catch (error) {
        console.error('❌ Live prediction failed:', error.message);
      }
    }

    console.log(`✅ Generated ${predictions.length} live predictions`);
    return predictions;
  }

  async sendLiveAlerts(predictions) {
    if (predictions.length === 0) return;

    console.log('📡 Sending live alerts...');

    const alertsSent = [];

    for (const prediction of predictions) {
      try {
        // Send alert via Telegram
        if (this.telegram) {
          await this.telegram.sendAlert(
            `🚨 **LIVE ALERT**: High-confidence prediction generated!\n\n` +
            `🎯 ${prediction.prediction} (${(prediction.confidence * 100).toFixed(1)}% confidence)\n` +
            `🏀 ${prediction.gameId}\n` +
            `📊 Edge: ${prediction.edge.toFixed(1)}%\n` +
            `⏰ ${new Date(prediction.timestamp).toLocaleString()}`,
            'high'
          );
        }

        // Broadcast full prediction
        if (this.telegram) {
          await this.telegram.broadcastPredictions([prediction]);
        }

        alertsSent.push(prediction);
        this.monitoringStats.alertsTriggered++;

      } catch (error) {
        console.error('❌ Alert sending failed:', error.message);
      }
    }

    console.log(`🔔 Sent ${alertsSent.length} live alerts`);
  }

  detectGameChanges(previousState, currentState) {
    const changes = [];

    // Check for odds changes (if available)
    if (previousState.odds !== currentState.odds) {
      changes.push('odds_change');
    }

    // Check for status changes
    if (previousState.status !== currentState.status) {
      changes.push(`status_${previousState.status}_to_${currentState.status}`);
    }

    // Check for time changes
    if (previousState.time !== currentState.time) {
      changes.push('time_change');
    }

    return changes;
  }

  chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getStats() {
    return {
      ...this.monitoringStats,
      isMonitoring: this.isMonitoring,
      lastCheckTime: this.lastCheckTime,
      activeGames: this.gameStates.size,
      monitoringInterval: this.monitoringInterval
    };
  }

  async researchGameLive(gameData) {
    // AI-powered live research for specific games
    try {
      const research = await this.ai.researchGame(gameData, {
        context: 'live_monitoring',
        includeRecentNews: true,
        includeSocialSentiment: true
      });

      return research;
    } catch (error) {
      console.error('❌ Live research failed:', error.message);
      return null;
    }
  }

  async triggerManualAnalysis(gameId) {
    // Allow manual triggering of analysis for specific games
    const gameState = this.gameStates.get(gameId);
    if (!gameState) {
      throw new Error(`Game ${gameId} not found in monitoring`);
    }

    console.log(`🎯 Manually triggering analysis for ${gameId}`);

    const opportunities = [{
      type: 'manual_trigger',
      game: gameState,
      reason: 'Manual analysis trigger',
      priority: 'high'
    }];

    const predictions = await this.generateLivePredictions(opportunities);
    await this.sendLiveAlerts(predictions);

    return predictions;
  }
}

module.exports = LiveMonitor;
