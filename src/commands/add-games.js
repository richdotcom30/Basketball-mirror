// Mirror - Add Games Command
// Manually add today's games for prediction

const fs = require('fs').promises;
const path = require('path');

class AddGamesCommand {
  constructor() {
    this.command = 'add-games <games...>';
    this.description = 'Manually add today\'s games for prediction';
    this.example = 'mirror add-games "Lakers vs Warriors" "Celtics vs Heat" "Bucks vs Suns"';
  }

  async run(games, options = {}) {
    console.log('🎯 Adding games manually for prediction...');

    if (!games || games.length === 0) {
      console.log('❌ No games provided. Usage:');
      console.log(`   ${this.example}`);
      console.log('');
      console.log('📝 Game format examples:');
      console.log('   "Los Angeles Lakers vs Golden State Warriors"');
      console.log('   "Boston Celtics vs Miami Heat @ 7:30 PM ET"');
      console.log('   "Milwaukee Bucks vs Phoenix Suns - NBA"');
      return;
    }

    const parsedGames = [];
    const failedGames = [];

    console.log(`📊 Processing ${games.length} game(s)...`);

    for (let i = 0; i < games.length; i++) {
      const gameString = games[i];
      console.log(`   ${i + 1}. ${gameString}`);

      try {
        const parsedGame = this.parseGameString(gameString);
        if (parsedGame) {
          parsedGames.push(parsedGame);
          console.log(`      ✅ Parsed: ${parsedGame.homeTeam} vs ${parsedGame.awayTeam}`);
        } else {
          failedGames.push(gameString);
          console.log(`      ❌ Failed to parse`);
        }
      } catch (error) {
        failedGames.push(gameString);
        console.log(`      ❌ Error: ${error.message}`);
      }
    }

    if (parsedGames.length === 0) {
      console.log('❌ No games could be parsed. Please check the format.');
      return;
    }

    // Save games to today's games file
    const todayGames = {
      games: parsedGames,
      timestamp: new Date().toISOString(),
      source: 'manual',
      totalGames: parsedGames.length
    };

    const filename = `today-games-${new Date().toISOString().split('T')[0]}.json`;
    const filepath = path.join(process.cwd(), 'data', filename);

    try {
      await fs.mkdir(path.dirname(filepath), { recursive: true });
      await fs.writeFile(filepath, JSON.stringify(todayGames, null, 2));

      console.log('');
      console.log('✅ Games saved successfully!');
      console.log(`📁 File: data/${filename}`);
      console.log(`🎮 Total games added: ${parsedGames.length}`);

      if (failedGames.length > 0) {
        console.log(`⚠️  Failed to parse: ${failedGames.length} game(s)`);
        console.log('   Failed games:', failedGames);
      }

      console.log('');
      console.log('🚀 Ready for prediction!');
      console.log('   Run: mirror predict --today');
      console.log('   Run: mirror telegram (to send to Telegram)');

    } catch (error) {
      console.error('❌ Failed to save games:', error.message);
    }
  }

  parseGameString(gameString) {
    // Clean up the input
    let cleanString = gameString.trim();

    // Extract league if specified (e.g., " - NBA" or " @ NBA")
    let league = 'Basketball';
    const leagueMatch = cleanString.match(/[-@]\s*([A-Za-z\s]+)$/);
    if (leagueMatch) {
      league = leagueMatch[1].trim();
      cleanString = cleanString.replace(/[-@]\s*[A-Za-z\s]+$/, '').trim();
    }

    // Extract time if specified
    let time = 'TBD';
    const timeMatch = cleanString.match(/(\d{1,2}:\d{2}\s*(?:AM|PM|ET|CET)?)/i);
    if (timeMatch) {
      time = timeMatch[1].trim();
      cleanString = cleanString.replace(timeMatch[0], '').trim();
    }

    // Split by common separators
    const separators = [' vs ', ' vs. ', ' versus ', ' - ', ' @ '];
    let homeTeam = null;
    let awayTeam = null;

    for (const separator of separators) {
      if (cleanString.toLowerCase().includes(separator.toLowerCase())) {
        const parts = cleanString.split(new RegExp(separator, 'i'));
        if (parts.length === 2) {
          homeTeam = parts[0].trim();
          awayTeam = parts[1].trim();
          break;
        }
      }
    }

    if (!homeTeam || !awayTeam) {
      return null;
    }

    // Validate team names
    if (homeTeam.length < 2 || awayTeam.length < 2) {
      return null;
    }

    // Generate unique ID
    const gameId = `manual-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    return {
      id: gameId,
      league: league,
      homeTeam: homeTeam,
      awayTeam: awayTeam,
      date: new Date().toISOString().split('T')[0],
      time: time,
      status: 'scheduled',
      source: 'manual'
    };
  }

  getHelp() {
    return {
      command: this.command,
      description: this.description,
      example: this.example,
      details: `
Manually add today's games for prediction and analysis.

Game Format Options:
• "Los Angeles Lakers vs Golden State Warriors"
• "Boston Celtics vs Miami Heat @ 7:30 PM ET"
• "Milwaukee Bucks vs Phoenix Suns - NBA"
• "Real Madrid vs Barcelona - EuroLeague"

The command will:
• Parse team names and leagues
• Extract game times if provided
• Save games to data/today-games-YYYY-MM-DD.json
• Make them available for prediction

After adding games, run:
• mirror predict --today    (generate predictions)
• mirror telegram          (send to Telegram)
      `
    };
  }
}

module.exports = new AddGamesCommand();
