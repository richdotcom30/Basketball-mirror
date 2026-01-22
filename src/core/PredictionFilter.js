// Mirror - Prediction Filter Engine (Stage 2)
// Quality gate for prediction validation and optimization

const OpenRouterClient = require('../ai/OpenRouterClient');

class PredictionFilter {
  constructor(options = {}) {
    // Try to initialize AI client for re-analysis
    try {
      this.ai = new OpenRouterClient(options.ai);
      this.aiAvailable = true;
    } catch (error) {
      console.warn('⚠️ AI not available for filter re-analysis:', error.message);
      this.ai = null;
      this.aiAvailable = false;
    }

    // Realistic filtering thresholds for production use
    this.minProbabilityThreshold = options.minProbability || 0.85; // 85%+
    this.minConfidenceThreshold = options.minConfidence || 0.75; // 75+

    // Weighted scoring system
    this.scoringWeights = {
      probability: 0.40,    // 40%
      confidence: 0.30,     // 30%
      factors: 0.20,        // 20%
      risk: 0.10           // 10%
    };

    // Performance tracking
    this.performance = {
      totalPredictionsAnalyzed: 0,
      predictionsPassed: 0,
      predictionsRejected: 0,
      predictionsReAnalyzed: 0,
      averageScore: 0,
      topTierPredictions: 0
    };
  }

  async filterPredictions(predictions, options = {}) {
    console.log('🔍 Stage 2 Filter: Analyzing predictions for quality control...');

    const startTime = Date.now();
    const filteredResults = {
      topTierPredictions: [],
      eliminatedPredictions: [],
      correctedPredictions: [],
      betBuilderCombinations: {
        singleGame: [],
        multiGame: []
      },
      statisticalSummary: {},
      finalRecommendations: {}
    };

    // Process each prediction through the filter
    for (const gamePred of predictions) {
      if (!gamePred.markets) continue;

      for (const [market, prediction] of Object.entries(gamePred.markets)) {
        this.performance.totalPredictionsAnalyzed++;

        // Evaluate the prediction
        const evaluation = await this.evaluatePrediction(gamePred.game, prediction, market);

        if (evaluation.passesFilter) {
          // Prediction meets top-tier criteria
          filteredResults.topTierPredictions.push({
            rank: filteredResults.topTierPredictions.length + 1,
            match: `${gamePred.game.homeTeam} vs ${gamePred.game.awayTeam}`,
            primaryBet: this.formatBetType(market, prediction),
            probability: evaluation.scoredProbability,
            confidenceScore: evaluation.dataConfidenceScore,
            expectedValue: evaluation.expectedValue,
            evaluation: evaluation
          });
          this.performance.predictionsPassed++;
        } else if (evaluation.shouldReAnalyze && this.aiAvailable) {
          // Re-analyze for potential improvement
          console.log(`🔄 Re-analyzing ${gamePred.game.homeTeam} vs ${gamePred.game.awayTeam} (${market})`);
          const reAnalysis = await this.reAnalyzePrediction(gamePred.game, prediction, market);

          if (reAnalysis.improved) {
            filteredResults.correctedPredictions.push({
              originalMatch: `${gamePred.game.homeTeam} vs ${gamePred.game.awayTeam}`,
              originalPrediction: this.formatBetType(market, prediction),
              originalProbability: (prediction.confidence * 100).toFixed(1),
              alternativePrediction: this.formatBetType(market, reAnalysis.newPrediction),
              newProbability: (reAnalysis.newPrediction.confidence * 100).toFixed(1),
              reasonForChange: reAnalysis.reasoning
            });
            this.performance.predictionsReAnalyzed++;
          } else {
            // Still doesn't pass - eliminate
            filteredResults.eliminatedPredictions.push({
              match: `${gamePred.game.homeTeam} vs ${gamePred.game.awayTeam}`,
              reasonForElimination: evaluation.eliminationReason,
              riskFactor: evaluation.riskFactor,
              alternativeAvailable: reAnalysis.improved ? 'Yes' : 'No'
            });
            this.performance.predictionsRejected++;
          }
        } else {
          // Direct elimination
          filteredResults.eliminatedPredictions.push({
            match: `${gamePred.game.homeTeam} vs ${gamePred.game.awayTeam}`,
            reasonForElimination: evaluation.eliminationReason,
            riskFactor: evaluation.riskFactor,
            alternativeAvailable: 'No'
          });
          this.performance.predictionsRejected++;
        }
      }
    }

    // Generate optimal combinations
    filteredResults.betBuilderCombinations = this.generateOptimalCombinations(filteredResults.topTierPredictions);

    // Calculate statistical summary
    filteredResults.statisticalSummary = this.calculateStatisticalSummary(filteredResults);

    // Generate final recommendations
    filteredResults.finalRecommendations = this.generateFinalRecommendations(filteredResults);

    const processingTime = Date.now() - startTime;
    console.log(`✅ Stage 2 Filter complete: ${filteredResults.topTierPredictions.length} top-tier predictions from ${this.performance.totalPredictionsAnalyzed} analyzed in ${processingTime}ms`);

    return filteredResults;
  }

