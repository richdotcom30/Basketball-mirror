// Mirror - Backtesting Command
// Phase 7: Testing & Validation

const BacktestingEngine = require('../core/BacktestingEngine');
const PredictionEngine = require('../core/PredictionEngine');
const ora = require('ora');

class BacktestCommand {
  constructor() {
    this.backtestingEngine = null;
    this.predictionEngine = null;
  }

  async run(options) {
    console.log('🧪 Mirror Backtesting - Phase 7: Testing & Validation');

    try {
      // Initialize engines
      this.backtestingEngine = new BacktestingEngine();
      await this.backtestingEngine.initialize();

      this.predictionEngine = new PredictionEngine();

      if (options.list) {
        // List available backtests
        await this.listBacktests();
      } else if (options.compare) {
        // Compare multiple backtests
        await this.compareBacktests(options.compare.split(','));
      } else if (options.report) {
        // Generate comprehensive report
        await this.generateReport(options.report);
      } else {
        // Run a new backtest
        await this.runNewBacktest(options);
      }

    } catch (error) {
      console.error('❌ Backtesting failed:', error.message);

      if (error.message.includes('OPENROUTER_API_KEY')) {
        console.log('💡 Setup needed: Configure your OpenRouter API key');
        console.log('   Visit: https://openrouter.ai/');
      } else if (error.message.includes('Insufficient data')) {
        console.log('💡 Need more historical data: Run scraping commands first');
        console.log('   Use: mirror scrape --sources all --parallel 10');
      }

      throw error;
    }
  }

  async runNewBacktest(options) {
    const testConfig = {
      name: options.name || `Backtest ${new Date().toISOString().split('T')[0]}`,
      description: options.description || 'Automated backtesting run',
      startDate: options.start || '2023-01-01',
      endDate: options.end || new Date().toISOString().split('T')[0],
      predictionEngine: this.predictionEngine,
      confidenceThreshold: parseFloat(options.confidence || 0.7),
      stakeStrategy: options.strategy || 'fixed',
      stakeAmount: parseFloat(options.stake || 10),
      maxPredictions: options.max ? parseInt(options.max) : null,
      leagues: options.leagues ? options.leagues.split(',') : null
    };

    console.log(`📊 Backtest Configuration:`);
    console.log(`   Name: ${testConfig.name}`);
    console.log(`   Period: ${testConfig.startDate} to ${testConfig.endDate}`);
    console.log(`   Confidence: ${(testConfig.confidenceThreshold * 100).toFixed(1)}%`);
    console.log(`   Stake: ${testConfig.stakeAmount} (${testConfig.stakeStrategy})`);
    if (testConfig.leagues) {
      console.log(`   Leagues: ${testConfig.leagues.join(', ')}`);
    }
    console.log('');

    const spinner = ora('🧪 Running backtest analysis...').start();

    try {
      const report = await this.backtestingEngine.runBacktest(testConfig);

      spinner.succeed('✅ Backtest completed successfully');

      // Display comprehensive results
      this.displayBacktestResults(report);

      // Save to test results
      this.backtestingEngine.testResults.push(report);

      console.log(`\n💾 Results saved to: data/backtests/backtest-${report.testId}.json`);

      // Check if we achieved 80% win rate
      if (report.results.winRate >= 80) {
        console.log('\n🎉 CONGRATULATIONS! Achieved 80%+ win rate target!');
        console.log('🏆 Mirror prediction system validated successfully!');
      } else {
        console.log(`\n📈 Win rate: ${report.results.winRate.toFixed(1)}% (Target: 80%)`);
        console.log('💡 Check recommendations for improvements');
      }

    } catch (error) {
      spinner.fail('❌ Backtest execution failed');
      throw error;
    }
  }

