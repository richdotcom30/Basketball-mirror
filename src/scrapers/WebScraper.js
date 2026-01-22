// Mirror - Unlimited Web Scraper Engine
// Phase 1: Data Acquisition Engine

const puppeteer = require('puppeteer');
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;
const path = require('path');

class WebScraper {
  constructor(options = {}) {
    this.maxConcurrency = options.maxConcurrency || 10;
    this.timeout = options.timeout || 30000;
    this.userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ];

    // Primary game data sources - MAIN SOURCE FOR GAMES
    this.sources = {
      // Primary game source - Livescore for comprehensive global basketball coverage
      livescore: {
        name: 'Livescore Basketball',
        baseUrl: 'https://www.livescore.com',
        gamesEndpoint: '/en/basketball/',
        requiresBrowser: true,   // Livescore requires browser for dynamic content
        rateLimit: 5000,         // Higher rate limit for browser scraping
        priority: 1,             // Highest priority for game data
        waitForSelector: '[class*="match"], [class*="game"], [class*="event"]' // Wait for game elements
      },

      // Emergency backup sources (only if Livescore fails)
      nba: {
        name: 'NBA (Backup)',
        baseUrl: 'https://www.nba.com',
        gamesEndpoint: '/games',
        requiresBrowser: true,
        rateLimit: 5000,  // Higher rate limit for backup
        priority: 10      // Low priority
      }
    };

    // News/Research sources - MOVED TO AIScraper
    // These URLs are for news, updates, and research purposes only
    this.newsSources = {
      nba_news: {
        name: 'NBA News',
        baseUrl: 'https://www.nba.com',
        newsEndpoint: '/news',
        type: 'news'
      },
      euroleague_news: {
        name: 'EuroLeague News',
        baseUrl: 'https://www.euroleaguebasketball.net',
        newsEndpoint: '/news',
        type: 'news'
      },
      // ... other league news sources would go here
    };

