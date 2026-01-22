// Mirror - Backtesting Engine
// Phase 7: Testing & Validation

const fs = require('fs').promises;
const path = require('path');
const { PerformanceMonitor } = require('./PerformanceMonitor');

class BacktestingEngine {
  constructor(options = {}) {
    this.historicalDataPath = options.historicalDataPath || path.join(process.cwd(), 'data', 'historical');
    this.resultsPath = options.resultsPath || path.join(process.cwd(), 'data', 'backtests');
    this.minSampleSize = options.minSampleSize || 100;
    this.confidenceLevel = options.confidenceLevel || 0.95; // 95% confidence
    this.performanceMonitor = new PerformanceMonitor();

    // Backtesting state
    this.testResults = [];
    this.historicalData = [];
    this.performanceHistory = [];
  }

  async initialize() {
    // Create directories
    await fs.mkdir(this.historicalDataPath, { recursive: true });
    await fs.mkdir(this.resultsPath, { recursive: true });

    // Load existing historical data
    await this.loadHistoricalData();

    console.log('📊 Backtesting Engine initialized');
  }

  async loadHistoricalData() {
    try {
      const files = await fs.readdir(this.historicalDataPath);
      const dataFiles = files.filter(f => f.endsWith('.json'));

      for (const file of dataFiles) {
        const filePath = path.join(this.historicalDataPath, file);
        const data = await fs.readFile(filePath, 'utf8');
        const records = JSON.parse(data);

        if (Array.isArray(records)) {
          this.historicalData.push(...records);
        }
      }

      console.log(`📚 Loaded ${this.historicalData.length} historical records`);
    } catch (error) {
      console.warn('⚠️ Could not load historical data:', error.message);
    }
  }