  displayBacktestResults(report) {
    const { results, statistics, recommendations } = report;

    console.log('\n📊 BACKTEST RESULTS');
    console.log('═'.repeat(60));

    // Performance summary
    console.log('🏆 PERFORMANCE SUMMARY:');
    console.log(`   Win Rate: ${results.winRate.toFixed(1)}% (${results.wins}W / ${results.losses}L)`);
    console.log(`   Total Profit: $${results.totalProfit.toFixed(2)}`);
    console.log(`   ROI: ${results.roi.toFixed(1)}%`);
    console.log(`   Profit Factor: ${results.profitFactor.toFixed(2)}`);
    console.log(`   Total Predictions: ${results.totalPredictions}`);
    console.log(`   Average Stake: $${results.averageStake.toFixed(2)}`);

    // Statistical significance
    console.log('\n📈 STATISTICAL SIGNIFICANCE:');
    const winRateTest = statistics.statisticalTests.winRateSignificance;
    const roiTest = statistics.statisticalTests.roiSignificance;

    console.log(`   Win Rate Test: ${winRateTest.significant ? '✅ Significant' : '❌ Not significant'}`);
    console.log(`   P-Value: ${winRateTest.pValue.toFixed(3)}`);
    console.log(`   Effect Size: ${(winRateTest.effectSize * 100).toFixed(1)}% above random`);

    console.log(`   ROI Test: ${roiTest.significant ? '✅ Significant' : '❌ Not significant'}`);
    console.log(`   P-Value: ${roiTest.pValue.toFixed(3)}`);

    // Confidence intervals
    console.log('\n📊 CONFIDENCE INTERVALS (95%):');
    const winRateCI = statistics.confidenceIntervals.winRate;
    const roiCI = statistics.confidenceIntervals.roi;

    console.log(`   Win Rate: ${winRateCI.lower.toFixed(1)}% - ${winRateCI.upper.toFixed(1)}%`);
    console.log(`   ROI: ${roiCI.lower.toFixed(1)}% - ${roiCI.upper.toFixed(1)}%`);

    // Risk metrics
    console.log('\n⚠️  RISK METRICS:');
    const risk = statistics.riskMetrics;

    console.log(`   Sharpe Ratio: ${risk.sharpeRatio.toFixed(2)}`);
    console.log(`   Max Drawdown: $${risk.maximumDrawdown.toFixed(2)}`);
    console.log(`   Win/Loss Ratio: ${risk.winLossRatio.toFixed(2)}`);
    console.log(`   Max Consecutive Losses: ${risk.consecutiveLosses}`);

    // Confidence calibration
    console.log('\n🎯 CONFIDENCE CALIBRATION:');
    const calibration = statistics.statisticalTests.confidenceCalibration;
    const calibrationEntries = Object.entries(calibration);

    if (calibrationEntries.length > 0) {
      calibrationEntries.forEach(([range, data]) => {
        const status = Math.abs(data.difference) < 0.1 ? '✅' : '⚠️';
        console.log(`   ${range}: Expected ${(data.expected * 100).toFixed(0)}%, Actual ${(data.actual * 100).toFixed(0)}% ${status}`);
      });
    } else {
      console.log('   No calibration data available');
    }

    // Recommendations
    if (recommendations && recommendations.length > 0) {
      console.log('\n💡 RECOMMENDATIONS:');
      recommendations.forEach((rec, i) => {
        const priorityIcon = rec.priority === 'high' ? '🔴' : rec.priority === 'medium' ? '🟡' : '🟢';
        console.log(`   ${priorityIcon} ${rec.message}`);
      });
    }

    // Execution details
    console.log('\n⚙️  EXECUTION DETAILS:');
    console.log(`   Duration: ${(report.execution.duration / 1000).toFixed(1)}s`);
    console.log(`   Data Points: ${report.execution.dataPoints}`);
    console.log(`   Predictions Generated: ${report.execution.predictionsGenerated}`);
  }

