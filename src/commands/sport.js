// Mirror - Multi-Sport Command
// Phase 9: Continuous Evolution - Expanding beyond basketball

const MultiSportEngine = require('../core/MultiSportEngine');

class SportCommand {
  constructor() {
    this.multiSportEngine = null;
  }

  async run(options) {
    console.log('🏆 Mirror Multi-Sport System - Phase 9: Continuous Evolution');

    try {
      // Initialize multi-sport engine
      this.multiSportEngine = new MultiSportEngine();

      if (options.list) {
        // List all supported sports
        await this.listSports();

      } else if (options.switch) {
        // Switch to a different sport
        await this.switchSport(options.switch);

      } else if (options.info) {
        // Show sport information
        await this.showSportInfo(options.info);

      } else if (options.add) {
        // Add a new sport (future feature)
        console.log('⚠️  Adding custom sports coming in Phase 9.2');

      } else if (options.stats) {
        // Show sport statistics
        await this.showSportStatistics();

      } else if (options.markets) {
        // Show betting markets for current sport
        await this.showBettingMarkets(options.markets);

      } else if (options.factors) {
        // Show prediction factors for current sport
        await this.showPredictionFactors(options.factors);

      } else if (options.leagues) {
        // Show leagues for current sport
        await this.showLeagues(options.leagues);

      } else {
        // Default: Show current sport status
        await this.showCurrentSportStatus();
      }

    } catch (error) {
      console.error('❌ Multi-sport command failed:', error.message);
      throw error;
    }
  }

  async listSports() {
    console.log('📋 Supported Sports');
    console.log('═'.repeat(60));

    try {
      await this.multiSportEngine.initialize();
      const sports = await this.multiSportEngine.getSupportedSports();

      console.log('Available sports for prediction:');
      console.log('');

      sports.forEach((sport, index) => {
        const active = sport.id === this.multiSportEngine.currentSport ? ' 🏆 ACTIVE' : '';
        console.log(`${index + 1}. ${sport.name}${active}`);
        console.log(`   Leagues: ${sport.leagues}`);
        console.log(`   Markets: ${sport.markets}`);
        console.log('');
      });

      console.log('💡 Use "mirror sport --switch <sport>" to change active sport');
      console.log('💡 Use "mirror sport --info <sport>" for detailed information');

    } catch (error) {
      console.log('❌ Failed to list sports:', error.message);
    }
  }

  async switchSport(sportName) {
    console.log(`🔄 Switching to sport: ${sportName}`);
    console.log('═'.repeat(40));

    try {
      await this.multiSportEngine.initialize();
      const sportConfig = await this.multiSportEngine.switchSport(sportName);

      console.log(`✅ Successfully switched to: ${sportConfig.name}`);
      console.log('');
      console.log('Sport Details:');
      console.log(`  • Leagues: ${sportConfig.leagues.length}`);
      console.log(`  • Prediction Factors: ${sportConfig.predictionFactors.length}`);
      console.log(`  • Betting Markets: ${sportConfig.bettingMarkets.length}`);
      console.log(`  • Scoring Type: ${sportConfig.scoringSystem.type}`);

      console.log('');
      console.log('💡 All future predictions will use this sport\'s configuration');
      console.log('💡 Use "mirror predict" to generate predictions for this sport');

    } catch (error) {
      console.log('❌ Failed to switch sport:', error.message);
      console.log('💡 Use "mirror sport --list" to see available sports');
    }
  }

  async showCurrentSportStatus() {
    console.log('🏆 Current Sport Status');
    console.log('═'.repeat(40));

    try {
      await this.multiSportEngine.initialize();
      const currentConfig = this.multiSportEngine.getCurrentSportConfig();

      if (!currentConfig) {
        console.log('❌ No sport currently selected');
        return;
      }

      console.log(`Active Sport: ${currentConfig.name}`);
      console.log(`Sport ID: ${this.multiSportEngine.currentSport}`);
      console.log('');

      console.log('Configuration:');
      console.log(`  • Leagues Supported: ${currentConfig.leagues.length}`);
      console.log(`  • Prediction Factors: ${currentConfig.predictionFactors.length}`);
      console.log(`  • Betting Markets: ${currentConfig.bettingMarkets.length}`);
      console.log('');

      console.log('Scoring System:');
      console.log(`  • Type: ${currentConfig.scoringSystem.type}`);
      if (currentConfig.scoringSystem.periods) {
        console.log(`  • Periods: ${currentConfig.scoringSystem.periods}`);
      }
      if (currentConfig.scoringSystem.periodLength) {
        console.log(`  • Period Length: ${currentConfig.scoringSystem.periodLength} minutes`);
      }
      console.log('');

      console.log('Top Leagues:');
      const topLeagues = currentConfig.leagues.slice(0, 5);
      topLeagues.forEach((league, index) => {
        console.log(`  ${index + 1}. ${league}`);
      });
      if (currentConfig.leagues.length > 5) {
        console.log(`  ... and ${currentConfig.leagues.length - 5} more`);
      }

    } catch (error) {
      console.log('❌ Failed to show sport status:', error.message);
    }
  }

