// Mirror - Learning Command
// Phase 9: Continuous Evolution

const ReinforcementLearner = require('../core/ReinforcementLearner');

class LearnCommand {
  constructor() {
    this.reinforcementLearner = null;
  }

  async run(options) {
    console.log('🧠 Mirror Learning System - Phase 9: Continuous Evolution');

    try {
      // Initialize reinforcement learner
      this.reinforcementLearner = new ReinforcementLearner();

      if (options.reset) {
        // Reset learning model
        await this.reinforcementLearner.resetLearning();
        console.log('🔄 Learning model has been reset');

      } else if (options.metrics) {
        // Show learning metrics
        await this.showLearningMetrics();

      } else if (options.weights) {
        // Show current model weights
        await this.showModelWeights();

      } else if (options.export) {
        // Export learning model
        await this.exportModel();

      } else if (options.test) {
        // Test learning predictions
        await this.testLearningPredictions(options.test);

      } else {
        // Default: Show learning status
        await this.showLearningStatus();
      }

    } catch (error) {
      console.error('❌ Learning command failed:', error.message);
      throw error;
    }
  }

  async showLearningStatus() {
    console.log('📊 Learning System Status');
    console.log('═'.repeat(40));

    try {
      await this.reinforcementLearner.initialize();
      const metrics = await this.reinforcementLearner.getLearningMetrics();

      console.log(`Total Predictions: ${metrics.totalPredictions}`);
      console.log(`Learning Iterations: ${metrics.learningIterations}`);
      console.log(`Average Reward: ${metrics.averageReward.toFixed(3)}`);
      console.log(`Model Accuracy: ${(metrics.modelAccuracy * 100).toFixed(1)}%`);
      console.log(`Learning Rate: ${metrics.learningRate.toFixed(4)}`);
      console.log(`Exploration Rate: ${(metrics.explorationRate * 100).toFixed(1)}%`);
      console.log(`Model Weights: ${metrics.totalWeights}`);

      if (metrics.lastUpdate) {
        console.log(`Last Update: ${new Date(metrics.lastUpdate).toLocaleString()}`);
      }

      console.log('\n📈 Recent Performance:');
      const recent = metrics.recentPerformance;
      console.log(`Sample Size: ${recent.sampleSize}`);
      console.log(`Recent Accuracy: ${(recent.accuracy * 100).toFixed(1)}%`);
      console.log(`Average Reward: ${recent.averageReward.toFixed(3)}`);

      // Learning recommendations
      this.showLearningRecommendations(metrics);

    } catch (error) {
      console.log('❌ Failed to load learning status:', error.message);
    }
  }

  async showLearningMetrics() {
    console.log('📈 Detailed Learning Metrics');
    console.log('═'.repeat(50));

    try {
      await this.reinforcementLearner.initialize();
      const metrics = await this.reinforcementLearner.getLearningMetrics();

      console.log('Performance Metrics:');
      console.log(`  • Total Predictions Analyzed: ${metrics.totalPredictions}`);
      console.log(`  • Learning Iterations: ${metrics.learningIterations}`);
      console.log(`  • Average Reward: ${metrics.averageReward.toFixed(4)}`);
      console.log(`  • Model Accuracy: ${(metrics.modelAccuracy * 100).toFixed(2)}%`);

      console.log('\nLearning Parameters:');
      console.log(`  • Learning Rate: ${metrics.learningRate.toFixed(4)}`);
      console.log(`  • Exploration Rate: ${(metrics.explorationRate * 100).toFixed(2)}%`);
      console.log(`  • Discount Factor: ${this.reinforcementLearner.discountFactor}`);

      console.log('\nModel Statistics:');
      console.log(`  • Total Weights: ${metrics.totalWeights}`);
      console.log(`  • Last Update: ${metrics.lastUpdate || 'Never'}`);

      // Performance trends
      if (metrics.totalPredictions > 10) {
        console.log('\n📊 Performance Trends:');
        const history = this.reinforcementLearner.performanceHistory;
        const last10 = history.slice(-10);
        const last50 = history.slice(-50);

        const accuracy10 = last10.filter(p => this.reinforcementLearner.isPredictionCorrect(p)).length / last10.length;
        const accuracy50 = last50.filter(p => this.reinforcementLearner.isPredictionCorrect(p)).length / last50.length;

        console.log(`  • Last 10 Predictions: ${(accuracy10 * 100).toFixed(1)}%`);
        console.log(`  • Last 50 Predictions: ${(accuracy50 * 100).toFixed(1)}%`);

        const trend = accuracy10 > accuracy50 ? '📈 Improving' : accuracy10 < accuracy50 ? '📉 Declining' : '➡️ Stable';
        console.log(`  • Trend: ${trend}`);
      }

    } catch (error) {
      console.log('❌ Failed to load detailed metrics:', error.message);
    }
  }

  async showModelWeights() {
    console.log('⚖️ Current Model Weights');
    console.log('═'.repeat(40));

    try {
      await this.reinforcementLearner.initialize();
      const weights = await this.reinforcementLearner.getOptimizedWeights();

      // Group weights by category
      const categories = {
        'Team Performance': ['home_advantage', 'recent_form', 'head_to_head'],
        'Statistical Factors': ['offensive_rating', 'defensive_rating', 'pace_factor', 'efficiency_diff'],
        'Situational Factors': ['rest_advantage', 'travel_distance', 'altitude_factor'],
        'Matchup Factors': ['injury_impact', 'matchup_rating'],
        'Market Factors': ['line_movement', 'public_money'],
        'Meta Parameters': ['base_confidence', 'risk_threshold', 'reward_multiplier']
      };

      for (const [category, factors] of Object.entries(categories)) {
        console.log(`\n${category}:`);
        factors.forEach(factor => {
          if (weights[factor] !== undefined) {
            const weight = weights[factor];
            const bars = '█'.repeat(Math.round(weight * 20));
            console.log(`  ${factor.padEnd(20)}: ${weight.toFixed(3)} ${bars}`);
          }
        });
      }

      console.log('\n💡 Higher weights = More influential factors');

    } catch (error) {
      console.log('❌ Failed to load model weights:', error.message);
    }
  }