  async listBacktests() {
    console.log('📋 Available Backtests:');
    console.log('═'.repeat(40));

    try {
      // This would list saved backtest files
      // For now, show recent in-memory results
      if (this.backtestingEngine.testResults.length > 0) {
        this.backtestingEngine.testResults.slice(-10).forEach((test, i) => {
          console.log(`${i + 1}. ${test.name}`);
          console.log(`   Win Rate: ${test.results.winRate.toFixed(1)}%`);
          console.log(`   Profit: $${test.results.totalProfit.toFixed(2)}`);
          console.log(`   Date: ${new Date(test.execution.startTime).toLocaleDateString()}`);
          console.log('');
        });
      } else {
        console.log('No backtests available. Run a backtest first.');
      }
    } catch (error) {
      console.error('Failed to list backtests:', error.message);
    }
  }

  async compareBacktests(testIds) {
    console.log(`🔍 Comparing ${testIds.length} backtests...`);

    try {
      const comparison = await this.backtestingEngine.compareBacktests(testIds);

      console.log('\n📊 BACKTEST COMPARISON');
      console.log('═'.repeat(50));

      console.log('🏆 PERFORMANCE RANKING:');
      comparison.tests.forEach((test, i) => {
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
        console.log(`   ${medal} ${test.name}: ${test.winRate.toFixed(1)}% win rate, ${test.roi.toFixed(1)}% ROI`);
      });

      console.log('\n📈 STATISTICAL COMPARISON:');
      const statComp = comparison.statisticalComparison;
      console.log(`   Best: ${statComp.bestPerforming}`);
      console.log(`   Worst: ${statComp.worstPerforming}`);
      console.log(`   Difference: ${statComp.winRateDifference.toFixed(1)}%`);
      console.log(`   Significant: ${statComp.statisticallySignificant ? 'Yes' : 'No'}`);

      if (comparison.recommendations && comparison.recommendations.length > 0) {
        console.log('\n💡 RECOMMENDATIONS:');
        comparison.recommendations.forEach(rec => {
          console.log(`   • ${rec.message}`);
        });
      }

    } catch (error) {
      console.error('Failed to compare backtests:', error.message);
    }
  }

  async generateReport(format = 'text') {
    console.log('📋 Generating comprehensive backtesting report...');

    try {
      const report = await this.backtestingEngine.generateReport({
        format,
        includeDetails: true
      });

      if (format === 'text') {
        console.log('\n' + report);
      } else {
        console.log(JSON.stringify(report, null, 2));
      }

      // Save report
      const fs = require('fs').promises;
      const path = require('path');
      const filename = `backtest-report-${Date.now()}.${format}`;
      const filepath = path.join(process.cwd(), 'data', filename);

      await fs.mkdir(path.dirname(filepath), { recursive: true });
      await fs.writeFile(filepath, format === 'text' ? report : JSON.stringify(report, null, 2));

      console.log(`\n💾 Report saved to: ${filepath}`);

    } catch (error) {
      console.error('Failed to generate report:', error.message);
    }
  }

  async validateAccuracy(options) {
    console.log('🔍 Running prediction accuracy validation...');

    try {
      const validation = await this.backtestingEngine.validatePredictionAccuracy(
        this.predictionEngine,
        [] // Would need historical data
      );

      console.log('\n📊 ACCURACY VALIDATION RESULTS');
      console.log('═'.repeat(40));
      console.log(`Total Validations: ${validation.totalValidations}`);
      console.log(`Accuracy: ${(validation.accuracy * 100).toFixed(1)}%`);
      console.log(`Average Confidence: ${(validation.averageConfidence * 100).toFixed(1)}%`);
      console.log(`Calibration Error: ${(validation.calibrationError * 100).toFixed(1)}%`);

      if (validation.accuracy >= 0.8) {
        console.log('\n🎉 ACCURACY VALIDATION PASSED: 80%+ accuracy achieved!');
      } else {
        console.log(`\n⚠️  Accuracy below target: ${(validation.accuracy * 100).toFixed(1)}% (Target: 80%)`);
      }

    } catch (error) {
      console.error('Validation failed:', error.message);
    }
  }
}

module.exports = new BacktestCommand();