  async evaluatePrediction(game, prediction, market) {
    // Comprehensive evaluation based on multiple factors

    const evaluation = {
      passesFilter: false,
      shouldReAnalyze: false,
      eliminationReason: '',
      riskFactor: '',
      scoredProbability: 0,
      dataConfidenceScore: 0,
      expectedValue: 0,
      supportingFactors: 0
    };

    // 1. Probability Assessment (40% weight)
    const probabilityScore = this.assessProbability(prediction.confidence);
    evaluation.scoredProbability = (prediction.confidence * 100);

    // 2. Data Confidence Assessment (30% weight)
    const confidenceScore = this.assessDataConfidence(prediction, game);
    evaluation.dataConfidenceScore = confidenceScore.score;

    // 3. Supporting Factors Analysis (20% weight)
    const factorsScore = this.analyzeSupportingFactors(prediction);
    evaluation.supportingFactors = factorsScore.count;

    // 4. Risk Assessment (10% weight)
    const riskScore = this.assessRisk(prediction, market);

    // Calculate weighted total score
    const totalScore = (
      probabilityScore * this.scoringWeights.probability +
      confidenceScore.weightedScore * this.scoringWeights.confidence +
      factorsScore.weightedScore * this.scoringWeights.factors +
      riskScore * this.scoringWeights.risk
    );

    // Expected value calculation
    evaluation.expectedValue = this.calculateExpectedValue(prediction);

    // Determine if prediction passes filter
    const meetsProbabilityThreshold = prediction.confidence >= this.minProbabilityThreshold;
    const meetsConfidenceThreshold = confidenceScore.score >= (this.minConfidenceThreshold * 100);

    if (meetsProbabilityThreshold && meetsConfidenceThreshold) {
      evaluation.passesFilter = true;
      this.performance.topTierPredictions++;
    } else {
      // Determine if re-analysis is warranted
      const borderlineProbability = prediction.confidence >= 0.85; // 85%+ might be improvable
      const hasSomeFactors = factorsScore.count >= 2;
      const lowRisk = riskScore > 0.7; // Lower risk scores are better

      evaluation.shouldReAnalyze = borderlineProbability && hasSomeFactors && lowRisk;

      // Set elimination reason
      if (!meetsProbabilityThreshold) {
        evaluation.eliminationReason = `Low probability: ${(prediction.confidence * 100).toFixed(1)}% (required: ${(this.minProbabilityThreshold * 100).toFixed(1)}%+)`;
        evaluation.riskFactor = 'Probability too low';
      } else if (!meetsConfidenceThreshold) {
        evaluation.eliminationReason = `Low confidence score: ${confidenceScore.score}/100 (required: ${(this.minConfidenceThreshold * 100).toFixed(1)}+)`;
        evaluation.riskFactor = 'Data confidence insufficient';
      }
    }

    return evaluation;
  }

  assessProbability(confidence) {
    // Convert confidence to 0-1 scale for weighting
    return confidence;
  }