  async showSportInfo(sportName) {
    console.log(`📊 Sport Information: ${sportName}`);
    console.log('═'.repeat(50));

    try {
      await this.multiSportEngine.initialize();
      const sportConfig = this.multiSportEngine.supportedSports[sportName];

      if (!sportConfig) {
        console.log(`❌ Sport not found: ${sportName}`);
        console.log('💡 Use "mirror sport --list" to see available sports');
        return;
      }

      console.log(`Name: ${sportConfig.name}`);
      console.log(`ID: ${sportName}`);
      console.log(`Active: ${sportName === this.multiSportEngine.currentSport ? 'Yes' : 'No'}`);
      console.log('');

      console.log('Leagues:');
      sportConfig.leagues.forEach((league, index) => {
        console.log(`  ${index + 1}. ${league}`);
      });

      console.log('');
      console.log('Prediction Factors:');
      sportConfig.predictionFactors.forEach((factor, index) => {
        console.log(`  ${index + 1}. ${factor.replace(/_/g, ' ')}`);
      });

      console.log('');
      console.log('Betting Markets:');
      sportConfig.bettingMarkets.forEach((market, index) => {
        console.log(`  ${index + 1}. ${market.replace(/_/g, ' ')}`);
      });

      console.log('');
      console.log('Scoring System:');
      Object.entries(sportConfig.scoringSystem).forEach(([key, value]) => {
        console.log(`  • ${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}: ${value}`);
      });

    } catch (error) {
      console.log('❌ Failed to show sport info:', error.message);
    }
  }

  async showSportStatistics() {
    console.log('📈 Multi-Sport Statistics');
    console.log('═'.repeat(50));

    try {
      await this.multiSportEngine.initialize();
      const stats = await this.multiSportEngine.getSportStatistics();

      console.log('Sport Coverage Summary:');
      console.log('');

      Object.entries(stats).forEach(([sportId, sportStats]) => {
        const active = sportStats.isActive ? ' 🏆' : '';
        console.log(`${sportStats.name}${active}`);
        console.log(`  Leagues: ${sportStats.leaguesCount}`);
        console.log(`  Factors: ${sportStats.factorsCount}`);
        console.log(`  Markets: ${sportStats.marketsCount}`);
        console.log('');
      });

      const totalSports = Object.keys(stats).length;
      const totalLeagues = Object.values(stats).reduce((sum, sport) => sum + sport.leaguesCount, 0);

      console.log('Overall Statistics:');
      console.log(`  • Total Sports: ${totalSports}`);
      console.log(`  • Total Leagues: ${totalLeagues}`);
      console.log(`  • Active Sport: ${Object.values(stats).find(s => s.isActive)?.name || 'None'}`);

    } catch (error) {
      console.log('❌ Failed to show sport statistics:', error.message);
    }
  }

  async showBettingMarkets(sportName = null) {
    const sport = sportName || 'current sport';
    console.log(`💰 Betting Markets: ${sport}`);
    console.log('═'.repeat(40));

    try {
      await this.multiSportEngine.initialize();
      const markets = await this.multiSportEngine.getSportBettingMarkets(sportName);

      console.log('Available betting markets:');
      console.log('');

      markets.forEach((market, index) => {
        const displayName = market.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        console.log(`  ${index + 1}. ${displayName}`);
      });

      console.log('');
      console.log(`💡 Total markets: ${markets.length}`);
      console.log('💡 Markets vary by sport and bookmaker');

    } catch (error) {
      console.log('❌ Failed to show betting markets:', error.message);
    }
  }

  async showPredictionFactors(sportName = null) {
    const sport = sportName || 'current sport';
    console.log(`🧠 Prediction Factors: ${sport}`);
    console.log('═'.repeat(45));

    try {
      await this.multiSportEngine.initialize();
      const factors = await this.multiSportEngine.getSportPredictionFactors(sportName);

      console.log('Factors used in predictions:');
      console.log('');

      factors.forEach((factor, index) => {
        const displayName = factor.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        console.log(`  ${index + 1}. ${displayName}`);
      });

      console.log('');
      console.log(`🧮 Total factors: ${factors.length}`);
      console.log('⚖️  Each factor is weighted and combined for predictions');

    } catch (error) {
      console.log('❌ Failed to show prediction factors:', error.message);
    }
  }

