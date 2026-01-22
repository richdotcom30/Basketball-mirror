// Mirror - AI-Powered Web Scraping Agent
// Phase 5: Web Integration & Automation

const WebScraper = require('./WebScraper');
const OpenRouterClient = require('../ai/OpenRouterClient');

class AIScraper {
  constructor(options = {}) {
    this.baseScraper = new WebScraper(options.scraper);
    this.ai = new OpenRouterClient(options.ai);

    // AI scraping configuration
    this.researchDepth = options.researchDepth || 'comprehensive';
    this.maxSearchResults = options.maxSearchResults || 10;
    this.intelligenceLevel = options.intelligenceLevel || 'advanced';

    // Search engines and sources
    this.searchEngines = [
      'https://www.google.com/search?q=',
      'https://www.bing.com/search?q=',
      'https://search.yahoo.com/search?p='
    ];

    // Specialized data sources
    this.specializedSources = {
      injuries: [
        'https://www.rotoworld.com/basketball/nba/injuries',
        'https://www.espn.com/nba/injuries',
        'https://www.cbssports.com/nba/injuries'
      ],
      news: [
        'https://www.espn.com/nba/',
        'https://www.sbnation.com/nba',
        'https://www.basketball-reference.com/leagues/NBA_2024.html'
      ],
      odds: [
        'https://www.sportsbookreview.com/betting-odds/nba-basketball/',
        'https://www.oddsportal.com/basketball/usa/nba'
      ],
      stats: [
        'https://www.basketball-reference.com/leagues/NBA_2024.html',
        'https://stats.nba.com',
        'https://www.espn.com/nba/stats'
      ]
    };

    // Intelligence tracking
    this.researchHistory = new Map();
    this.insights = [];
  }

