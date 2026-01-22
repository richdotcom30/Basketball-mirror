// Mirror - OpenRouter AI Integration
// Phase 2: AI Prediction Engine

const OpenAI = require('openai');

class OpenRouterClient {
  constructor(options = {}) {
    this.apiKey = process.env.OPENROUTER_API_KEY;
    if (!this.apiKey) {
      throw new Error('OPENROUTER_API_KEY environment variable not set');
    }

    this.client = new OpenAI({
      apiKey: this.apiKey,
      baseURL: "https://openrouter.ai/api/v1"
    });

    // AI Models for different tasks (using Xiaomi MiMo-V2-Flash - free)
    this.models = {
      analysis: "xiaomi/mimo-v2-flash:free", // Fast, accurate analysis
      prediction: "xiaomi/mimo-v2-flash:free", // Powerful reasoning
      research: "xiaomi/mimo-v2-flash:free", // Real-time insights
      validation: "xiaomi/mimo-v2-flash:free", // Cross-checking
      browsing: "xiaomi/mimo-v2-flash:free" // Internet browsing capabilities
    };

    // Rate limiting and caching
    this.requestQueue = [];
    this.isProcessing = false;
    this.cache = new Map();
    this.cacheTimeout = options.cacheTimeout || 300000; // 5 minutes

    // Model performance tracking
    this.performance = {
      analysis: { requests: 0, errors: 0, avgResponseTime: 0 },
      prediction: { requests: 0, errors: 0, avgResponseTime: 0 },
      research: { requests: 0, errors: 0, avgResponseTime: 0 },
      validation: { requests: 0, errors: 0, avgResponseTime: 0 },
      browsing: { requests: 0, errors: 0, avgResponseTime: 0 }
    };
  }

  async analyzeGame(gameData, context = {}) {
    const cacheKey = `analysis-${JSON.stringify(gameData)}-${JSON.stringify(context)}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    const prompt = this.buildAnalysisPrompt(gameData, context);

    try {
      const startTime = Date.now();
      const response = await this.callModel('analysis', prompt);
      const responseTime = Date.now() - startTime;

      this.updatePerformance('analysis', responseTime);

      const result = {
        gameId: gameData.id,
        analysis: response,
        confidence: this.extractConfidence(response),
        factors: this.extractFactors(response),
        recommendation: this.extractRecommendation(response),
        timestamp: new Date().toISOString(),
        model: this.models.analysis
      };

      this.setCached(cacheKey, result);
      return result;

    } catch (error) {
      console.error('❌ Game analysis failed:', error.message);
      this.performance.analysis.errors++;
      throw error;
    }
  }

  async generatePrediction(analysisResult, marketData = {}) {
    const cacheKey = `prediction-${analysisResult.gameId}-${JSON.stringify(marketData)}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    const prompt = this.buildPredictionPrompt(analysisResult, marketData);

    try {
      const startTime = Date.now();
      const response = await this.callModel('prediction', prompt);
      const responseTime = Date.now() - startTime;

      this.updatePerformance('prediction', responseTime);

      const result = {
        gameId: analysisResult.gameId,
        prediction: this.extractPrediction(response),
        confidence: this.extractPredictionConfidence(response),
        odds: this.extractFairOdds(response),
        edge: this.calculateEdge(response, marketData),
        reasoning: this.extractReasoning(response),
        timestamp: new Date().toISOString(),
        model: this.models.prediction
      };

      this.setCached(cacheKey, result);
      return result;

    } catch (error) {
      console.error('❌ Prediction generation failed:', error.message);
      this.performance.prediction.errors++;
      throw error;
    }
  }

