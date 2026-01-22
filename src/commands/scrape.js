// Mirror - Scrape Command
// Unlimited web scraping for basketball data with parallel processing

const ParallelProcessingEngine = require('../core/ParallelProcessingEngine');

class ScrapeCommand {
  constructor() {
    this.parallelEngine = null;
  }

  async run(options) {
    console.log('🔍 Mirror Scraper - Phase 6: Parallel Processing Engine');
    console.log(`Sources: ${options.sources}`);
    console.log(`Parallel: ${options.parallel}`);

    try {
      // Initialize parallel processing engine
      this.parallelEngine = new ParallelProcessingEngine({
        maxWorkers: Math.min(parseInt(options.parallel) || 10, 20), // Cap at 20 for safety
        taskTimeout: 45000, // 45 seconds for scraping tasks
        maxRetries: 2
      });

      // Determine which sources to scrape
      let selectedSources = null;
      if (options.sources && options.sources !== 'all') {
        selectedSources = options.sources.split(',').map(s => s.trim());
        console.log(`🎯 Targeting specific sources: ${selectedSources.join(', ')}`);
      } else {
        console.log('🌍 Scraping all available sources with parallel processing...');
        // Get sources from WebScraper instance
        const WebScraper = require('../scrapers/WebScraper');
        const scraper = new WebScraper();
        selectedSources = Object.keys(scraper.sources || {});
      }

      // Use parallel processing for unlimited concurrent scraping
      const results = await this.parallelEngine.parallelScrapeSources(
        selectedSources,
        {
          maxConcurrency: parseInt(options.parallel) || 10
        }
      );

      // Process results
      const totalGames = results.results.reduce((sum, result) => {
        return sum + (result.games ? result.games.length : 0);
      }, 0);

      const successfulSources = results.results.filter(result =>
        result.status === 'success'
      ).length;

      // Save results
      const filename = `scrape-results-${Date.now()}.json`;
      await this.saveResults(results, filename);

      console.log(`✅ Parallel scraping complete!`);
      console.log(`📊 Processed ${results.results.length} sources concurrently`);
      console.log(`🏀 Found ${totalGames} games from ${successfulSources} successful sources`);

      return {
        sources: options.sources,
        parallel: parseInt(options.parallel),
        totalSources: results.results.length,
        successfulSources,
        totalGames,
        status: 'success',
        resultsFile: filename,
        parallelMetrics: this.parallelEngine.getMetrics()
      };

    } catch (error) {
      console.error('❌ Parallel scraping operation failed:', error.message);
      throw error;
    } finally {
      // Clean up parallel engine
      if (this.parallelEngine) {
        await this.parallelEngine.shutdown();
      }
    }
  }

  async saveResults(results, filename) {
    try {
      const fs = require('fs').promises;
      const path = require('path');

      const filepath = path.join(process.cwd(), 'data', filename);

      await fs.mkdir(path.dirname(filepath), { recursive: true });

      const dataToSave = {
        timestamp: new Date().toISOString(),
        summary: {
          totalSources: results.results.length,
          successfulSources: results.results.filter(r => r.status === 'success').length,
          failedSources: results.errors.length,
          totalGames: results.results.reduce((sum, r) => sum + (r.games ? r.games.length : 0), 0)
        },
        results: results.results,
        errors: results.errors,
        parallelMetrics: this.parallelEngine ? this.parallelEngine.getMetrics() : null
      };

      await fs.writeFile(filepath, JSON.stringify(dataToSave, null, 2));
      console.log(`💾 Results saved to ${filepath} (${results.results.length} source results)`);

      return filepath;

    } catch (error) {
      console.warn('⚠️ Could not save results:', error.message);
    }
  }
}

module.exports = new ScrapeCommand();