  async intelligentResearch(query, options = {}) {
    console.log(`🧠 Starting intelligent research for: "${query}"`);

    const researchId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Step 1: AI analyzes what to search for
      const searchPlan = await this.ai.callModel('research', `
Analyze this research query and create an optimal search strategy:

QUERY: ${query}

Please provide:
1. **Primary search terms** (3-5 key phrases)
2. **Relevant data sources** (websites, APIs, specialized databases)
3. **Search strategy** (breadth vs depth, time sensitivity)
4. **Expected insights** (what valuable information to look for)
5. **Verification methods** (how to validate findings)

Format as structured analysis with clear sections.
`, { maxTokens: 1000 });

      // Step 2: Execute intelligent searches
      const searchResults = await this.executeIntelligentSearches(searchPlan, options);

      // Step 3: AI filters and ranks results
      const filteredResults = await this.aiFilterResults(searchResults, query);

      // Step 4: Extract insights and patterns
      const insights = await this.extractInsights(filteredResults, query);

      // Step 5: Generate research summary
      const summary = await this.generateResearchSummary(insights, query);

      const researchResult = {
        id: researchId,
        query,
        searchPlan,
        results: filteredResults,
        insights,
        summary,
        timestamp: new Date().toISOString(),
        metadata: {
          sourcesSearched: searchResults.length,
          insightsFound: insights.length,
          processingTime: Date.now() - parseInt(researchId.split('-')[0])
        }
      };

      // Store in research history
      this.researchHistory.set(researchId, researchResult);
      this.insights.push(...insights);

      console.log(`✅ Intelligent research complete: ${insights.length} insights found`);
      return researchResult;

    } catch (error) {
      console.error('❌ Intelligent research failed:', error.message);
      throw error;
    }
  }

  async executeIntelligentSearches(searchPlan, options) {
    const allResults = [];

    // Parse AI-generated search plan
    const searchTerms = this.extractSearchTerms(searchPlan);
    const targetSources = this.extractTargetSources(searchPlan);

    console.log(`🔍 Executing ${searchTerms.length} search strategies...`);

    // Execute searches with different strategies
    for (const term of searchTerms.slice(0, 3)) { // Limit to top 3 terms
      try {
        // Multi-engine search
        const engineResults = await this.multiEngineSearch(term, options);
        allResults.push(...engineResults);

        // Specialized source search
        const specializedResults = await this.specializedSourceSearch(term, targetSources);
        allResults.push(...specializedResults);

        // Rate limiting
        await this.delay(1000);

      } catch (error) {
        console.warn(`⚠️ Search failed for "${term}":`, error.message);
      }
    }

    // Remove duplicates and rank results
    const uniqueResults = this.deduplicateResults(allResults);
    const rankedResults = this.rankResults(uniqueResults);

    return rankedResults.slice(0, this.maxSearchResults);
  }

  async multiEngineSearch(query, options) {
    const results = [];

    // Search across multiple engines (simplified - would need proxies in production)
    for (const engine of this.searchEngines.slice(0, 1)) { // Limit to 1 for demo
      try {
        const engineQuery = encodeURIComponent(query);
        const searchUrl = `${engine}${engineQuery}`;

        // Use base scraper for search results
        const html = await this.baseScraper.makeRequest(searchUrl);
        const parsedResults = this.parseSearchResults(html, engine);

        results.push(...parsedResults);

      } catch (error) {
        console.warn(`⚠️ Engine search failed for ${engine}:`, error.message);
      }
    }

    return results;
  }

  async specializedSourceSearch(query, targetSources) {
    const results = [];

    // Search relevant specialized sources
    const relevantSources = this.getRelevantSources(query, targetSources);

    for (const source of relevantSources.slice(0, 3)) { // Limit sources
      try {
        const html = await this.baseScraper.makeRequest(source.url);
        const parsedData = await this.parseSpecializedSource(html, source.type, query);

        if (parsedData.length > 0) {
          results.push({
            url: source.url,
            title: source.name,
            type: 'specialized',
            data: parsedData,
            relevance: this.calculateRelevance(parsedData, query)
          });
        }

        await this.delay(2000); // Respectful delay for specialized sources

      } catch (error) {
        console.warn(`⚠️ Specialized source failed ${source.url}:`, error.message);
      }
    }

    return results;
  }

  async aiFilterResults(searchResults, originalQuery) {
    console.log(`🎯 AI filtering ${searchResults.length} results...`);

    const filtered = [];

    // Use AI to evaluate relevance of each result
    for (const result of searchResults.slice(0, 20)) { // Limit for AI processing
      try {
        const evaluation = await this.ai.callModel('research', `
Evaluate if this search result is relevant to the query:

QUERY: ${originalQuery}

RESULT TITLE: ${result.title || 'No title'}
RESULT URL: ${result.url}
RESULT SNIPPET: ${result.snippet || result.data || 'No content'}

Rate relevance on a scale of 0-10, where:
- 0 = Completely irrelevant
- 5 = Somewhat related
- 10 = Highly relevant and valuable

Also provide a brief reason for your rating.

Format: SCORE: [number] | REASON: [brief explanation]
`, { maxTokens: 200 });

        const score = this.extractRelevanceScore(evaluation);
        const reason = this.extractReason(evaluation);

        if (score >= 6) { // Only keep highly relevant results
          filtered.push({
            ...result,
            aiScore: score,
            aiReason: reason,
            evaluated: true
          });
        }

        await this.delay(500); // Rate limiting for AI calls

      } catch (error) {
        console.warn(`⚠️ AI evaluation failed for result:`, error.message);
        // Include result with default score if AI fails
        filtered.push({
          ...result,
          aiScore: 5,
          aiReason: 'AI evaluation failed',
          evaluated: false
        });
      }
    }

    console.log(`✅ AI filtered to ${filtered.length} relevant results`);
    return filtered.sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0));
  }

  async extractInsights(filteredResults, originalQuery) {
    console.log('🔬 Extracting insights from filtered results...');

    const insights = [];

    // Use AI to synthesize insights from all relevant results
    try {
      const synthesisPrompt = `
Synthesize key insights from these research results:

ORIGINAL QUERY: ${originalQuery}

RESULTS SUMMARY:
${filteredResults.map((r, i) => `${i + 1}. ${r.title} (Score: ${r.aiScore}/10)
   ${r.aiReason}`).join('\n')}

Please extract and summarize:
1. **Key Facts** (important data points)
2. **Trends & Patterns** (recurring themes)
3. **Contradictions** (conflicting information)
4. **Gaps** (missing information)
5. **Actionable Insights** (useful for decision making)

Format as structured bullet points with specific, actionable insights.
`;

      const synthesis = await this.ai.callModel('research', synthesisPrompt, { maxTokens: 1500 });

      // Parse synthesis into structured insights
      insights.push(...this.parseSynthesisIntoInsights(synthesis, filteredResults));

    } catch (error) {
      console.error('❌ Insight extraction failed:', error.message);
      // Fallback: basic insights from top results
      insights.push({
        type: 'basic_fallback',
        content: `Found ${filteredResults.length} relevant results for "${originalQuery}"`,
        confidence: 0.5,
        source: 'fallback'
      });
    }

    console.log(`💡 Extracted ${insights.length} insights`);
    return insights;
  }

  async generateResearchSummary(insights, originalQuery) {
    try {
      const summaryPrompt = `
Create a comprehensive research summary:

QUERY: ${originalQuery}

INSIGHTS FOUND: ${insights.length}

Please provide:
1. **Executive Summary** (2-3 sentences)
2. **Key Findings** (top 3 insights)
3. **Confidence Level** (how reliable is this research)
4. **Recommendations** (what to do with this information)
5. **Follow-up Questions** (what to research next)

Keep the summary concise but comprehensive.
`;

      const summary = await this.ai.callModel('research', summaryPrompt, { maxTokens: 800 });

      return {
        text: summary,
        insightsCount: insights.length,
        confidence: this.calculateOverallConfidence(insights),
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Summary generation failed:', error.message);
      return {
        text: `Research completed for "${originalQuery}" with ${insights.length} insights found.`,
        insightsCount: insights.length,
        confidence: 0.5,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Helper methods
  extractSearchTerms(searchPlan) {
    // Parse AI response for search terms
    const terms = [];
    const termPatterns = [
      /primary search terms?:?\s*([^.!?]+(?:[.!?][^.!?]*)*)/gi,
      /search terms?:?\s*([^.!?]+(?:[.!?][^.!?]*)*)/gi,
      /key phrases?:?\s*([^.!?]+(?:[.!?][^.!?]*)*)/gi
    ];

    termPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(searchPlan)) !== null) {
        const extractedTerms = match[1].split(/[,;]/).map(t => t.trim());
        terms.push(...extractedTerms);
      }
    });

    return [...new Set(terms)].slice(0, 5); // Remove duplicates, limit to 5
  }

  extractTargetSources(searchPlan) {
    // Parse for mentioned sources/types
    const sources = [];
    const sourceTypes = Object.keys(this.specializedSources);

    sourceTypes.forEach(type => {
      if (searchPlan.toLowerCase().includes(type)) {
        sources.push(type);
      }
    });

    return sources;
  }

  getRelevantSources(query, targetTypes) {
    const relevantSources = [];

    targetTypes.forEach(type => {
      if (this.specializedSources[type]) {
        this.specializedSources[type].forEach(url => {
          relevantSources.push({
            url,
            type,
            name: `${type} source`
          });
        });
      }
    });

    return relevantSources;
  }

  parseSearchResults(html, engine) {
    // Simplified search result parsing
    const $ = this.baseScraper.constructor.prototype.$ || require('cheerio').load(html);
    const results = [];

    // Generic search result selectors (would need customization per engine)
    $('[class*="result"], [class*="item"], a').each((i, elem) => {
      if (i >= 10) return false; // Limit results

      const $elem = $(elem);
      const title = $elem.text().trim();
      const url = $elem.attr('href');

      if (title && url && url.startsWith('http') && title.length > 10) {
        results.push({
          title: title.substring(0, 100),
          url,
          snippet: title.substring(0, 200),
          engine,
          type: 'search_result'
        });
      }
    });

    return results;
  }

  async parseSpecializedSource(html, sourceType, query) {
    // Specialized parsing based on source type
    const $ = this.baseScraper.constructor.prototype.$ || require('cheerio').load(html);
    const data = [];

    switch (sourceType) {
      case 'injuries':
        $('[class*="injury"], [class*="player"]').each((i, elem) => {
          const player = $(elem).find('[class*="name"]').text().trim();
          const status = $(elem).find('[class*="status"]').text().trim();
          if (player && status) {
            data.push({ player, status, type: 'injury' });
          }
        });
        break;

      case 'news':
        $('[class*="article"], [class*="story"]').each((i, elem) => {
          const title = $(elem).find('h1,h2,h3,a').first().text().trim();
          const summary = $(elem).find('p').first().text().trim();
          if (title) {
            data.push({ title, summary: summary.substring(0, 200), type: 'news' });
          }
        });
        break;

      default:
        // Generic data extraction
        $('p, div, span').each((i, elem) => {
          const text = $(elem).text().trim();
          if (text.length > 50 && text.toLowerCase().includes(query.toLowerCase().split(' ')[0])) {
            data.push({ content: text.substring(0, 300), type: 'generic' });
          }
        });
    }

    return data;
  }

  deduplicateResults(results) {
    const seen = new Set();
    return results.filter(result => {
      const key = `${result.url}-${result.title}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  rankResults(results) {
    return results.sort((a, b) => {
      // Prioritize AI-evaluated results
      if (a.aiScore && !b.aiScore) return -1;
      if (!a.aiScore && b.aiScore) return 1;

      // Then sort by AI score
      return (b.aiScore || 0) - (a.aiScore || 0);
    });
  }

  calculateRelevance(data, query) {
    // Simple relevance scoring
    const queryWords = query.toLowerCase().split(' ');
    let score = 0;

    data.forEach(item => {
      const content = JSON.stringify(item).toLowerCase();
      queryWords.forEach(word => {
        if (content.includes(word)) score += 1;
      });
    });

    return Math.min(score / queryWords.length, 1);
  }

  extractRelevanceScore(evaluation) {
    const match = evaluation.match(/SCORE:\s*(\d+)/i);
    return match ? parseInt(match[1]) / 10 : 0.5;
  }

  extractReason(evaluation) {
    const match = evaluation.match(/REASON:\s*(.+)/i);
    return match ? match[1].trim() : 'No reason provided';
  }

  parseSynthesisIntoInsights(synthesis, results) {
    // Parse AI synthesis into structured insights
    const insights = [];
    const sections = synthesis.split(/\d+\.\s*\*\*/);

    sections.forEach(section => {
      if (section.trim()) {
        const lines = section.split('\n').filter(line => line.trim() && !line.includes('**'));
        lines.forEach(line => {
          if (line.trim().length > 20) {
            insights.push({
              content: line.trim(),
              type: 'synthesized',
              confidence: 0.8,
              source: 'ai_synthesis'
            });
          }
        });
      }
    });

    return insights.slice(0, 10); // Limit insights
  }

  calculateOverallConfidence(insights) {
    if (insights.length === 0) return 0;

    const avgConfidence = insights.reduce((sum, insight) => sum + (insight.confidence || 0.5), 0) / insights.length;
    const countBonus = Math.min(insights.length / 5, 0.3); // Bonus for more insights

    return Math.min(avgConfidence + countBonus, 1);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getResearchHistory() {
    return Array.from(this.researchHistory.values());
  }

  clearHistory() {
    this.researchHistory.clear();
    this.insights = [];
    console.log('🧹 AI scraper history cleared');
  }
}

module.exports = AIScraper;