    this.browser = null;
    this.activeRequests = new Set();
  }

  async initialize() {
    if (!this.browser) {
      try {
        console.log('🚀 Initializing browser for scraping...');
        this.browser = await puppeteer.launch({
          headless: 'new',
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
          ]
        });
        console.log('✅ Browser initialized successfully');
      } catch (error) {
        console.warn('⚠️  Browser initialization failed, falling back to HTTP-only mode:', error.message);
        console.log('🔄 Continuing with HTTP requests only...');
        this.browserMode = false;
      }
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  getRandomUserAgent() {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async makeRequest(url, options = {}) {
    const requestId = `${Date.now()}-${Math.random()}`;
    this.activeRequests.add(requestId);

    try {
      const config = {
        timeout: this.timeout,
        headers: {
          'User-Agent': this.getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          ...options.headers
        },
        ...options
      };

      const response = await axios.get(url, config);
      return response.data;
    } finally {
      this.activeRequests.delete(requestId);
    }
  }

  async scrapeWithBrowser(url, options = {}) {
    if (!this.browser) {
      await this.initialize();
    }

    const page = await this.browser.newPage();

    try {
      await page.setUserAgent(this.getRandomUserAgent());
      await page.setViewport({ width: 1366, height: 768 });

      // Set reasonable timeouts
      await page.setDefaultTimeout(this.timeout);
      await page.setDefaultNavigationTimeout(this.timeout);

      // Block unnecessary resources for speed
      await page.setRequestInterception(true);
      page.on('request', (req) => {
        const resourceType = req.resourceType();
        if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
          req.abort();
        } else {
          req.continue();
        }
      });

      console.log(`🌐 Navigating to ${url}...`);
      await page.goto(url, { waitUntil: 'networkidle2' });

      // Wait for dynamic content if needed
      if (options.waitForSelector) {
        await page.waitForSelector(options.waitForSelector, { timeout: 10000 });
      }

      const content = await page.content();
      return content;

    } catch (error) {
      console.error(`❌ Browser scraping failed for ${url}:`, error.message);
      throw error;
    } finally {
      await page.close();
    }
  }

  async scrapeSource(sourceKey, options = {}) {
    const source = this.sources[sourceKey];
    if (!source) {
      throw new Error(`Unknown source: ${sourceKey}`);
    }

    const url = `${source.baseUrl}${source.gamesEndpoint}`;
    console.log(`🔍 Scraping ${source.name} from ${url}...`);

    try {
      let html;

      if (source.requiresBrowser && this.browser) {
        // Try browser scraping first
        try {
          html = await this.scrapeWithBrowser(url, options);
        } catch (browserError) {
          console.warn(`⚠️  Browser scraping failed for ${source.name}, falling back to HTTP:`, browserError.message);
          html = await this.makeRequest(url);
        }
      } else {
        // Use HTTP request
        html = await this.makeRequest(url);
      }

      const games = await this.parseGames(html, sourceKey);

      // Respect rate limits
      if (source.rateLimit) {
        await this.delay(source.rateLimit);
      }

      return {
        source: sourceKey,
        games: games,
        timestamp: new Date().toISOString(),
        status: 'success'
      };

    } catch (error) {
      console.error(`❌ Failed to scrape ${source.name}:`, error.message);
      return {
        source: sourceKey,
        games: [],
        timestamp: new Date().toISOString(),
        status: 'error',
        error: error.message
      };
    }
  }

  async parseGames(html, sourceKey) {
    const $ = cheerio.load(html);
    const games = [];

    try {
      // Primary parsing logic - customized per source
      switch (sourceKey) {
        case 'livescore':
          // Livescore specific parsing - PRIMARY GAME SOURCE
          games.push(...this.parseLivescoreGames($));
          break;
        case 'nba':
          // NBA specific parsing (backup only)
          games.push(...this.parseNBAGames($));
          break;
        default:
          // Generic fallback
          games.push(...this.parseGenericGames($));
      }
    } catch (error) {
      console.error(`❌ Parsing failed for ${sourceKey}:`, error.message);
    }

    return games;
  }

  parseNBAGames($) {
    const games = [];
    // NBA.com specific parsing logic
    $('.game-card, .game-container, [data-game-id]').each((i, elem) => {
      try {
        const game = {
          id: $(elem).attr('data-game-id') || `nba-${Date.now()}-${i}`,
          league: 'NBA',
          homeTeam: $(elem).find('.home-team, .team-home').text().trim(),
          awayTeam: $(elem).find('.away-team, .team-away').text().trim(),
          date: $(elem).find('.game-date, .date').text().trim(),
          time: $(elem).find('.game-time, .time').text().trim(),
          status: $(elem).find('.game-status, .status').text().trim() || 'scheduled',
          source: 'nba'
        };

        if (game.homeTeam && game.awayTeam) {
          games.push(game);
        }
      } catch (error) {
        console.error(`❌ Error parsing NBA game ${i}:`, error.message);
      }
    });
    return games;
  }

  parseEuroLeagueGames($) {
    const games = [];
    // EuroLeague.net specific parsing
    $('.game-item, .match, [data-match-id]').each((i, elem) => {
      try {
        const game = {
          id: $(elem).attr('data-match-id') || `euro-${Date.now()}-${i}`,
          league: 'EuroLeague',
          homeTeam: $(elem).find('.home-team, .local-team').text().trim(),
          awayTeam: $(elem).find('.away-team, .visitor-team').text().trim(),
          date: $(elem).find('.date, .game-date').text().trim(),
          time: $(elem).find('.time, .game-time').text().trim(),
          status: 'scheduled',
          source: 'euroleague'
        };

        if (game.homeTeam && game.awayTeam) {
          games.push(game);
        }
      } catch (error) {
        console.error(`❌ Error parsing EuroLeague game ${i}:`, error.message);
      }
    });
    return games;
  }

  parseACBGames($) {
    const games = [];
    // ACB.com specific parsing
    $('.partido, .game, [data-partido-id]').each((i, elem) => {
      try {
        const game = {
          id: $(elem).attr('data-partido-id') || `acb-${Date.now()}-${i}`,
          league: 'Liga ACB',
          homeTeam: $(elem).find('.equipo-local, .home').text().trim(),
          awayTeam: $(elem).find('.equipo-visitante, .away').text().trim(),
          date: $(elem).find('.fecha, .date').text().trim(),
          time: $(elem).find('.hora, .time').text().trim(),
          status: 'scheduled',
          source: 'acb'
        };

        if (game.homeTeam && game.awayTeam) {
          games.push(game);
        }
      } catch (error) {
        console.error(`❌ Error parsing ACB game ${i}:`, error.message);
      }
    });
    return games;
  }

  // PRIMARY GAME PARSING - LIVESCORE
  parseLivescoreGames($) {
    const games = [];

    try {
      // Livescore.com uses various class patterns for games
      // Look for common game/match containers
      $('[class*="match"], [class*="event"], [class*="game"], .item, tr').each((i, elem) => {
        try {
          const $elem = $(elem);
          const text = $elem.text().trim();

          // Livescore often has team names in various formats
          // Look for patterns like "Team A vs Team B" or "Team A - Team B"
          const patterns = [
            /([^-:]+?)\s*vs\s*([^-:]+?)(?:\s|$)/i,
            /([^-:]+?)\s*-\s*([^-:]+?)(?:\s|$)/,
            /([^-:]+?)\s+vs\.?\s+([^-:]+?)(?:\s|$)/i
          ];

          for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match && match[1] && match[2]) {
              const homeTeam = match[1].trim();
              const awayTeam = match[2].trim();

              // Filter out invalid teams (too short, numbers, etc.)
              if (homeTeam.length > 2 && awayTeam.length > 2 &&
                  !/\d/.test(homeTeam) && !/\d/.test(awayTeam) &&
                  !homeTeam.toLowerCase().includes('live') &&
                  !awayTeam.toLowerCase().includes('live')) {

                // Try to extract league name from parent elements
                const league = $elem.closest('[class*="league"], [class*="tournament"]').find('[class*="name"], h2, h3').text().trim() ||
                              $elem.find('[class*="league"], [class*="tournament"]').text().trim() ||
                              'Basketball';

                // Generate unique ID
                const gameId = $elem.attr('id') || $elem.attr('data-id') || `livescore-${Date.now()}-${i}`;

                games.push({
                  id: gameId,
                  league: league || 'Basketball',
                  homeTeam: homeTeam,
                  awayTeam: awayTeam,
                  date: new Date().toISOString().split('T')[0], // Today's date
                  time: 'TBD', // Livescore often doesn't show times in basic view
                  status: 'scheduled',
                  source: 'livescore'
                });

                break; // Found a valid match, move to next element
              }
            }
          }
        } catch (error) {
          console.warn(`⚠️ Error parsing Livescore game ${i}:`, error.message);
        }
      });

      // Alternative approach: Look for structured data in scripts or specific containers
      if (games.length === 0) {
        console.log('🔄 Trying alternative Livescore parsing...');

        // Look for JSON data in scripts
        $('script').each((i, elem) => {
          const scriptContent = $(elem).html();
          if (scriptContent && scriptContent.includes('match') || scriptContent.includes('game')) {
            try {
              // Try to extract JSON-like data
              const jsonMatch = scriptContent.match(/\{[^}]*"match"[^}]*\}/g) ||
                               scriptContent.match(/\{[^}]*"game"[^}]*\}/g);
              if (jsonMatch) {
                console.log('📊 Found potential JSON data in script');
                // Could parse JSON here if needed
              }
            } catch (e) {
              // Ignore script parsing errors
            }
          }
        });
      }

      console.log(`🏀 Livescore parsing complete: Found ${games.length} games`);

    } catch (error) {
      console.error('❌ Livescore parsing failed:', error.message);
    }

    return games;
  }

  // PRIMARY GAME PARSING - FLASHSCORE
  parseFlashscoreGames($) {
    const games = [];

    try {
      // Flashscore uses dynamic content with specific classes
      // Look for event__match elements or similar patterns
      $('.event__match, [class*="event"], [id*="match"]').each((i, elem) => {
        try {
          const $elem = $(elem);

          // Extract teams - Flashscore typically has home/away team classes
          const homeTeam = $elem.find('.event__participant--home, .home, [class*="home"]').text().trim() ||
                          $elem.find('.event__homeParticipant').text().trim();

          const awayTeam = $elem.find('.event__participant--away, .away, [class*="away"]').text().trim() ||
                          $elem.find('.event__awayParticipant').text().trim();

          // Extract time/date
          const time = $elem.find('.event__time, .time, [class*="time"]').text().trim() ||
                      $elem.find('.event__startTime').text().trim();

          // Extract league/tournament name
          const league = $elem.closest('[class*="tournament"], [class*="league"]').find('.event__title, .tournament-name').text().trim() ||
                        $elem.find('.event__tournament').text().trim() ||
                        'Basketball';

          // Generate unique ID
          const gameId = $elem.attr('id') || $elem.attr('data-id') || `flashscore-${Date.now()}-${i}`;

          if (homeTeam && awayTeam) {
            games.push({
              id: gameId,
              league: league || 'Basketball',
              homeTeam: homeTeam,
              awayTeam: awayTeam,
              date: new Date().toISOString().split('T')[0], // Today's date
              time: time || 'TBD',
              status: 'scheduled',
              source: 'flashscore'
            });
          }
        } catch (error) {
          console.warn(`⚠️ Error parsing Flashscore game ${i}:`, error.message);
        }
      });

      // If no games found with primary selectors, try alternative patterns
      if (games.length === 0) {
        console.log('🔄 Trying alternative Flashscore parsing patterns...');

        // Look for any elements containing team names and "vs" or "-"
        $('tr, .item, [class*="match"]').each((i, elem) => {
          const text = $(elem).text().trim();

          // Look for patterns like "Team A vs Team B" or "Team A - Team B"
          const vsPattern = /([^-:]+?)\s*(?:vs|VS|-\s*)\s*([^-:]+?)(?:\s|$)/;
          const match = text.match(vsPattern);

          if (match && match[1] && match[2]) {
            const homeTeam = match[1].trim();
            const awayTeam = match[2].trim();

            // Skip if teams are too short or contain numbers/dates
            if (homeTeam.length > 2 && awayTeam.length > 2 &&
                !/\d/.test(homeTeam) && !/\d/.test(awayTeam)) {

              games.push({
                id: `flashscore-alt-${Date.now()}-${i}`,
                league: 'Basketball',
                homeTeam: homeTeam,
                awayTeam: awayTeam,
                date: new Date().toISOString().split('T')[0],
                time: 'TBD',
                status: 'scheduled',
                source: 'flashscore'
              });
            }
          }
        });
      }

      console.log(`🏀 Flashscore parsing complete: Found ${games.length} games`);

    } catch (error) {
      console.error('❌ Flashscore parsing failed:', error.message);
    }

    return games;
  }

  parseFlashscoreMobileGames($) {
    const games = [];

    try {
      // Mobile version parsing - simpler structure
      $('.match, [class*="game"], li').each((i, elem) => {
        try {
          const $elem = $(elem);
          const text = $elem.text().trim();

          // Mobile version often has simpler text patterns
          const patterns = [
            /([^-:]+?)\s*vs\s*([^-:]+?)(?:\s|$)/i,
            /([^-:]+?)\s*-\s*([^-:]+?)(?:\s|$)/
          ];

          for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match && match[1] && match[2]) {
              const homeTeam = match[1].trim();
              const awayTeam = match[2].trim();

              if (homeTeam.length > 2 && awayTeam.length > 2) {
                games.push({
                  id: `flashscore-mobile-${Date.now()}-${i}`,
                  league: 'Basketball',
                  homeTeam: homeTeam,
                  awayTeam: awayTeam,
                  date: new Date().toISOString().split('T')[0],
                  time: 'TBD',
                  status: 'scheduled',
                  source: 'flashscore_mobile'
                });
                break; // Found a match, move to next element
              }
            }
          }
        } catch (error) {
          console.warn(`⚠️ Error parsing mobile Flashscore game ${i}:`, error.message);
        }
      });

      console.log(`📱 Flashscore Mobile parsing complete: Found ${games.length} games`);

    } catch (error) {
      console.error('❌ Flashscore Mobile parsing failed:', error.message);
    }

    return games;
  }

  parseGenericGames($) {
    const games = [];
    // Generic fallback parsing for unknown sources
    $('[class*="game"], [class*="match"], [class*="partido"]').each((i, elem) => {
      try {
        const text = $(elem).text().trim();
        // Very basic parsing - look for vs or @ patterns
        const vsMatch = text.match(/(.+?)\s+vs\.?\s+(.+?)(?:\s+|$)/i);
        const atMatch = text.match(/(.+?)\s+@\s+(.+?)(?:\s+|$)/i);

        let homeTeam, awayTeam;
        if (vsMatch) {
          homeTeam = vsMatch[1].trim();
          awayTeam = vsMatch[2].trim();
        } else if (atMatch) {
          awayTeam = atMatch[1].trim();
          homeTeam = atMatch[2].trim();
        }

        if (homeTeam && awayTeam) {
          games.push({
            id: `generic-${Date.now()}-${i}`,
            league: 'Unknown',
            homeTeam,
            awayTeam,
            status: 'scheduled',
            source: 'generic'
          });
        }
      } catch (error) {
        // Silently ignore parsing errors for generic fallback
      }
    });
    return games;
  }

  async scrapeAllSources(options = {}) {
    const { maxConcurrency = this.maxConcurrency, selectedSources = null } = options;

    await this.initialize();

    const sourcesToScrape = selectedSources ?
      selectedSources.filter(s => this.sources[s]) :
      Object.keys(this.sources);

    console.log(`🔍 Starting unlimited scraping for ${sourcesToScrape.length} sources...`);
    console.log(`⚡ Max concurrency: ${maxConcurrency}`);

    const results = [];
    const batches = this.chunkArray(sourcesToScrape, maxConcurrency);

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`📦 Processing batch ${i + 1}/${batches.length} (${batch.length} sources)`);

      const batchPromises = batch.map(sourceKey =>
        this.scrapeSource(sourceKey, options)
      );

      const batchResults = await Promise.allSettled(batchPromises);

      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          console.error('❌ Batch scraping error:', result.reason);
          results.push({
            source: 'unknown',
            games: [],
            status: 'error',
            error: result.reason.message
          });
        }
      }

      // Progress update
      const totalGames = results.reduce((sum, r) => sum + r.games.length, 0);
      console.log(`✅ Batch ${i + 1} complete. Total games found: ${totalGames}`);
    }

    await this.close();

    const summary = {
      totalSources: sourcesToScrape.length,
      successfulSources: results.filter(r => r.status === 'success').length,
      totalGames: results.reduce((sum, r) => sum + r.games.length, 0),
      results: results,
      timestamp: new Date().toISOString()
    };

    console.log(`🎯 Scraping complete! Found ${summary.totalGames} games from ${summary.successfulSources}/${summary.totalSources} sources`);

    return summary;
  }

  chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  async saveResults(results, filename = null) {
    if (!filename) {
      filename = `scrape-results-${Date.now()}.json`;
    }

    const filepath = path.join(process.cwd(), 'data', filename);

    try {
      await fs.mkdir(path.dirname(filepath), { recursive: true });
      await fs.writeFile(filepath, JSON.stringify(results, null, 2));
      console.log(`💾 Results saved to ${filepath}`);
      return filepath;
    } catch (error) {
      console.error('❌ Failed to save results:', error.message);
      throw error;
    }
  }
}

module.exports = WebScraper;
