// Mirror - Reinforcement Learning System
// Phase 9: Continuous Evolution

const fs = require('fs').promises;
const path = require('path');

class ReinforcementLearner {
  constructor(options = {}) {
    this.learningRate = options.learningRate || 0.1;
    this.discountFactor = options.discountFactor || 0.9;
    this.explorationRate = options.explorationRate || 0.1;

    // Learning data storage
    this.modelPath = options.modelPath || path.join(process.cwd(), 'data', 'learning');
    this.performanceHistory = [];
    this.modelWeights = {};

    // Learning metrics
    this.metrics = {
      totalPredictions: 0,
      learningIterations: 0,
      averageReward: 0,
      modelAccuracy: 0,
      lastUpdate: null
    };

    this.isInitialized = false;
  }

  async initialize() {
    try {
      // Create learning data directory
      await fs.mkdir(this.modelPath, { recursive: true });

      // Load existing model if available
      await this.loadModel();

      // Initialize default weights if no model exists
      if (Object.keys(this.modelWeights).length === 0) {
        await this.initializeDefaultWeights();
      }

      this.isInitialized = true;
      console.log('🧠 Reinforcement Learning system initialized');

    } catch (error) {
      console.error('Failed to initialize reinforcement learner:', error.message);
      throw error;
    }
  }

  async initializeDefaultWeights() {
    // Default weights for different prediction factors
    this.modelWeights = {
      // Team performance factors
      home_advantage: 0.6,
      recent_form: 0.7,
      head_to_head: 0.5,

      // Statistical factors
      offensive_rating: 0.8,
      defensive_rating: 0.8,
      pace_factor: 0.4,
      efficiency_diff: 0.6,

      // Situational factors
      rest_advantage: 0.5,
      travel_distance: 0.3,
      altitude_factor: 0.2,

      // Injury and matchup factors
      injury_impact: 0.7,
      matchup_rating: 0.6,

      // Market factors
      line_movement: 0.4,
      public_money: 0.3,

      // Confidence and thresholds
      base_confidence: 0.5,
      risk_threshold: 0.7,
      reward_multiplier: 1.0
    };

    await this.saveModel();
    console.log('📊 Default model weights initialized');
  }

  async recordPrediction(prediction, actualOutcome, reward) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const predictionRecord = {
      id: prediction.gameId,
      timestamp: new Date().toISOString(),
      prediction: prediction.prediction,
      confidence: prediction.confidence,
      actualOutcome,
      reward,
      factors: prediction.factors || {},
      marketData: prediction.marketData || {}
    };

    this.performanceHistory.push(predictionRecord);
    this.metrics.totalPredictions++;

    // Update running average reward
    this.metrics.averageReward =
      (this.metrics.averageReward * (this.metrics.totalPredictions - 1) + reward) /
      this.metrics.totalPredictions;

    // Learn from this prediction
    await this.updateWeights(predictionRecord);

    // Save updated model periodically
    if (this.performanceHistory.length % 10 === 0) {
      await this.saveModel();
    }