  async runBacktest(testConfig) {
    const {
      name,
      description,
      startDate,
      endDate,
      predictionEngine,
      confidenceThreshold = 0.7,
      stakeStrategy = 'fixed',
      stakeAmount = 10,
      maxPredictions = null,
      leagues = null
    } = testConfig;

    console.log(`🧪 Starting backtest: ${name}`);
    console.log(`📅 Period: ${startDate} to ${endDate}`);
    console.log(`🎯 Confidence threshold: ${(confidenceThreshold * 100).toFixed(1)}%`);

    const testId = `backtest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    try {
      // Filter historical data
      const testData = this.filterHistoricalData(startDate, endDate, leagues);

      if (testData.length < this.minSampleSize) {
        throw new Error(`Insufficient data: ${testData.length} records (minimum: ${this.minSampleSize})`);
      }

      console.log(`📊 Testing on ${testData.length} historical games`);

      // Run predictions through historical data
      const predictions = [];
      let processedCount = 0;

      for (const game of testData) {
        if (maxPredictions && processedCount >= maxPredictions) break;

        try {
          // Convert historical game to current format
          const gameData = this.convertHistoricalGame(game);

          // Generate prediction using current engine
          const predictionResult = await predictionEngine.predictGames([gameData]);

          if (predictionResult.predictions.length > 0) {
            const prediction = predictionResult.predictions[0];

            // Apply confidence filter
            if (prediction.confidence >= confidenceThreshold) {
              // Add historical outcome
              prediction.actualOutcome = game.actualOutcome || game.result;
              prediction.actualScore = game.actualScore;

              // Calculate stake
              prediction.stake = this.calculateStake(prediction, stakeStrategy, stakeAmount);

              // Calculate profit/loss
              prediction.profit = this.calculateProfit(prediction);

              predictions.push(prediction);
              processedCount++;
            }
          }

          // Progress indicator
          if (processedCount % 100 === 0) {
            console.log(`📈 Processed ${processedCount} predictions...`);
          }

        } catch (error) {
          console.warn(`⚠️ Failed to process game ${game.id}:`, error.message);
        }
      }

      // Calculate results
      const results = this.calculateBacktestResults(predictions, testConfig);

      // Generate statistical analysis
      const statistics = this.performStatisticalAnalysis(predictions, results);

      // Create comprehensive report
      const report = {
        testId,
        name,
        description,
        config: testConfig,
        execution: {
          startTime,
          endTime: Date.now(),
          duration: Date.now() - startTime,
          dataPoints: testData.length,
          predictionsGenerated: predictions.length
        },
        results,
        statistics,
        predictions: predictions.slice(0, 100), // Sample predictions
        recommendations: this.generateRecommendations(results, statistics)
      };

      // Save results
      await this.saveBacktestResults(report);

      console.log(`✅ Backtest completed: ${results.winRate.toFixed(1)}% win rate, ${results.totalProfit.toFixed(2)} profit`);

      return report;

    } catch (error) {
      console.error('❌ Backtest failed:', error.message);
      throw error;
    }
  }

  filterHistoricalData(startDate, endDate, leagues = null) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    return this.historicalData.filter(game => {
      const gameDate = new Date(game.date);

      // Date filter
      if (gameDate < start || gameDate > end) return false;

      // League filter
      if (leagues && !leagues.includes(game.league)) return false;

      // Must have outcome data
      if (!game.actualOutcome && !game.result) return false;

      return true;
    });
  }

  convertHistoricalGame(historicalGame) {
    // Convert historical data format to current game format
    return {
      id: historicalGame.id || `hist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      homeTeam: historicalGame.homeTeam,
      awayTeam: historicalGame.awayTeam,
      league: historicalGame.league,
      date: historicalGame.date,
      time: historicalGame.time || '00:00',
      status: 'completed'
    };
  }

  calculateStake(prediction, strategy, baseAmount) {
    switch (strategy) {
      case 'kelly':
        // Simplified Kelly Criterion
        if (prediction.confidence > 0.5) {
          const b = 1.0; // Assume even money for simplicity
          const p = prediction.confidence;
          const q = 1 - p;
          const kellyFraction = (b * p - q) / b;
          return Math.max(0, Math.min(kellyFraction * baseAmount, baseAmount));
        }
        return 0;

      case 'percentage':
        // Confidence-based percentage
        return baseAmount * prediction.confidence;

      case 'fixed':
      default:
        return baseAmount;
    }
  }

  calculateProfit(prediction) {
    const { prediction: predicted, actualOutcome, stake } = prediction;

    if (!actualOutcome) return 0;

    // Normalize outcomes
    const normalizedPrediction = predicted.toLowerCase().includes('home') ? 'home' : 'away';
    const normalizedActual = actualOutcome.toLowerCase().includes('home') ? 'home' : 'away';

    if (normalizedPrediction === normalizedActual) {
      // Win - assume even money payout
      return stake * 1.0; // Stake back + stake profit
    } else {
      // Loss
      return -stake;
    }
  }

  calculateBacktestResults(predictions, config) {
    if (predictions.length === 0) {
      return {
        totalPredictions: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        totalStaked: 0,
        totalProfit: 0,
        roi: 0,
        profitFactor: 0
      };
    }

    const wins = predictions.filter(p => p.profit > 0).length;
    const losses = predictions.filter(p => p.profit < 0).length;
    const winRate = (wins / predictions.length) * 100;

    const totalStaked = predictions.reduce((sum, p) => sum + (p.stake || 0), 0);
    const totalProfit = predictions.reduce((sum, p) => sum + (p.profit || 0), 0);
    const roi = totalStaked > 0 ? (totalProfit / totalStaked) * 100 : 0;

    const grossProfit = predictions.filter(p => p.profit > 0).reduce((sum, p) => sum + p.profit, 0);
    const grossLoss = Math.abs(predictions.filter(p => p.profit < 0).reduce((sum, p) => sum + p.profit, 0));
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;

    return {
      totalPredictions: predictions.length,
      wins,
      losses,
      winRate,
      totalStaked,
      totalProfit,
      roi,
      profitFactor,
      averageStake: totalStaked / predictions.length,
      averageProfit: totalProfit / predictions.length,
      maxWin: Math.max(...predictions.map(p => p.profit)),
      maxLoss: Math.min(...predictions.map(p => p.profit)),
      confidence: {
        average: predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length,
        min: Math.min(...predictions.map(p => p.confidence)),
        max: Math.max(...predictions.map(p => p.confidence))
      }
    };
  }

  performStatisticalAnalysis(predictions, results) {
    const statistics = {
      confidenceIntervals: {},
      statisticalTests: {},
      riskMetrics: {},
      performanceMetrics: {}
    };

    // Confidence intervals for win rate
    const winRateCI = this.calculateConfidenceInterval(
      results.wins,
      results.totalPredictions,
      this.confidenceLevel
    );

    statistics.confidenceIntervals.winRate = {
      estimate: results.winRate,
      lower: winRateCI.lower * 100,
      upper: winRateCI.upper * 100,
      confidence: this.confidenceLevel
    };

    // ROI confidence interval
    const roiCI = this.calculateConfidenceInterval(
      results.totalProfit,
      results.totalStaked,
      this.confidenceLevel
    );

    statistics.confidenceIntervals.roi = {
      estimate: results.roi,
      lower: roiCI.lower * 100,
      upper: roiCI.upper * 100,
      confidence: this.confidenceLevel
    };

    // Statistical tests
    statistics.statisticalTests = {
      winRateSignificance: this.testWinRateSignificance(results),
      roiSignificance: this.testROISignificance(results),
      confidenceCalibration: this.testConfidenceCalibration(predictions)
    };

    // Risk metrics
    statistics.riskMetrics = {
      sharpeRatio: this.calculateSharpeRatio(predictions),
      maximumDrawdown: this.calculateMaximumDrawdown(predictions),
      winLossRatio: results.losses > 0 ? results.wins / results.losses : results.wins,
      consecutiveLosses: this.calculateMaxConsecutiveLosses(predictions)
    };

    // Performance metrics
    statistics.performanceMetrics = {
      monthlyReturns: this.calculateMonthlyReturns(predictions),
      bestMonth: 0,
      worstMonth: 0,
      volatility: this.calculateVolatility(predictions),
      expectancy: results.totalProfit / results.totalPredictions
    };

    return statistics;
  }

  calculateConfidenceInterval(successes, trials, confidence) {
    const p = successes / trials;
    const z = confidence === 0.95 ? 1.96 : 1.645; // z-score for confidence level
    const se = Math.sqrt(p * (1 - p) / trials);

    return {
      lower: Math.max(0, p - z * se),
      upper: Math.min(1, p + z * se)
    };
  }

  testWinRateSignificance(results) {
    // Test if win rate is significantly above 50%
    const p = 0.5; // Null hypothesis: 50% win rate
    const n = results.totalPredictions;
    const observed = results.wins;

    const expected = n * p;
    const variance = n * p * (1 - p);
    const stdDev = Math.sqrt(variance);

    const zScore = (observed - expected) / stdDev;
    const pValue = this.calculatePValue(zScore);

    return {
      nullHypothesis: 'Win rate = 50%',
      alternativeHypothesis: 'Win rate > 50%',
      zScore,
      pValue,
      significant: pValue < 0.05,
      effectSize: (results.winRate - 50) / 50 // Percentage above random
    };
  }

  testROISignificance(results) {
    // Test if ROI is significantly above 0%
    const roi = results.roi / 100; // Convert to decimal
    const se = Math.sqrt(1 / results.totalPredictions); // Simplified SE calculation

    const tStatistic = roi / se;
    const pValue = this.calculatePValue(tStatistic);

    return {
      nullHypothesis: 'ROI = 0%',
      alternativeHypothesis: 'ROI > 0%',
      tStatistic,
      pValue,
      significant: pValue < 0.05,
      effectSize: roi
    };
  }

  testConfidenceCalibration(predictions) {
    // Test if confidence levels match actual outcomes
    const bins = [0.5, 0.6, 0.7, 0.8, 0.9, 1.0];
    const calibration = {};

    bins.forEach((bin, index) => {
      const nextBin = bins[index + 1] || 1.1;
      const binPredictions = predictions.filter(p =>
        p.confidence >= bin && p.confidence < nextBin
      );

      if (binPredictions.length > 0) {
        const actualWinRate = binPredictions.filter(p => p.profit > 0).length / binPredictions.length;
        const expectedWinRate = (bin + nextBin) / 2;

        calibration[`${bin}-${nextBin}`] = {
          expected: expectedWinRate,
          actual: actualWinRate,
          difference: actualWinRate - expectedWinRate,
          sampleSize: binPredictions.length
        };
      }
    });

    return calibration;
  }

  calculateSharpeRatio(predictions) {
    // Simplified Sharpe ratio calculation
    const returns = predictions.map(p => p.profit / (p.stake || 1));
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const volatility = Math.sqrt(
      returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
    );

    return volatility > 0 ? avgReturn / volatility : 0;
  }

  calculateMaximumDrawdown(predictions) {
    let peak = 0;
    let maxDrawdown = 0;
    let runningTotal = 0;

    for (const prediction of predictions) {
      runningTotal += prediction.profit;

      if (runningTotal > peak) {
        peak = runningTotal;
      }

      const drawdown = peak - runningTotal;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    return maxDrawdown;
  }

  calculateMaxConsecutiveLosses(predictions) {
    let maxConsecutive = 0;
    let currentConsecutive = 0;

    for (const prediction of predictions) {
      if (prediction.profit < 0) {
        currentConsecutive++;
        maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
      } else {
        currentConsecutive = 0;
      }
    }

    return maxConsecutive;
  }

  calculateMonthlyReturns(predictions) {
    // Group predictions by month
    const monthlyGroups = {};

    predictions.forEach(prediction => {
      const date = new Date(prediction.timestamp || Date.now());
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyGroups[monthKey]) {
        monthlyGroups[monthKey] = [];
      }

      monthlyGroups[monthKey].push(prediction);
    });

    const monthlyReturns = {};

    for (const [month, monthPredictions] of Object.entries(monthlyGroups)) {
      const monthProfit = monthPredictions.reduce((sum, p) => sum + p.profit, 0);
      const monthStaked = monthPredictions.reduce((sum, p) => sum + (p.stake || 0), 0);

      monthlyReturns[month] = monthStaked > 0 ? (monthProfit / monthStaked) * 100 : 0;
    }

    return monthlyReturns;
  }

  calculateVolatility(predictions) {
    const returns = predictions.map(p => p.profit / (p.stake || 1));
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;

    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    return Math.sqrt(variance);
  }

  calculatePValue(zScore) {
    // Simplified p-value calculation using normal distribution approximation
    // For two-tailed test, use absolute value
    const absZ = Math.abs(zScore);

    // Using approximation: p = 1 - Φ(z) where Φ is CDF of standard normal
    // This is a simplified version
    if (absZ < 1.96) return 0.05; // Roughly 5% significance
    if (absZ < 2.58) return 0.01; // Roughly 1% significance
    return 0.001; // Highly significant
  }

  generateRecommendations(results, statistics) {
    const recommendations = [];

    // Win rate recommendations
    if (results.winRate < 60) {
      recommendations.push({
        type: 'model_improvement',
        priority: 'high',
        message: 'Win rate below target. Consider increasing confidence threshold or improving model accuracy.',
        metric: 'winRate',
        current: results.winRate,
        target: 80
      });
    }

    // Risk recommendations
    if (statistics.riskMetrics.maximumDrawdown > results.totalStaked * 0.2) {
      recommendations.push({
        type: 'risk_management',
        priority: 'high',
        message: 'High drawdown detected. Consider implementing stricter risk controls.',
        metric: 'maxDrawdown',
        current: statistics.riskMetrics.maximumDrawdown,
        threshold: results.totalStaked * 0.2
      });
    }

    // Confidence calibration
    const calibrationIssues = Object.values(statistics.statisticalTests.confidenceCalibration)
      .filter(cal => Math.abs(cal.difference) > 0.1);

    if (calibrationIssues.length > 0) {
      recommendations.push({
        type: 'calibration',
        priority: 'medium',
        message: 'Confidence levels may not be well-calibrated. Consider recalibrating prediction confidence.',
        issues: calibrationIssues.length
      });
    }

    // Statistical significance
    if (!statistics.statisticalTests.winRateSignificance.significant) {
      recommendations.push({
        type: 'sample_size',
        priority: 'medium',
        message: 'Results not statistically significant. Consider increasing sample size.',
        current: results.totalPredictions,
        minimum: this.minSampleSize
      });
    }

    return recommendations;
  }

  async saveBacktestResults(report) {
    try {
      const filename = `backtest-${report.testId}.json`;
      const filepath = path.join(this.resultsPath, filename);

      await fs.mkdir(path.dirname(filepath), { recursive: true });
      await fs.writeFile(filepath, JSON.stringify(report, null, 2));

      console.log(`💾 Backtest results saved: ${filepath}`);
      return filepath;

    } catch (error) {
      console.error('Failed to save backtest results:', error.message);
    }
  }

  async loadBacktestResults(testId) {
    try {
      const filename = `backtest-${testId}.json`;
      const filepath = path.join(this.resultsPath, filename);

      const data = await fs.readFile(filepath, 'utf8');
      return JSON.parse(data);

    } catch (error) {
      console.error('Failed to load backtest results:', error.message);
      return null;
    }
  }

  async compareBacktests(testIds) {
    const results = [];

    for (const testId of testIds) {
      const result = await this.loadBacktestResults(testId);
      if (result) {
        results.push(result);
      }
    }

    if (results.length < 2) {
      throw new Error('Need at least 2 backtest results to compare');
    }

    // Perform statistical comparison
    const comparison = {
      tests: results.map(r => ({
        id: r.testId,
        name: r.name,
        winRate: r.results.winRate,
        roi: r.results.roi,
        totalPredictions: r.results.totalPredictions
      })),
      statisticalComparison: this.performStatisticalComparison(results),
      recommendations: this.generateComparisonRecommendations(results)
    };

    return comparison;
  }

  performStatisticalComparison(results) {
    // Compare win rates statistically
    const winRates = results.map(r => r.results.winRate);
    const sampleSizes = results.map(r => r.results.totalPredictions);

    // Calculate if differences are statistically significant
    // This is a simplified version
    const bestWinRate = Math.max(...winRates);
    const worstWinRate = Math.min(...winRates);
    const difference = bestWinRate - worstWinRate;

    return {
      bestPerforming: results[winRates.indexOf(bestWinRate)].name,
      worstPerforming: results[winRates.indexOf(worstWinRate)].name,
      winRateDifference: difference,
      statisticallySignificant: difference > 5, // Simplified threshold
      sampleSizes
    };
  }

  generateComparisonRecommendations(results) {
    const recommendations = [];

    const winRates = results.map(r => r.results.winRate);
    const bestIndex = winRates.indexOf(Math.max(...winRates));
    const bestTest = results[bestIndex];

    recommendations.push({
      type: 'best_practice',
      message: `Adopt configuration from "${bestTest.name}" (${bestTest.results.winRate.toFixed(1)}% win rate)`,
      testId: bestTest.testId
    });

    // Identify configuration differences that led to better performance
    const bestConfig = bestTest.config;
    const otherResults = results.filter(r => r.testId !== bestTest.testId);

    otherResults.forEach(result => {
      const differences = this.identifyConfigDifferences(bestConfig, result.config);
      if (differences.length > 0) {
        recommendations.push({
          type: 'configuration',
          message: `Consider these configuration changes from ${result.name}: ${differences.join(', ')}`,
          differences
        });
      }
    });

    return recommendations;
  }

  identifyConfigDifferences(config1, config2) {
    const differences = [];

    // Compare key configuration parameters
    if (config1.confidenceThreshold !== config2.confidenceThreshold) {
      differences.push(`confidence threshold ${config1.confidenceThreshold} vs ${config2.confidenceThreshold}`);
    }

    if (config1.stakeStrategy !== config2.stakeStrategy) {
      differences.push(`stake strategy ${config1.stakeStrategy} vs ${config2.stakeStrategy}`);
    }

    return differences;
  }

  // Validation methods
  async validatePredictionAccuracy(predictionEngine, validationData) {
    console.log('🔍 Validating prediction accuracy...');

    const validations = [];

    for (const data of validationData.slice(0, 100)) { // Limit for performance
      try {
        const gameData = this.convertHistoricalGame(data);
        const result = await predictionEngine.predictGames([gameData]);

        if (result.predictions.length > 0) {
          const prediction = result.predictions[0];
          const actual = data.actualOutcome || data.result;

          const correct = this.isPredictionCorrect(prediction, actual);

          validations.push({
            gameId: data.id,
            prediction: prediction.prediction,
            confidence: prediction.confidence,
            actual: actual,
            correct,
            error: Math.abs(prediction.confidence - (correct ? 1 : 0))
          });
        }

      } catch (error) {
        console.warn(`⚠️ Validation failed for game ${data.id}:`, error.message);
      }
    }

    const accuracy = validations.filter(v => v.correct).length / validations.length;
    const avgConfidence = validations.reduce((sum, v) => sum + v.confidence, 0) / validations.length;
    const calibrationError = validations.reduce((sum, v) => sum + v.error, 0) / validations.length;

    return {
      totalValidations: validations.length,
      accuracy,
      averageConfidence: avgConfidence,
      calibrationError,
      validations
    };
  }

  isPredictionCorrect(prediction, actual) {
    const predNormalized = prediction.prediction.toLowerCase();
    const actualNormalized = actual.toLowerCase();

    return (predNormalized.includes('home') && actualNormalized.includes('home')) ||
           (predNormalized.includes('away') && actualNormalized.includes('away'));
  }

  // Utility methods
  async generateReport(options = {}) {
    const { format = 'json', includeDetails = false } = options;

    const report = {
      generatedAt: new Date().toISOString(),
      summary: {
        totalBacktests: this.testResults.length,
        totalHistoricalData: this.historicalData.length,
        averageWinRate: this.calculateAverageWinRate(),
        bestWinRate: this.findBestWinRate()
      },
      recentTests: this.testResults.slice(-5),
      systemHealth: await this.performanceMonitor.getHealthStatus()
    };

    if (includeDetails) {
      report.detailedResults = this.testResults;
    }

    if (format === 'text') {
      return this.formatTextReport(report);
    }

    return report;
  }

  calculateAverageWinRate() {
    if (this.testResults.length === 0) return 0;

    const totalWinRate = this.testResults.reduce((sum, test) => sum + test.results.winRate, 0);
    return totalWinRate / this.testResults.length;
  }

  findBestWinRate() {
    if (this.testResults.length === 0) return 0;

    return Math.max(...this.testResults.map(test => test.results.winRate));
  }

  formatTextReport(report) {
    let text = `Backtesting Report\n`;
    text += `Generated: ${report.generatedAt}\n\n`;

    text += `Summary:\n`;
    text += `- Total Backtests: ${report.summary.totalBacktests}\n`;
    text += `- Historical Data Points: ${report.summary.totalHistoricalData}\n`;
    text += `- Average Win Rate: ${report.summary.averageWinRate.toFixed(1)}%\n`;
    text += `- Best Win Rate: ${report.summary.bestWinRate.toFixed(1)}%\n\n`;

    text += `Recent Tests:\n`;
    report.recentTests.forEach(test => {
      text += `- ${test.name}: ${test.results.winRate.toFixed(1)}% win rate, $${test.results.totalProfit.toFixed(2)} profit\n`;
    });

    return text;
  }
}

module.exports = BacktestingEngine;
