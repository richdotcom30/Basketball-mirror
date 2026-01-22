// Mirror - Multi-Sport Engine
// Phase 9: Continuous Evolution - Expanding beyond basketball

const fs = require('fs').promises;
const path = require('path');

class MultiSportEngine {
  constructor(options = {}) {
    this.sportsConfigPath = options.configPath || path.join(process.cwd(), 'data', 'sports');
    this.supportedSports = {};
    this.currentSport = 'basketball'; // Default to basketball
    this.isInitialized = false;
  }

  async initialize() {
    try {
      // Create sports configuration directory
      await fs.mkdir(this.sportsConfigPath, { recursive: true });

      // Initialize default sports configurations
      await this.initializeDefaultSports();

      // Load existing sport configurations
      await this.loadSportConfigurations();

      this.isInitialized = true;
      console.log('🏆 Multi-Sport Engine initialized');

    } catch (error) {
      console.error('Failed to initialize multi-sport engine:', error.message);
      throw error;
    }
  }

  async initializeDefaultSports() {
    // Basketball (existing support)
    this.supportedSports.basketball = {
      name: 'Basketball',
      leagues: [
        'NBA', 'WNBA', 'EuroLeague', 'EuroCup', 'Basketball Champions League',
        'Liga ACB', 'BSL Turkey', 'Greek Basket League', 'LNB Pro A',
        'Basketball Bundesliga', 'Lega Basket Serie A', 'KLS Serbia',
        'LKL Lithuania', 'Adriatic League', 'CBA China', 'B.League Japan',
        'KBL Korea', 'PBA Philippines', 'ABL ASEAN', 'NBL Australia'
      ],
      predictionFactors: [
        'home_advantage', 'recent_form', 'head_to_head',
        'offensive_rating', 'defensive_rating', 'pace_factor',
        'rest_advantage', 'travel_distance', 'injury_impact',
        'matchup_rating', 'line_movement', 'public_money'
      ],
      scoringSystem: {
        type: 'points',
        overtime: true,
        quarters: 4,
        periodLength: 12 // minutes
      },
      bettingMarkets: [
        'moneyline', 'spread', 'total_points', 'team_total',
        'player_points', 'player_rebounds', 'player_assists'
      ]
    };

    // Football (Soccer) - New addition
    this.supportedSports.football = {
      name: 'Football (Soccer)',
      leagues: [
        'Premier League', 'La Liga', 'Bundesliga', 'Serie A', 'Ligue 1',
        'Champions League', 'Europa League', 'Conference League',
        'EFL Championship', 'La Liga 2', 'Serie B', 'Ligue 2',
        'Eredivisie', 'Primeira Liga', 'Scottish Premiership',
        'Brasileirão', 'Primera División Argentina', 'MLS'
      ],
      predictionFactors: [
        'home_advantage', 'recent_form', 'head_to_head',
        'defensive_strength', 'offensive_strength', 'possession_stats',
        'set_piece_efficiency', 'injury_impact', 'squad_depth',
        'manager_rating', 'travel_distance', 'fixture_congestion',
        'motivation_factors', 'weather_impact'
      ],
      scoringSystem: {
        type: 'goals',
        overtime: false,
        periods: 2,
        periodLength: 45, // minutes
        extraTime: true,
        penalties: true
      },
      bettingMarkets: [
        'match_result', 'both_teams_score', 'over_under', 'correct_score',
        'first_goalscorer', 'player_shots', 'player_cards', 'corners'
      ]
    };

    // American Football - New addition
    this.supportedSports.american_football = {
      name: 'American Football',
      leagues: [
        'NFL', 'NCAA Division I FBS', 'CFL', 'XFL',
        'NFL Europe (defunct)', 'Arena Football League'
      ],
      predictionFactors: [
        'home_advantage', 'recent_form', 'head_to_head',
        'offensive_rating', 'defensive_rating', 'turnover_differential',
        'field_position', 'red_zone_efficiency', 'injury_impact',
        'weather_conditions', 'travel_distance', 'bye_week_impact',
        'qb_rating', 'run_pass_ratio', 'special_teams'
      ],
      scoringSystem: {
        type: 'points',
        overtime: true,
        quarters: 4,
        periodLength: 15, // minutes
        twoPointConversion: true,
        extraPoint: true,
        fieldGoals: true
      },
      bettingMarkets: [
        'moneyline', 'spread', 'total_points', 'team_total',
        'player_passing', 'player_rushing', 'player_receiving',
        'first_touchdown', 'prop_bets'
      ]
    };

    // Tennis - New addition
    this.supportedSports.tennis = {
      name: 'Tennis',
      leagues: [
        'ATP Tour', 'WTA Tour', 'Grand Slam', 'ATP Masters 1000',
        'ATP 500', 'ATP 250', 'WTA Premier', 'WTA International',
        'Davis Cup', 'Billie Jean King Cup', 'Olympics'
      ],
      predictionFactors: [
        'recent_form', 'head_to_head', 'surface_preference',
        'ranking_difference', 'ace_percentage', 'break_points',
        'serve_speed', 'return_games_won', 'fatigue_factor',
        'injury_status', 'tournament_stage', 'court_conditions',
        'psychological_factors', 'coach_influence'
      ],
      scoringSystem: {
        type: 'sets',
        sets: 'best_of_3_or_5',
        tiebreak: true,
        advantageScoring: true,
        noAdScoring: true
      },
      bettingMarkets: [
        'match_winner', 'set_betting', 'games_handicap', 'total_games',
        'player_to_win_set', 'correct_score', 'aces_over_under',
        'double_faults', 'tiebreaks'
      ]
    };

    // Save default configurations
    await this.saveSportConfigurations();
    console.log('📊 Default sport configurations initialized');
  }