  async exportModel() {
    console.log('📤 Exporting Learning Model');
    console.log('═'.repeat(30));

    try {
      await this.reinforcementLearner.initialize();
      const modelData = await this.reinforcementLearner.exportModel();

      const exportFile = `learning-model-export-${Date.now()}.json`;
      const fs = require('fs').promises;
      const path = require('path');

      const exportPath = path.join(process.cwd(), 'data', exportFile);
      await fs.mkdir(path.dirname(exportPath), { recursive: true });
      await fs.writeFile(exportPath, JSON.stringify(modelData, null, 2));

      console.log(`✅ Model exported to: ${exportPath}`);
      console.log(`📊 Export includes:`);
      console.log(`   • ${Object.keys(modelData.weights).length} weights`);
      console.log(`   • Performance metrics`);
      console.log(`   • Recent predictions history`);
      console.log(`   • Export timestamp: ${modelData.exportDate}`);

    } catch (error) {
      console.log('❌ Failed to export model:', error.message);
    }
  }

  async testLearningPredictions(testCount = 5) {
    console.log(`🧪 Testing Learning Predictions (${testCount} samples)`);
    console.log('═'.repeat(50));

    try {
      await this.reinforcementLearner.initialize();

      // Generate test game data
      const testGames = this.generateTestGames(testCount);

      console.log('Testing predictions with current learning model:\n');

      for (const game of testGames) {
        const prediction = await this.reinforcementLearner.predictWithLearning(game);

        console.log(`🏀 ${game.homeTeam} vs ${game.awayTeam}`);
        console.log(`   Probability: ${(prediction.probability * 100).toFixed(1)}%`);
        console.log(`   Confidence: ${(prediction.confidence * 100).toFixed(1)}%`);
        console.log(`   Exploration: ${prediction.explorationUsed ? 'Yes' : 'No'}`);

        // Show top contributing factors
        const sortedFactors = Object.entries(prediction.factors)
          .sort(([,a], [,b]) => Math.abs(b) - Math.abs(a))
          .slice(0, 3);

        console.log('   Key Factors:');
        sortedFactors.forEach(([factor, value]) => {
          console.log(`     ${factor}: ${(value * 100).toFixed(1)}%`);
        });

        console.log('');
      }

      console.log('💡 Test complete - Learning model is functioning');

    } catch (error) {
      console.log('❌ Failed to test learning predictions:', error.message);
    }
  }

  generateTestGames(count) {
    const teams = [
      'Lakers', 'Celtics', 'Warriors', 'Heat', 'Bucks',
      'Suns', 'Nuggets', '76ers', 'Clippers', 'Nets'
    ];

    const games = [];
    for (let i = 0; i < count; i++) {
      const homeTeam = teams[Math.floor(Math.random() * teams.length)];
      let awayTeam;
      do {
        awayTeam = teams[Math.floor(Math.random() * teams.length)];
      } while (awayTeam === homeTeam);

      games.push({
        homeTeam,
        awayTeam,
        league: 'NBA',
        isHome: true,
        recentWins: Math.random(),
        teamOffRating: 100 + Math.random() * 20,
        teamDefRating: 100 + Math.random() * 20,
        oppOffRating: 100 + Math.random() * 20,
        oppDefRating: 100 + Math.random() * 20,
        restDays: Math.floor(Math.random() * 7),
        injuryFactor: Math.random() * 0.5
      });
    }

    return games;
  }

  showLearningRecommendations(metrics) {
    console.log('\n💡 Learning Recommendations:');

    if (metrics.totalPredictions < 50) {
      console.log('   📚 Need more predictions for meaningful learning');
      console.log('   💡 Run predictions and record outcomes to build learning data');
    }

    if (metrics.explorationRate > 0.2) {
      console.log('   🎲 High exploration rate - model is still learning');
      console.log('   💡 Consider reducing exploration as model matures');
    }

    if (metrics.modelAccuracy > 0.7) {
      console.log('   🎯 Model showing good accuracy - learning is effective');
    } else if (metrics.modelAccuracy < 0.5) {
      console.log('   ⚠️ Model accuracy below baseline - may need adjustments');
    }

    if (metrics.learningIterations > 100) {
      console.log('   🧠 Model has learned from many predictions');
      console.log('   💡 Consider fine-tuning learning parameters');
    }
  }

  async getLearningHistory() {
    if (!this.reinforcementLearner) return [];

    try {
      await this.reinforcementLearner.initialize();
      return this.reinforcementLearner.performanceHistory || [];
    } catch (error) {
      console.error('Failed to get learning history:', error.message);
      return [];
    }
  }

  async getModelWeights() {
    if (!this.reinforcementLearner) return {};

    try {
      await this.reinforcementLearner.initialize();
      return await this.reinforcementLearner.getOptimizedWeights();
    } catch (error) {
      console.error('Failed to get model weights:', error.message);
      return {};
    }
  }
}

module.exports = new LearnCommand();