    console.log(`🧠 Learned from prediction: ${prediction.gameId} (Reward: ${reward.toFixed(3)})`);
  }

  async updateWeights(predictionRecord) {
    const { reward, confidence, factors } = predictionRecord;

    // Calculate prediction accuracy
    const wasCorrect = this.isPredictionCorrect(predictionRecord);
    const accuracyReward = wasCorrect ? 1 : -1;

    // Combine reward with confidence calibration
    const confidenceError = Math.abs(confidence - (wasCorrect ? 1 : 0));
    const totalReward = reward + (accuracyReward * 0.1) - (confidenceError * 0.05);

    // Update weights based on factors that contributed to this prediction
    for (const [factor, impact] of Object.entries(factors)) {
      if (this.modelWeights[factor] !== undefined) {
        // Q-learning style update
        const oldWeight = this.modelWeights[factor];
        const learningSignal = totalReward * impact;

        // Update with learning rate and discount
        this.modelWeights[factor] += this.learningRate * learningSignal;

        // Bound weights between 0 and 1
        this.modelWeights[factor] = Math.max(0, Math.min(1, this.modelWeights[factor]));

        console.log(`⚖️ Updated ${factor}: ${oldWeight.toFixed(3)} → ${this.modelWeights[factor].toFixed(3)}`);
      }
    }

    // Update meta-parameters
    this.updateMetaParameters(totalReward, confidence);

    this.metrics.learningIterations++;
    this.metrics.lastUpdate = new Date().toISOString();
  }

  updateMetaParameters(reward, confidence) {
    // Adjust exploration rate based on performance
    if (reward > 0.5) {
      this.explorationRate = Math.max(0.05, this.explorationRate * 0.95); // Reduce exploration
    } else {
      this.explorationRate = Math.min(0.3, this.explorationRate * 1.05); // Increase exploration
    }

    // Adjust learning rate based on confidence
    if (confidence > 0.8) {
      this.learningRate *= 0.99; // Fine-tune when confident
    }

    // Update model accuracy estimate
    const recentPredictions = this.performanceHistory.slice(-50);
    const correctPredictions = recentPredictions.filter(p => this.isPredictionCorrect(p)).length;
    this.metrics.modelAccuracy = correctPredictions / recentPredictions.length;
  }

  isPredictionCorrect(predictionRecord) {
    const predicted = predictionRecord.prediction.toLowerCase();
    const actual = predictionRecord.actualOutcome.toLowerCase();

    return (predicted.includes('home') && actual.includes('home')) ||
           (predicted.includes('away') && actual.includes('away'));
  }

  calculateReward(predictionRecord) {
    const wasCorrect = this.isPredictionCorrect(predictionRecord);
    const confidence = predictionRecord.confidence;

    // Base reward for correctness
    let reward = wasCorrect ? 1 : -1;

    // Confidence calibration bonus/penalty
    if (wasCorrect && confidence > 0.8) {
      reward += 0.2; // Bonus for high confidence correct predictions
    } else if (!wasCorrect && confidence > 0.8) {
      reward -= 0.3; // Penalty for high confidence wrong predictions
    }

    // Market efficiency reward (if odds data available)
    if (predictionRecord.marketData?.odds) {
      const odds = predictionRecord.marketData.odds;
      const edge = this.calculateEdge(odds, confidence);
      reward += edge * 0.1; // Small bonus for finding value
    }

    return reward;
  }

  calculateEdge(odds, confidence) {
    // Simplified edge calculation
    const impliedProbability = 1 / odds;
    return (confidence - impliedProbability) / impliedProbability;
  }

  async getOptimizedWeights() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return { ...this.modelWeights };
  }

  async getPredictionFactors(gameData, marketData = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Calculate weighted factors for prediction
    const factors = {};

    // Home advantage
    factors.home_advantage = gameData.isHome ? this.modelWeights.home_advantage : 0;

    // Recent form (simplified)
    factors.recent_form = this.modelWeights.recent_form * (gameData.recentWins || 0.5);

    // Statistical factors
    factors.offensive_rating = this.modelWeights.offensive_rating *
      ((gameData.teamOffRating - gameData.oppDefRating) / 200);

    factors.defensive_rating = this.modelWeights.defensive_rating *
      ((gameData.oppOffRating - gameData.teamDefRating) / 200);

    // Situational factors
    factors.rest_advantage = this.modelWeights.rest_advantage * (gameData.restDays || 0) / 7;
    factors.injury_impact = this.modelWeights.injury_impact * (1 - (gameData.injuryFactor || 0));

    return factors;
  }

  async predictWithLearning(gameData, marketData = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const factors = await this.getPredictionFactors(gameData, marketData);

    // Calculate total prediction score
    let totalScore = 0;
    let totalWeight = 0;

    for (const [factor, value] of Object.entries(factors)) {
      const weight = this.modelWeights[factor] || 0.5;
      totalScore += value * weight;
      totalWeight += weight;
    }

    // Normalize score to get probability
    const probability = totalWeight > 0 ? (totalScore / totalWeight + 1) / 2 : 0.5;

    // Apply exploration vs exploitation
    let finalProbability = probability;
    if (Math.random() < this.explorationRate) {
      // Exploration: add some randomness
      finalProbability = Math.max(0.1, Math.min(0.9, probability + (Math.random() - 0.5) * 0.2));
    }

    return {
      probability: finalProbability,
      confidence: Math.min(1, Math.abs(finalProbability - 0.5) * 2),
      factors,
      explorationUsed: Math.random() < this.explorationRate
    };
  }

  async getLearningMetrics() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return {
      ...this.metrics,
      explorationRate: this.explorationRate,
      learningRate: this.learningRate,
      totalWeights: Object.keys(this.modelWeights).length,
      recentPerformance: this.getRecentPerformance()
    };
  }

  getRecentPerformance() {
    const recent = this.performanceHistory.slice(-20);
    const correct = recent.filter(p => this.isPredictionCorrect(p)).length;

    return {
      sampleSize: recent.length,
      accuracy: recent.length > 0 ? correct / recent.length : 0,
      averageReward: recent.length > 0 ?
        recent.reduce((sum, p) => sum + this.calculateReward(p), 0) / recent.length : 0
    };
  }

  async saveModel() {
    try {
      const modelData = {
        weights: this.modelWeights,
        metrics: this.metrics,
        performanceHistory: this.performanceHistory.slice(-100), // Keep last 100 predictions
        lastSaved: new Date().toISOString()
      };

      const modelFile = path.join(this.modelPath, 'reinforcement-model.json');
      await fs.writeFile(modelFile, JSON.stringify(modelData, null, 2));

      console.log('💾 Reinforcement learning model saved');

    } catch (error) {
      console.error('Failed to save model:', error.message);
    }
  }

  async loadModel() {
    try {
      const modelFile = path.join(this.modelPath, 'reinforcement-model.json');

      const data = await fs.readFile(modelFile, 'utf8');
      const modelData = JSON.parse(data);

      this.modelWeights = modelData.weights || {};
      this.metrics = modelData.metrics || this.metrics;
      this.performanceHistory = modelData.performanceHistory || [];

      console.log('📚 Reinforcement learning model loaded');

    } catch (error) {
      console.log('No existing model found, will create new one');
    }
  }

  async resetLearning() {
    console.log('🔄 Resetting reinforcement learning model...');

    this.modelWeights = {};
    this.performanceHistory = [];
    this.metrics = {
      totalPredictions: 0,
      learningIterations: 0,
      averageReward: 0,
      modelAccuracy: 0,
      lastUpdate: null
    };

    await this.initializeDefaultWeights();
    console.log('✅ Learning model reset to defaults');
  }

  async exportModel() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return {
      weights: this.modelWeights,
      metrics: this.metrics,
      performanceSummary: this.getRecentPerformance(),
      exportDate: new Date().toISOString()
    };
  }
}

module.exports = ReinforcementLearner;