  assessDataConfidence(prediction, game) {
    let score = 50; // Base score
    let factors = 0;

    // Factor 1: Historical pattern validation
    if (prediction.analysis && prediction.analysis.length > 0) {
      score += 15;
      factors++;
    }

    // Factor 2: Multiple data sources
    if (prediction.research && prediction.research.insights && prediction.research.insights.length > 2) {
      score += 10;
      factors++;
    }

    // Factor 3: Statistical validation
    if (prediction.validation && prediction.validation.confidence > 0.8) {
      score += 10;
      factors++;
    }

    // Factor 4: Edge magnitude
    if (Math.abs(prediction.edge) > 5) {
      score += 5;
      factors++;
    }

    // Factor 5: League reputation
    const leagueMultiplier = this.getLeagueReliability(game.league || 'Unknown');
    score = Math.min(100, score * leagueMultiplier);

    return {
      score: Math.min(100, Math.max(0, score)),
      factors: factors,
      weightedScore: score / 100 // Convert to 0-1 for weighting
    };
  }

  analyzeSupportingFactors(prediction) {
    let count = 0;

    // Count supporting factors in reasoning
    if (prediction.reasoning) {
      const reasoning = prediction.reasoning.toLowerCase();
      const factorKeywords = [
        'statistical', 'historical', 'form', 'momentum', 'injury', 'home', 'away',
        'head-to-head', 'efficiency', 'rating', 'trend', 'pattern', 'advantage'
      ];

      factorKeywords.forEach(keyword => {
        if (reasoning.includes(keyword)) count++;
      });
    }

    return {
      count: Math.min(count, 10), // Cap at 10
      weightedScore: Math.min(count / 5, 1) // Normalize to 0-1 (5+ factors = max score)
    };
  }

  assessRisk(prediction, market) {
    let riskScore = 1.0; // Start with lowest risk

    // Higher stake = higher risk
    if (prediction.stake && prediction.stake > 50) {
      riskScore -= 0.2;
    }

    // Very high confidence might indicate overconfidence
    if (prediction.confidence > 0.98) {
      riskScore -= 0.1;
    }

    // Market type risk (moneyline generally lower risk than exotics)
    const marketRisk = {
      'moneyline': 0.9,
      'total_points': 0.8,
      'home_total': 0.7,
      'away_total': 0.7,
      'handicap': 0.6
    };
    riskScore *= (marketRisk[market] || 0.5);

    // Edge magnitude (too small = higher risk)
    if (Math.abs(prediction.edge) < 2) {
      riskScore -= 0.2;
    }

    return Math.max(0, riskScore); // Ensure non-negative
  }

  calculateExpectedValue(prediction) {
    // Simplified EV calculation: (Win Probability × Potential Profit) - (Loss Probability × Stake)
    const winProb = prediction.confidence;
    const lossProb = 1 - winProb;

    // Assume fair odds based on probability (rough estimate)
    const fairOdds = winProb > 0 ? (1 / winProb) - 1 : 1;

    // Use actual odds if available, otherwise estimate
    const odds = prediction.odds || fairOdds;
    const stake = prediction.stake || 10;

    const potentialProfit = stake * odds;
    const expectedValue = (winProb * potentialProfit) - (lossProb * stake);

    return expectedValue;
  }

  async reAnalyzePrediction(game, originalPrediction, market) {
    if (!this.aiAvailable) {
      return { improved: false };
    }

    try {
      console.log(`🔄 Re-analyzing ${game.homeTeam} vs ${game.awayTeam} for better ${market} prediction`);

      // Conduct fresh analysis with focus on finding higher-probability alternatives
      const reAnalysisPrompt = this.buildReAnalysisPrompt(game, originalPrediction, market);
      const response = await this.ai.callModel('analysis', reAnalysisPrompt);

      // Parse the re-analysis response
      const newPrediction = this.parseReAnalysisResponse(response, market);

      if (newPrediction && newPrediction.confidence > originalPrediction.confidence) {
        return {
          improved: true,
          newPrediction: newPrediction,
          reasoning: `Re-analysis identified stronger ${market} opportunity with ${(newPrediction.confidence * 100).toFixed(1)}% vs ${(originalPrediction.confidence * 100).toFixed(1)}% confidence`
        };
      }

      return { improved: false };

    } catch (error) {
      console.warn(`⚠️ Re-analysis failed for ${game.homeTeam} vs ${game.awayTeam}:`, error.message);
      return { improved: false };
    }
  }