  async researchGame(gameData, additionalContext = {}) {
    const cacheKey = `research-${gameData.id}-${JSON.stringify(additionalContext)}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    const prompt = this.buildResearchPrompt(gameData, additionalContext);

    try {
      const startTime = Date.now();
      const response = await this.callModel('research', prompt);
      const responseTime = Date.now() - startTime;

      this.updatePerformance('research', responseTime);

      const result = {
        gameId: gameData.id,
        insights: response,
        keyFactors: this.extractKeyFactors(response),
        sentiment: this.extractSentiment(response),
        timestamp: new Date().toISOString(),
        model: this.models.research
      };

      this.setCached(cacheKey, result);
      return result;

    } catch (error) {
      console.error('❌ Game research failed:', error.message);
      this.performance.research.errors++;
      throw error;
    }
  }

  async validatePrediction(prediction, historicalData = []) {
    const prompt = this.buildValidationPrompt(prediction, historicalData);

    try {
      const startTime = Date.now();
      const response = await this.callModel('validation', prompt);
      const responseTime = Date.now() - startTime;

      this.updatePerformance('validation', responseTime);

      return {
        predictionId: prediction.gameId,
        validation: response,
        confidence: this.extractValidationConfidence(response),
        concerns: this.extractConcerns(response),
        timestamp: new Date().toISOString(),
        model: this.models.validation
      };

    } catch (error) {
      console.error('❌ Prediction validation failed:', error.message);
      this.performance.validation.errors++;
      throw error;
    }
  }

  async callModel(modelType, prompt, options = {}) {
    const model = this.models[modelType];
    if (!model) {
      throw new Error(`Unknown model type: ${modelType}`);
    }

    const messages = [
      {
        role: "system",
        content: this.getSystemPrompt(modelType)
      },
      {
        role: "user",
        content: prompt
      }
    ];

    const completion = await this.client.chat.completions.create({
      model: model,
      messages: messages,
      temperature: options.temperature || 0.3,
      max_tokens: options.maxTokens || 2000,
      ...options
    });

    return completion.choices[0].message.content;
  }

  async browseInternet(query, options = {}) {
    const cacheKey = `browse-${query}-${JSON.stringify(options)}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    const prompt = this.buildBrowsingPrompt(query, options);

    try {
      const startTime = Date.now();
      const response = await this.callModel('browsing', prompt, {
        temperature: 0.1, // Lower temperature for factual browsing
        maxTokens: 4000, // Allow longer responses for browsing
        ...options
      });
      const responseTime = Date.now() - startTime;

      this.updatePerformance('browsing', responseTime);

      const result = {
        query,
        findings: response,
        sources: this.extractSources(response),
        insights: this.extractBrowsingInsights(response),
        timestamp: new Date().toISOString(),
        model: this.models.browsing
      };

      this.setCached(cacheKey, result);
      return result;

    } catch (error) {
      console.error('❌ Internet browsing failed:', error.message);
      this.performance.browsing.errors++;
      throw error;
    }
  }

  getSystemPrompt(modelType) {
    const prompts = {
      analysis: `You are a professional basketball analyst with 20+ years of experience. Analyze basketball games with deep tactical knowledge, considering team strategies, player matchups, coaching decisions, and situational factors. Provide detailed, objective analysis focused on predictive indicators.`,

      prediction: `You are an expert sports betting analyst specializing in basketball predictions. You understand probability, expected value, and market inefficiencies. Provide precise predictions with clear confidence levels and fair odds calculations.`,

      research: `You are a sports intelligence researcher with access to real-time information. Research teams, players, and situational factors that could impact game outcomes. Focus on recent news, injuries, momentum, and external influences.`,

      validation: `You are a prediction validator specializing in statistical analysis and risk assessment. Evaluate prediction quality, identify potential biases, and assess confidence levels based on historical data and logical consistency.`,

      browsing: `You are an advanced AI with internet browsing capabilities. You can search the web, navigate to websites, and extract information to answer queries. Focus on finding accurate, up-to-date information from reliable sources. Provide comprehensive research with clear citations and evidence.`
    };

    return prompts[modelType] || "You are an AI assistant specializing in basketball analysis.";
  }

  buildAnalysisPrompt(gameData, context = {}) {
    return `
Analyze this basketball game and provide a detailed breakdown:

GAME: ${gameData.homeTeam} vs ${gameData.awayTeam}
LEAGUE: ${gameData.league}
DATE/TIME: ${gameData.date} ${gameData.time}

Please provide:
1. **Team Comparison**: Relative strengths, recent form, head-to-head
2. **Key Matchups**: Important player vs player situations
3. **Tactical Analysis**: Expected strategies and potential advantages
4. **Situational Factors**: Home advantage, rest, travel, motivation
5. **Predictive Factors**: What statistically matters most
6. **Confidence Assessment**: How certain are you about key factors

Focus on factors that have proven predictive value in basketball analytics.
Format your response clearly with sections and specific predictions where possible.
`;
  }

  buildPredictionPrompt(analysisResult, marketData = {}) {
    const marketOdds = marketData.odds || 'Unknown';
    const spread = marketData.spread || 'Unknown';

    return `
Based on this game analysis, provide a precise prediction:

ANALYSIS SUMMARY:
${analysisResult.analysis}

MARKET DATA:
- Odds: ${marketOdds}
- Spread: ${spread}

Please provide:
1. **Win Probability**: Exact percentage for home team win
2. **Fair Odds**: What the odds should be based on true probability
3. **Edge Assessment**: How much value exists vs current market
4. **Confidence Level**: Scale of 1-10 how confident you are
5. **Key Reasoning**: 3-5 most important factors driving your prediction
6. **Risk Factors**: What could cause this prediction to be wrong

Be precise with numbers and clear about your confidence level.
Calculate expected value and edge mathematically where possible.
`;
  }

