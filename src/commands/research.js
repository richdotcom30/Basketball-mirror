// Mirror - AI Research Command
// Phase 5: Web Integration & Automation

const AIScraper = require('../scrapers/AIScraper');
const ora = require('ora');

class ResearchCommand {
  constructor() {
    this.aiScraper = null;
  }

  async run(options) {
    console.log('🧠 Mirror AI Research - Phase 5: Intelligent Web Research');

    try {
      // Initialize AI scraper
      this.aiScraper = new AIScraper({
        researchDepth: options.depth || 'comprehensive',
        maxSearchResults: parseInt(options.results || 10),
        intelligenceLevel: options.intelligence || 'advanced'
      });

      const query = options.query || options.topic;
      if (!query) {
        throw new Error('Research query is required. Use --query "your research topic"');
      }

      console.log(`🔍 Research Query: "${query}"`);
      console.log(`🎯 Intelligence Level: ${options.intelligence || 'advanced'}`);
      console.log(`📊 Max Results: ${options.results || 10}\n`);

      const spinner = ora('🧠 Analyzing research strategy...').start();

      // Perform intelligent research
      spinner.text = '🔍 Executing intelligent search across web...';

      let researchResult;

      // Check if browsing is requested and GPT-5.1 Codex is available
      if (options.browse && process.env.GPT5_CODEX_API_KEY) {
        console.log('🌐 Using GPT-5.1 Codex for internet browsing...');

        try {
          // Use GPT-5.1 Codex for browsing
          const OpenRouterClient = require('../ai/OpenRouterClient');
          const browsingClient = new OpenRouterClient({
            apiKey: process.env.GPT5_CODEX_API_KEY
          });

          researchResult = await browsingClient.browseInternet(query, {
            depth: options.depth,
            focus: 'basketball',
            includeRecentNews: !options.noNews,
            includeSocialSentiment: !options.noSocial
          });

          // Convert browsing result to research format
          researchResult = {
            id: `browse-${Date.now()}`,
            query,
            searchPlan: 'GPT-5.1 Codex browsing strategy',
            results: researchResult.sources || [],
            insights: researchResult.insights || [],
            summary: {
              text: researchResult.findings || 'Browsing completed',
              insightsCount: researchResult.insights?.length || 0,
              confidence: 0.85,
              timestamp: researchResult.timestamp
            },
            timestamp: researchResult.timestamp,
            metadata: {
              sourcesSearched: researchResult.sources?.length || 0,
              insightsFound: researchResult.insights?.length || 0,
              processingTime: 0,
              method: 'gpt-5.1-codex-browsing'
            }
          };

        } catch (browsingError) {
          console.warn('⚠️ GPT-5.1 Codex browsing failed, falling back to AI scraper:', browsingError.message);
          researchResult = await this.aiScraper.intelligentResearch(query, {
            depth: options.depth,
            includeRecentNews: !options.noNews,
            includeSocialSentiment: !options.noSocial
          });
        }

      } else {
        // Use traditional AI scraper
        if (options.browse) {
          console.log('💡 Browsing requested but GPT-5.1 Codex not available, using AI scraper');
        }

        researchResult = await this.aiScraper.intelligentResearch(query, {
          depth: options.depth,
          includeRecentNews: !options.noNews,
          includeSocialSentiment: !options.noSocial
        });
      }

      spinner.succeed('✅ Intelligent research complete');

      // Display results
      this.displayResearchResults(researchResult);

      // Save results
      await this.saveResearchResults(researchResult);

      console.log(`\n💾 Research saved to: research-${researchResult.id}.json`);
      console.log('💡 Use this data to inform your prediction strategies!');

    } catch (error) {
      console.error('❌ Research failed:', error.message);

      if (error.message.includes('OPENROUTER_API_KEY')) {
        console.log('💡 Setup needed: Configure your OpenRouter API key');
        console.log('   Visit: https://openrouter.ai/');
      }

      throw error;
    }
  }

  displayResearchResults(result) {
    console.log('\n📋 Research Results Summary');
    console.log('═'.repeat(50));

    console.log(`🔍 Query: ${result.query}`);
    console.log(`📊 Insights Found: ${result.metadata.insightsFound}`);
    console.log(`🔗 Sources Searched: ${result.metadata.sourcesSearched}`);
    console.log(`⚡ Processing Time: ${result.metadata.processingTime}ms`);
    console.log(`🎯 Confidence: ${(result.summary.confidence * 100).toFixed(1)}%`);

    if (result.summary.text) {
      console.log('\n📝 Executive Summary:');
      console.log(result.summary.text);
    }

    if (result.insights && result.insights.length > 0) {
      console.log('\n💡 Key Insights:');
      result.insights.slice(0, 5).forEach((insight, i) => {
        const confidence = insight.confidence ? `(${(insight.confidence * 100).toFixed(0)}% conf)` : '';
        console.log(`${i + 1}. ${insight.content} ${confidence}`);
      });

      if (result.insights.length > 5) {
        console.log(`   ... and ${result.insights.length - 5} more insights`);
      }
    }

    if (result.results && result.results.length > 0) {
      console.log('\n🔗 Top Sources:');
      result.results.slice(0, 3).forEach((source, i) => {
        const score = source.aiScore ? `(${source.aiScore}/10)` : '';
        console.log(`${i + 1}. ${source.title} ${score}`);
        console.log(`   ${source.url}`);
      });
    }
  }

  async saveResearchResults(result) {
    try {
      const fs = require('fs').promises;
      const path = require('path');

      const filename = `research-${result.id}.json`;
      const filepath = path.join(process.cwd(), 'data', filename);

      await fs.mkdir(path.dirname(filepath), { recursive: true });

      const researchData = {
        ...result,
        savedAt: new Date().toISOString(),
        version: '1.0.0'
      };

      await fs.writeFile(filepath, JSON.stringify(researchData, null, 2));
      return filepath;

    } catch (error) {
      console.warn('⚠️ Could not save research results:', error.message);
    }
  }

  async getResearchHistory() {
    return this.aiScraper ? this.aiScraper.getResearchHistory() : [];
  }

  async clearResearchHistory() {
    if (this.aiScraper) {
      this.aiScraper.clearHistory();
      console.log('🧹 Research history cleared');
    }
  }

  async researchTeam(teamName, options = {}) {
    const query = `${teamName} basketball recent performance injuries news`;
    return await this.run({ query, ...options });
  }

  async researchLeague(leagueName, options = {}) {
    const query = `${leagueName} basketball league standings statistics trends`;
    return await this.run({ query, ...options });
  }

  async researchInjuries(teamName, options = {}) {
    const query = `${teamName} basketball injuries status updates`;
    return await this.run({ query, depth: 'focused', ...options });
  }
}

module.exports = new ResearchCommand();