  buildReAnalysisPrompt(game, originalPrediction, market) {
    return `
You are conducting a re-analysis of this basketball prediction that didn't meet our quality thresholds.

ORIGINAL PREDICTION:
- Match: ${game.homeTeam} vs ${game.awayTeam}
- Market: ${market}
- Prediction: ${originalPrediction.prediction || 'N/A'}
- Confidence: ${(originalPrediction.confidence * 100).toFixed(1)}%
- Reasoning: ${originalPrediction.reasoning || 'N/A'}

TASK: Find a BETTER prediction for this same match that has HIGHER probability (>95%) and stronger data backing.

Focus on:
1. Alternative market interpretations
2. Different bet types that might have higher probability
3. Overlooked statistical advantages
4. Market inefficiencies not captured in the original analysis

Provide your re-analysis in the standard prediction format with >90% confidence level.
`;
  }

  parseReAnalysisResponse(response, market) {
    // Parse the AI response to extract improved prediction
    // This is a simplified implementation - production would need more robust parsing
    try {
      // Look for confidence indicators
      const confidenceMatch = response.match(/confidence[:\s]+(\d+)(?:\.\d+)?/i);
      const confidence = confidenceMatch ? parseInt(confidenceMatch[1]) / 100 : 0.5;

      if (confidence >= this.minProbabilityThreshold) {
        return {
          prediction: this.extractPredictionFromText(response, market),
          confidence: confidence,
          reasoning: response.substring(0, 500),
          edge: 0, // Would need to calculate
          stake: 0  // Would need to calculate
        };
      }
    } catch (error) {
      console.warn('⚠️ Failed to parse re-analysis response:', error.message);
    }

    return null;
  }

  generateOptimalCombinations(topTierPredictions) {
    const combinations = {
      singleGame: [],
      multiGame: []
    };

    if (topTierPredictions.length === 0) return combinations;

    // Single game focus - highest individual probability
    const bestSingle = topTierPredictions.reduce((best, current) =>
      current.probability > best.probability ? current : best
    );

    combinations.singleGame.push({
      match: bestSingle.match,
      combinedBets: [bestSingle.primaryBet],
      totalProbability: bestSingle.probability,
      riskLevel: bestSingle.probability > 98 ? 'Low' : bestSingle.probability > 95 ? 'Medium' : 'High'
    });

    // Multi-game accumulator - best 2-3 game combinations
    if (topTierPredictions.length >= 2) {
      const topPredictions = topTierPredictions
        .sort((a, b) => b.expectedValue - a.expectedValue)
        .slice(0, 3);

      const combinedProbability = topPredictions.reduce((acc, pred) => acc * (pred.probability / 100), 1) * 100;
      const totalMultiplier = topPredictions.reduce((acc, pred) => acc * 2, 1); // Rough estimate

      combinations.multiGame.push({
        games: topPredictions.length,
        betSelection: 'Moneyline Winner',
        combinedProbability: combinedProbability.toFixed(2),
        potentialReturn: `${totalMultiplier}x`,
        matches: topPredictions.map(p => ({ match: p.match, individualProbability: p.probability }))
      });
    }

    return combinations;
  }

  calculateStatisticalSummary(filteredResults) {
    const totalAnalyzed = this.performance.totalPredictionsAnalyzed;
    const aboveThreshold = this.performance.predictionsPassed;
    const avgConfidence = filteredResults.topTierPredictions.length > 0 ?
      filteredResults.topTierPredictions.reduce((sum, p) => sum + p.confidenceScore, 0) / filteredResults.topTierPredictions.length : 0;

    const highestProbability = filteredResults.topTierPredictions.length > 0 ?
      Math.max(...filteredResults.topTierPredictions.map(p => p.probability)) : 0;

    const mostSupported = filteredResults.topTierPredictions.length > 0 ?
      filteredResults.topTierPredictions.reduce((best, current) =>
        current.evaluation.supportingFactors > best.evaluation.supportingFactors ? current : best
      ) : null;

    return {
      totalPredictionsAnalyzed: totalAnalyzed,
      predictionsAbove90Threshold: aboveThreshold,
      averageConfidenceScore: avgConfidence.toFixed(1),
      highestIndividualProbability: highestProbability.toFixed(1),
      mostSupportedPrediction: mostSupported ? mostSupported.match : 'None'
    };
  }