  buildResearchPrompt(gameData, additionalContext = {}) {
    return `
Research and analyze external factors for this game:

GAME: ${gameData.homeTeam} vs ${gameData.awayTeam}
LEAGUE: ${gameData.league}
DATE: ${gameData.date}

Investigate and report on:
1. **Recent News**: Team news, player updates, coaching changes
2. **Injury Status**: Confirmed injuries, questionable players
3. **Momentum Factors**: Recent performance, streaks, confidence
4. **External Influences**: Travel, rest, weather, motivation
5. **Market Sentiment**: Betting patterns, public perception
6. **Unique Angles**: Any unusual factors or storylines

Focus on information that could impact the game's outcome.
Be thorough but prioritize the most relevant and recent information.
`;
  }

  buildBrowsingPrompt(query, options = {}) {
    const depth = options.depth || 'comprehensive';
    const focus = options.focus || 'general';

    return `
Using your internet browsing capabilities, research and analyze: "${query}"

Please conduct thorough web research and provide:

1. **Search Strategy**: What sources you would browse and why
2. **Key Findings**: Most relevant and recent information found
3. **Source Citations**: Specific websites and articles referenced
4. **Data Analysis**: Any statistics, trends, or patterns identified
5. **Contextual Insights**: How this information impacts the broader picture
6. **Verification**: Cross-referenced information from multiple sources

${depth === 'comprehensive' ? 'Be thorough and comprehensive in your research.' : 'Focus on the most important and recent information.'}

${focus === 'basketball' ? 'Prioritize basketball/sports-related sources and analysis.' : 'Consider information from diverse reliable sources.'}

Provide evidence-based findings with clear citations and timestamps where available.
`;
  }

  buildValidationPrompt(prediction, historicalData = []) {
    return `
Validate this basketball prediction for accuracy and reliability:

PREDICTION: ${prediction.prediction}
CONFIDENCE: ${prediction.confidence}/10
GAME: ${prediction.gameId}

ANALYSIS: ${prediction.reasoning}

Please assess:
1. **Logical Consistency**: Does the reasoning make statistical sense?
2. **Data Quality**: Are the assumptions based on reliable information?
3. **Confidence Calibration**: Is the confidence level appropriate?
4. **Potential Biases**: Any logical fallacies or overconfidence?
5. **Historical Validation**: How similar predictions have performed
6. **Risk Assessment**: What could invalidate this prediction?

Provide a validation score (1-10) and specific concerns or strengths.
`;
  }

  extractConfidence(text) {
    const confidenceMatch = text.match(/confidence[:\s]+(\d+)(?:\/10)?/i);
    return confidenceMatch ? parseInt(confidenceMatch[1]) / 10 : 0.5;
  }