  async showLeagues(sportName = null) {
    const sport = sportName || 'current sport';
    console.log(`🏆 Leagues: ${sport}`);
    console.log('═'.repeat(30));

    try {
      await this.multiSportEngine.initialize();
      const leagues = await this.multiSportEngine.getSportLeagues(sportName);

      console.log('Supported leagues:');
      console.log('');

      // Group leagues by region for better display
      const regions = this.groupLeaguesByRegion(leagues, sportName);

      Object.entries(regions).forEach(([region, regionLeagues]) => {
        console.log(`${region}:`);
        regionLeagues.forEach(league => {
          console.log(`  • ${league}`);
        });
        console.log('');
      });

      console.log(`📊 Total leagues: ${leagues.length}`);

    } catch (error) {
      console.log('❌ Failed to show leagues:', error.message);
    }
  }

  groupLeaguesByRegion(leagues, sportName) {
    const sport = sportName || this.multiSportEngine.currentSport;
    const regions = {};

    leagues.forEach(league => {
      let region = 'Other';

      // Sport-specific region detection
      switch (sport) {
        case 'basketball':
          if (league.includes('NBA') || league.includes('WNBA')) {
            region = 'North America';
          } else if (league.includes('EuroLeague') || league.includes('EuroCup') ||
                     league.includes('Basketball Champions League')) {
            region = 'Europe';
          } else if (league.includes('Liga ACB') || league.includes('BSL') ||
                     league.includes('Greek') || league.includes('LNB') ||
                     league.includes('Bundesliga') || league.includes('Lega') ||
                     league.includes('KLS') || league.includes('LKL') ||
                     league.includes('Adriatic')) {
            region = 'Europe';
          } else if (league.includes('CBA')) {
            region = 'Asia';
          } else if (league.includes('B.League')) {
            region = 'Asia';
          } else if (league.includes('KBL')) {
            region = 'Asia';
          } else if (league.includes('PBA')) {
            region = 'Asia';
          } else if (league.includes('ABL')) {
            region = 'Asia';
          } else if (league.includes('NBL')) {
            region = 'Oceania';
          }
          break;

        case 'football':
          if (league.includes('Premier League') || league.includes('Championship') ||
              league.includes('EFL') || league.includes('Scottish')) {
            region = 'United Kingdom';
          } else if (league.includes('La Liga') || league.includes('La Liga 2')) {
            region = 'Spain';
          } else if (league.includes('Bundesliga')) {
            region = 'Germany';
          } else if (league.includes('Serie A') || league.includes('Serie B')) {
            region = 'Italy';
          } else if (league.includes('Ligue 1') || league.includes('Ligue 2')) {
            region = 'France';
          } else if (league.includes('Champions League') || league.includes('Europa League') ||
                     league.includes('Conference League')) {
            region = 'Europe';
          } else if (league.includes('Brasileirão')) {
            region = 'South America';
          } else if (league.includes('Primera División')) {
            region = 'South America';
          } else if (league.includes('MLS')) {
            region = 'North America';
          }
          break;

        case 'american_football':
          if (league.includes('NFL')) {
            region = 'North America';
          } else if (league.includes('NCAA')) {
            region = 'North America';
          } else if (league.includes('CFL')) {
            region = 'North America';
          }
          break;

        case 'tennis':
          if (league.includes('ATP') || league.includes('WTA') ||
              league.includes('Grand Slam') || league.includes('Davis Cup') ||
              league.includes('Billie Jean King Cup') || league.includes('Olympics')) {
            region = 'International';
          }
          break;
      }

      if (!regions[region]) {
        regions[region] = [];
      }
      regions[region].push(league);
    });

    return regions;
  }

  async testSportPrediction(sportName, testData = {}) {
    console.log(`🧪 Testing ${sportName} prediction factors`);
    console.log('═'.repeat(45));

    try {
      await this.multiSportEngine.initialize();

      // Generate sample game data
      const sampleGame = {
        homeTeam: 'Sample Home',
        awayTeam: 'Sample Away',
        isHome: true,
        recentWins: 0.6,
        teamOffRating: 105,
        teamDefRating: 98,
        oppOffRating: 102,
        oppDefRating: 101,
        restDays: 2,
        injuryFactor: 0.1,
        travelDistance: 500,
        ...testData
      };

      const factors = await this.multiSportEngine.adaptPredictionFactors(sampleGame, sportName);

      console.log('Sample Game:', sampleGame.homeTeam, 'vs', sampleGame.awayTeam);
      console.log('');
      console.log('Adapted Factors:');

      Object.entries(factors).forEach(([factor, value]) => {
        const displayName = factor.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        const bars = '█'.repeat(Math.round(value * 20));
        console.log(`  ${displayName.padEnd(25)}: ${(value * 100).toFixed(1).padStart(5)}% ${bars}`);
      });

      console.log('');
      console.log('💡 Higher percentages indicate stronger positive factors');

    } catch (error) {
      console.log('❌ Failed to test sport prediction:', error.message);
    }
  }
}

module.exports = new SportCommand();