  generateFinalRecommendations(filteredResults) {
    const recommendations = {
      conservativeApproach: {},
      balancedApproach: {},
      riskAnalysis: {}
    };

    if (filteredResults.topTierPredictions.length > 0) {
      // Conservative: Highest probability single bet
      const conservative = filteredResults.topTierPredictions
        .filter(p => p.probability >= 95)
        .sort((a, b) => b.probability - a.probability)[0];

      if (conservative) {
        recommendations.conservativeApproach = {
          primarySelection: `${conservative.match} + ${conservative.primaryBet}`,
          backupSelection: filteredResults.topTierPredictions
            .filter(p => p !== conservative)
            .sort((a, b) => b.probability - a.probability)[0]?.match || 'None available'
        };
      }

      // Balanced: Multi-game combination
      if (filteredResults.betBuilderCombinations.multiGame.length > 0) {
        const multiGame = filteredResults.betBuilderCombinations.multiGame[0];
        recommendations.balancedApproach = {
          multiGameCombination: `${multiGame.games}-game accumulator`,
          expectedSuccessRate: multiGame.combinedProbability + '%'
        };
      }

      // Risk analysis
      const lowestRisk = filteredResults.topTierPredictions
        .sort((a, b) => b.probability - a.probability)[0];

      const highestReward = filteredResults.topTierPredictions
        .sort((a, b) => b.expectedValue - a.expectedValue)[0];

      const optimalBalance = filteredResults.topTierPredictions
        .sort((a, b) => (b.probability * b.expectedValue) - (a.probability * a.expectedValue))[0];

      recommendations.riskAnalysis = {
        lowestRiskSelection: lowestRisk?.match || 'None',
        highestRewardPotential: highestReward?.match || 'None',
        optimalRiskRewardBalance: optimalBalance?.match || 'None'
      };
    }

    return recommendations;
  }

  formatBetType(market, prediction) {
    const pred = prediction.prediction;

    switch (market) {
      case 'moneyline':
        return pred === 'HOME_WIN' ? 'Match Winner (Home)' : 'Match Winner (Away)';
      case 'total_points':
        return `Total Points (${pred.split('_')[1]})`;
      case 'home_total':
        return `Home Team Total (${pred.split('_')[2]})`;
      case 'away_total':
        return `Away Team Total (${pred.split('_')[2]})`;
      case 'handicap':
        return `Handicap (${pred.replace('_', ' ').toLowerCase()})`;
      default:
        return pred;
    }
  }

  extractPredictionFromText(text, market) {
    // Extract prediction from AI response text
    // Simplified implementation
    if (market === 'moneyline') {
      if (text.toLowerCase().includes('home') && text.toLowerCase().includes('win')) {
        return 'HOME_WIN';
      } else if (text.toLowerCase().includes('away') && text.toLowerCase().includes('win')) {
        return 'AWAY_WIN';
      }
    }

    return 'UNKNOWN';
  }

  getLeagueReliability(league) {
    // League reliability multipliers for confidence scoring
    const leagueReliability = {
      'NBA': 1.1,
      'EuroLeague': 1.0,
      'Liga ACB': 0.95,
      'Turkish BSL': 0.95,
      'Greek Basket League': 0.9,
      'LNB Pro A': 0.9,
      'Basketball Bundesliga': 0.9,
      'Lega Basket Serie A': 0.9,
      'Serbia KLS': 0.85,
      'Lithuania LKL': 0.85,
      'Adriatic League (ABA)': 0.85,
      'NCAA': 0.8
    };

    return leagueReliability[league] || 0.8;
  }

  getPerformanceStats() {
    return {
      ...this.performance,
      passRate: this.performance.totalPredictionsAnalyzed > 0 ?
        (this.performance.predictionsPassed / this.performance.totalPredictionsAnalyzed) * 100 : 0,
      reAnalysisRate: this.performance.totalPredictionsAnalyzed > 0 ?
        (this.performance.predictionsReAnalyzed / this.performance.totalPredictionsAnalyzed) * 100 : 0,
      topTierRate: this.performance.totalPredictionsAnalyzed > 0 ?
        (this.performance.topTierPredictions / this.performance.totalPredictionsAnalyzed) * 100 : 0
    };
  }
}

module.exports = PredictionFilter;