  extractFactors(text) {
    // Extract key factors mentioned in analysis
    const factors = [];
    const factorPatterns = [
      /(?:key|important|critical|major) factors?:?\s*([^.!?]+(?:[.!?][^.!?]*)*)/gi,
      /(?:consider|factor in)[:\s]+([^.!?]+(?:[.!?][^.!?]*)*)/gi
    ];

    factorPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        factors.push(match[1].trim());
      }
    });

    return factors.slice(0, 5); // Top 5 factors
  }

  extractRecommendation(text) {
    const recMatch = text.match(/(?:recommend|predict|suggest)[:\s]+([^.!?]+)/i);
    return recMatch ? recMatch[1].trim() : 'No clear recommendation';
  }

  extractPrediction(text) {
    const predMatch = text.match(/(?:prediction|pick|bet)[:\s]+([^.!?]+)/i);
    return predMatch ? predMatch[1].trim() : 'No prediction';
  }

  extractPredictionConfidence(text) {
    const confMatch = text.match(/confidence[:\s]+(\d+)(?:\/10)?/i);
    return confMatch ? parseInt(confMatch[1]) / 10 : 0.5;
  }

  extractFairOdds(text) {
    const oddsMatch = text.match(/fair odds?:?\s*([\d.-]+(?:\s*to\s*[\d.-]+)?)/i);
    return oddsMatch ? oddsMatch[1] : 'Unknown';
  }

  calculateEdge(text, marketData) {
    // Basic edge calculation - would be more sophisticated in production
    const fairOddsMatch = text.match(/fair odds?:?\s*([\d.-]+)/i);
    const marketOdds = marketData.odds || 2.0;

    if (fairOddsMatch) {
      const fairOdds = parseFloat(fairOddsMatch[1]);
      return ((marketOdds - fairOdds) / fairOdds) * 100; // Percentage edge
    }

    return 0;
  }

  extractReasoning(text) {
    const reasoningMatch = text.match(/(?:reasoning|key points)[:\s]+([^.!?]+(?:[.!?][^.!?]*)*)/i);
    return reasoningMatch ? reasoningMatch[1].trim() : text.substring(0, 500);
  }

  extractKeyFactors(text) {
    // Extract key insights from research
    const factors = text.split(/[.!?]+/).filter(sentence =>
      sentence.toLowerCase().includes('key') ||
      sentence.toLowerCase().includes('important') ||
      sentence.toLowerCase().includes('critical')
    );
    return factors.slice(0, 3);
  }

  extractSentiment(text) {
    // Basic sentiment analysis
    const positiveWords = ['strong', 'confident', 'advantage', 'momentum', 'improving'];
    const negativeWords = ['weak', 'struggling', 'disadvantage', 'injured', 'declining'];

    const lowerText = text.toLowerCase();
    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  extractValidationConfidence(text) {
    const confMatch = text.match(/validation score[:\s]+(\d+)(?:\/10)?/i);
    return confMatch ? parseInt(confMatch[1]) / 10 : 0.5;
  }

  extractConcerns(text) {
    const concerns = text.split(/[.!?]+/).filter(sentence =>
      sentence.toLowerCase().includes('concern') ||
      sentence.toLowerCase().includes('risk') ||
      sentence.toLowerCase().includes('weak') ||
      sentence.toLowerCase().includes('uncertain')
    );
    return concerns.slice(0, 3);
  }

  getCached(key) {
    const cached = this.cache.get(key);
    if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
      return cached.data;
    }
    if (cached) {
      this.cache.delete(key);
    }
    return null;
  }

  setCached(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  updatePerformance(modelType, responseTime) {
    const perf = this.performance[modelType];
    perf.requests++;
    perf.avgResponseTime = (perf.avgResponseTime * (perf.requests - 1) + responseTime) / perf.requests;
  }

  getPerformanceStats() {
    return {
      ...this.performance,
      cacheSize: this.cache.size,
      cacheHitRate: this.calculateCacheHitRate()
    };
  }

  calculateCacheHitRate() {
    // Simplified cache hit rate calculation
    // In production, you'd track hits vs misses
    return this.cache.size > 0 ? 0.7 : 0; // Assume 70% hit rate when cache is used
  }

  extractSources(text) {
    // Extract URLs and source citations from browsing results
    const sources = [];
    const urlPattern = /(https?:\/\/[^\s]+)/g;
    const sourcePattern = /(?:source|website|article|site)[:\s]+([^\n.!?]+)/gi;

    // Extract URLs
    let urlMatch;
    while ((urlMatch = urlPattern.exec(text)) !== null) {
      sources.push({
        url: urlMatch[1],
        type: 'url',
        context: 'Extracted from browsing results'
      });
    }

    // Extract named sources
    let sourceMatch;
    while ((sourceMatch = sourcePattern.exec(text)) !== null) {
      sources.push({
        name: sourceMatch[1].trim(),
        type: 'citation',
        context: 'Named source citation'
      });
    }

    return sources.slice(0, 10); // Limit to top 10 sources
  }

  extractBrowsingInsights(text) {
    // Extract key insights from browsing results
    const insights = [];
    const insightPatterns = [
      /(?:key|important|significant|major|critical) (?:finding|insight|discovery)[:\s]+([^.!?]+)/gi,
      /(?:conclusion|summary)[:\s]+([^.!?]+)/gi,
      /(?:trend|pattern)[:\s]+([^.!?]+)/gi
    ];

    insightPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        insights.push({
          content: match[1].trim(),
          type: 'browsing_insight',
          confidence: 0.8,
          source: 'gpt-5.1-codex'
        });
      }
    });

    // If no structured insights found, extract key sentences
    if (insights.length === 0) {
      const sentences = text.split(/[.!?]+/).filter(s =>
        s.trim().length > 20 &&
        (s.toLowerCase().includes('found') ||
         s.toLowerCase().includes('discovered') ||
         s.toLowerCase().includes('revealed') ||
         s.toLowerCase().includes('shows'))
      );

      sentences.slice(0, 5).forEach(sentence => {
        insights.push({
          content: sentence.trim(),
          type: 'extracted_insight',
          confidence: 0.7,
          source: 'gpt-5.1-codex'
        });
      });
    }

    return insights.slice(0, 8); // Limit insights
  }

  async clearCache() {
    this.cache.clear();
    console.log('🧹 AI cache cleared');
  }
}

module.exports = OpenRouterClient;