  async loadSportConfigurations() {
    try {
      const configFile = path.join(this.sportsConfigPath, 'sports-config.json');

      const data = await fs.readFile(configFile, 'utf8');
      const loadedSports = JSON.parse(data);

      // Merge with existing configurations
      this.supportedSports = { ...this.supportedSports, ...loadedSports };

      console.log('📚 Sport configurations loaded');

    } catch (error) {
      console.log('No existing sport configurations found, using defaults');
    }
  }

  async saveSportConfigurations() {
    try {
      const configFile = path.join(this.sportsConfigPath, 'sports-config.json');
      await fs.writeFile(configFile, JSON.stringify(this.supportedSports, null, 2));
      console.log('💾 Sport configurations saved');
    } catch (error) {
      console.error('Failed to save sport configurations:', error.message);
    }
  }

  async switchSport(sportName) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.supportedSports[sportName]) {
      throw new Error(`Unsupported sport: ${sportName}. Available: ${Object.keys(this.supportedSports).join(', ')}`);
    }

    this.currentSport = sportName;
    console.log(`🏆 Switched to sport: ${this.supportedSports[sportName].name}`);

    return this.getCurrentSportConfig();
  }

  getCurrentSportConfig() {
    return this.supportedSports[this.currentSport] || null;
  }

  async getSupportedSports() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return Object.keys(this.supportedSports).map(key => ({
      id: key,
      name: this.supportedSports[key].name,
      leagues: this.supportedSports[key].leagues.length,
      markets: this.supportedSports[key].bettingMarkets.length
    }));
  }

  async getSportLeagues(sportName = null) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const sport = sportName || this.currentSport;
    const sportConfig = this.supportedSports[sport];

    if (!sportConfig) {
      throw new Error(`Sport not found: ${sport}`);
    }

    return sportConfig.leagues;
  }

  async getSportBettingMarkets(sportName = null) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const sport = sportName || this.currentSport;
    const sportConfig = this.supportedSports[sport];

    if (!sportConfig) {
      throw new Error(`Sport not found: ${sport}`);
    }

    return sportConfig.bettingMarkets;
  }

  async getSportPredictionFactors(sportName = null) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const sport = sportName || this.currentSport;
    const sportConfig = this.supportedSports[sport];

    if (!sportConfig) {
      throw new Error(`Sport not found: ${sport}`);
    }

    return sportConfig.predictionFactors;
  }

  async getSportScoringSystem(sportName = null) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const sport = sportName || this.currentSport;
    const sportConfig = this.supportedSports[sport];

    if (!sportConfig) {
      throw new Error(`Sport not found: ${sport}`);
    }

    return sportConfig.scoringSystem;
  }

  async adaptPredictionFactors(gameData, sportName = null) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const sport = sportName || this.currentSport;
    const sportConfig = this.supportedSports[sport];

    if (!sportConfig) {
      throw new Error(`Sport not found: ${sport}`);
    }

    // Adapt factors based on sport-specific requirements
    const adaptedFactors = {};

    for (const factor of sportConfig.predictionFactors) {
      switch (factor) {
        case 'home_advantage':
          adaptedFactors[factor] = gameData.isHome ? this.getHomeAdvantageMultiplier(sport) : 0;
          break;
        case 'recent_form':
          adaptedFactors[factor] = this.calculateRecentForm(gameData, sport);
          break;
        case 'head_to_head':
          adaptedFactors[factor] = this.calculateHeadToHead(gameData, sport);
          break;
        case 'offensive_rating':
        case 'offensive_strength':
          adaptedFactors[factor] = this.adaptOffensiveRating(gameData, sport);
          break;
        case 'defensive_rating':
        case 'defensive_strength':
          adaptedFactors[factor] = this.adaptDefensiveRating(gameData, sport);
          break;
        case 'pace_factor':
        case 'possession_stats':
          adaptedFactors[factor] = this.adaptPacePossession(gameData, sport);
          break;
        case 'injury_impact':
          adaptedFactors[factor] = this.calculateInjuryImpact(gameData, sport);
          break;
        case 'travel_distance':
          adaptedFactors[factor] = this.calculateTravelImpact(gameData, sport);
          break;
        case 'rest_advantage':
        case 'fixture_congestion':
          adaptedFactors[factor] = this.calculateRestAdvantage(gameData, sport);
          break;
        default:
          adaptedFactors[factor] = gameData[factor] || Math.random() * 0.5 + 0.25; // Default random factor
      }
    }

    return adaptedFactors;
  }

  getHomeAdvantageMultiplier(sport) {
    const multipliers = {
      basketball: 1.15,
      football: 1.25,
      american_football: 1.10,
      tennis: 1.05 // Less home advantage in tennis
    };
    return multipliers[sport] || 1.0;
  }

  calculateRecentForm(gameData, sport) {
    // Sport-specific recent form calculation
    const baseForm = gameData.recentWins || 0.5;

    switch (sport) {
      case 'basketball':
        return baseForm * (gameData.recentGames || 10) / 10;
      case 'football':
        return baseForm * (gameData.recentMatches || 5) / 5;
      case 'american_football':
        return baseForm * (gameData.recentGames || 8) / 8;
      case 'tennis':
        return baseForm * (gameData.recentTournaments || 3) / 3;
      default:
        return baseForm;
    }
  }

  calculateHeadToHead(gameData, sport) {
    // Sport-specific head-to-head calculation
    const h2h = gameData.headToHead || { wins: 0, losses: 0, draws: 0 };
    const total = h2h.wins + h2h.losses + h2h.draws;

    if (total === 0) return 0.5;

    let winRate = h2h.wins / total;

    // Adjust for sport-specific factors
    switch (sport) {
      case 'football':
        // Consider draws as half wins
        winRate = (h2h.wins + h2h.draws * 0.5) / total;
        break;
      case 'tennis':
        // Recent matches more important
        winRate *= 0.8; // Dampen older results
        break;
    }

    return winRate;
  }

  adaptOffensiveRating(gameData, sport) {
    const baseRating = gameData.teamOffRating || gameData.offensiveRating || 100;

    switch (sport) {
      case 'basketball':
        return (baseRating - 100) / 20; // Normalize around league average
      case 'football':
        return (baseRating - 1.0) / 2.0; // Goals per game
      case 'american_football':
        return baseRating / 30; // Points per game
      case 'tennis':
        return (baseRating - 500) / 1000; // ATP ranking points
      default:
        return baseRating / 100;
    }
  }

  adaptDefensiveRating(gameData, sport) {
    const baseRating = gameData.teamDefRating || gameData.defensiveRating || 100;

    switch (sport) {
      case 'basketball':
        return (120 - baseRating) / 20; // Invert and normalize
      case 'football':
        return (3.0 - baseRating) / 2.0; // Goals conceded per game
      case 'american_football':
        return (35 - baseRating) / 30; // Points allowed per game
      case 'tennis':
        return (1000 - baseRating) / 1000; // Inverse ranking
      default:
        return (100 - baseRating) / 50;
    }
  }

  adaptPacePossession(gameData, sport) {
    switch (sport) {
      case 'basketball':
        return (gameData.pace || 100) / 100;
      case 'football':
        return (gameData.possession || 50) / 100;
      case 'american_football':
        return (gameData.timeOfPossession || 30) / 60;
      case 'tennis':
        return 0.5; // Not applicable
      default:
        return 0.5;
    }
  }

  calculateInjuryImpact(gameData, sport) {
    const injuryFactor = gameData.injuryFactor || 0;

    // Sport-specific injury impact
    const multipliers = {
      basketball: 0.8, // High impact due to small rosters
      football: 0.6, // Significant impact
      american_football: 0.9, // Very high impact due to positions
      tennis: 0.4 // Lower impact for individual sport
    };

    return 1 - (injuryFactor * (multipliers[sport] || 0.5));
  }

  calculateTravelImpact(gameData, sport) {
    const distance = gameData.travelDistance || 0;

    // Sport-specific travel impact
    const baseImpact = Math.min(distance / 2000, 1); // Max impact at 2000km

    const multipliers = {
      basketball: 1.0, // High impact
      football: 0.7, // Moderate impact
      american_football: 0.8, // Significant impact
      tennis: 0.3 // Lower impact for individual sport
    };

    return 1 - (baseImpact * (multipliers[sport] || 0.5));
  }

  calculateRestAdvantage(gameData, sport) {
    const restDays = gameData.restDays || 3;

    switch (sport) {
      case 'basketball':
        return Math.min(restDays / 4, 1); // Max benefit at 4+ days
      case 'football':
        return Math.min(restDays / 7, 1); // Weekly schedule
      case 'american_football':
        return Math.min(restDays / 7, 1); // Weekly schedule
      case 'tennis':
        return Math.min(restDays / 14, 1); // Tournament schedule
      default:
        return Math.min(restDays / 5, 1);
    }
  }

  async addSport(sportConfig) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const requiredFields = ['name', 'leagues', 'predictionFactors', 'scoringSystem', 'bettingMarkets'];

    for (const field of requiredFields) {
      if (!sportConfig[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    const sportId = sportConfig.id || sportConfig.name.toLowerCase().replace(/\s+/g, '_');
    this.supportedSports[sportId] = sportConfig;

    await this.saveSportConfigurations();
    console.log(`➕ Added new sport: ${sportConfig.name}`);

    return sportId;
  }

  async removeSport(sportName) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (sportName === 'basketball') {
      throw new Error('Cannot remove basketball - it is the default sport');
    }

    if (!this.supportedSports[sportName]) {
      throw new Error(`Sport not found: ${sportName}`);
    }

    delete this.supportedSports[sportName];
    await this.saveSportConfigurations();

    console.log(`➖ Removed sport: ${sportName}`);
  }

  async exportSportConfig(sportName = null) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const sport = sportName || this.currentSport;
    const config = this.supportedSports[sport];

    if (!config) {
      throw new Error(`Sport not found: ${sport}`);
    }

    return {
      ...config,
      exportDate: new Date().toISOString(),
      sportId: sport
    };
  }

  async getSportStatistics() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const stats = {};

    for (const [sportId, sportConfig] of Object.entries(this.supportedSports)) {
      stats[sportId] = {
        name: sportConfig.name,
        leaguesCount: sportConfig.leagues.length,
        factorsCount: sportConfig.predictionFactors.length,
        marketsCount: sportConfig.bettingMarkets.length,
        isActive: sportId === this.currentSport
      };
    }

    return stats;
  }
}

module.exports = MultiSportEngine;
