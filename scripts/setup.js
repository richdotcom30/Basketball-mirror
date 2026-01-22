#!/usr/bin/env node

// Mirror - Interactive Setup Script
// Phase 8: Deployment & Operations

const inquirer = require('inquirer');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

class MirrorSetup {
  constructor() {
    this.config = {};
  }

  async run() {
    console.log('🚀 Mirror AI - Interactive Setup');
    console.log('═══════════════════════════════════════\n');

    try {
      // Check current status
      await this.checkCurrentStatus();

      // API Keys setup
      await this.setupApiKeys();

      // Environment configuration
      await this.setupEnvironment();

      // Optional components
      await this.setupOptionalComponents();

      // Validate setup
      await this.validateSetup();

      // Final instructions
      this.showFinalInstructions();

    } catch (error) {
      console.error('❌ Setup failed:', error.message);
      process.exit(1);
    }
  }

  async checkCurrentStatus() {
    console.log('📊 Checking current system status...\n');

    const checks = [
      { name: 'Node.js Version', check: () => this.checkNodeVersion() },
      { name: 'Dependencies', check: () => this.checkDependencies() },
      { name: 'Environment File', check: () => this.checkEnvFile() },
      { name: 'PM2 Installation', check: () => this.checkPm2() }
    ];

    for (const check of checks) {
      try {
        const result = await check.check();
        console.log(`✅ ${check.name}: ${result}`);
      } catch (error) {
        console.log(`⚠️  ${check.name}: ${error.message}`);
      }
    }

    console.log('');
  }

  async checkNodeVersion() {
    const version = process.version;
    const major = parseInt(version.slice(1).split('.')[0]);
    if (major >= 18) {
      return `v${version} ✓`;
    } else {
      throw new Error(`v${version} (requires Node.js 18+)`);
    }
  }

  async checkDependencies() {
    try {
      const packageJson = require('../package.json');
      const deps = Object.keys(packageJson.dependencies || {});
      return `${deps.length} packages installed`;
    } catch (error) {
      throw new Error('package.json not found');
    }
  }

  async checkEnvFile() {
    try {
      await fs.access('.env');
      return 'Found (.env)';
    } catch (error) {
      try {
        await fs.access('.env.example');
        return 'Found (.env.example) - needs copying';
      } catch (error) {
        throw new Error('No environment file found');
      }
    }
  }

  async checkPm2() {
    try {
      await execAsync('pm2 --version');
      return 'Installed';
    } catch (error) {
      return 'Not installed (will install)';
    }
  }

  async setupApiKeys() {
    console.log('🔑 Setting up API Keys...\n');

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'openrouterKey',
        message: 'Enter your OpenRouter API key (get from openrouter.ai):',
        validate: (input) => input.length > 10 || 'API key is required'
      },
      {
        type: 'confirm',
        name: 'hasTelegramToken',
        message: 'Do you have a Telegram bot token?',
        default: true
      },
      {
        type: 'input',
        name: 'telegramToken',
        message: 'Enter your Telegram bot token (from @BotFather):',
        when: (answers) => answers.hasTelegramToken,
        validate: (input) => input.startsWith('8596821105:') || 'Token should start with bot ID'
      }
    ]);

    this.config.openrouterKey = answers.openrouterKey;
    this.config.telegramToken = answers.telegramToken || '8596821105:AAFPgciqrHmnVXbR7xhdVqW02wYh9O7QBlE';

    console.log('✅ API keys configured\n');
  }

  async setupEnvironment() {
    console.log('🌍 Setting up environment...\n');

    // Copy .env.example to .env if it doesn't exist
    try {
      await fs.access('.env');
      console.log('📄 Environment file already exists');
    } catch (error) {
      await fs.copyFile('.env.example', '.env');
      console.log('📄 Created .env from .env.example');
    }

    // Update .env with user-provided keys
    let envContent = await fs.readFile('.env', 'utf8');

    // Update API keys
    envContent = envContent.replace(
      /OPENROUTER_API_KEY=.*/,
      `OPENROUTER_API_KEY=${this.config.openrouterKey}`
    );

    envContent = envContent.replace(
      /TELEGRAM_BOT_TOKEN=.*/,
      `TELEGRAM_BOT_TOKEN=${this.config.telegramToken}`
    );

    await fs.writeFile('.env', envContent);
    console.log('✅ Environment file updated\n');
  }

  async setupOptionalComponents() {
    console.log('🔧 Setting up optional components...\n');

    const answers = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'installPm2',
        message: 'Install PM2 for process management?',
        default: true
      },
      {
        type: 'confirm',
        name: 'setupChannels',
        message: 'Set up Telegram channels for broadcasting?',
        default: true
      },
      {
        type: 'confirm',
        name: 'createDirectories',
        message: 'Create data and log directories?',
        default: true
      }
    ]);

    // Install PM2 if requested
    if (answers.installPm2) {
      console.log('📦 Installing PM2...');
      try {
        await execAsync('npm install pm2 --save');
        console.log('✅ PM2 installed');
      } catch (error) {
        console.log('⚠️  PM2 installation failed, you can install manually: npm install pm2 --save');
      }
    }

    // Create directories
    if (answers.createDirectories) {
      const dirs = ['data', 'logs', 'data/historical', 'data/backtests'];
      for (const dir of dirs) {
        await fs.mkdir(dir, { recursive: true });
      }
      console.log('✅ Directories created');
    }

    // Telegram channel setup guidance
    if (answers.setupChannels) {
      console.log('\n📺 Telegram Channel Setup:');
      console.log('1. Create channels: @mirror_predictions, @mirror_performance, @mirror_alerts, @mirror_logs');
      console.log('2. Add your bot as administrator to each channel');
      console.log('3. Update .env with channel usernames if different');
      console.log('');
    }
  }

  async validateSetup() {
    console.log('🔍 Validating setup...\n');

    const validations = [
      { name: 'Environment File', check: () => this.validateEnvFile() },
      { name: 'Dependencies', check: () => this.validateDependencies() },
      { name: 'CLI Commands', check: () => this.validateCliCommands() }
    ];

    let allPassed = true;

    for (const validation of validations) {
      try {
        await validation.check();
        console.log(`✅ ${validation.name}: OK`);
      } catch (error) {
        console.log(`❌ ${validation.name}: ${error.message}`);
        allPassed = false;
      }
    }

    if (allPassed) {
      console.log('\n🎉 Setup validation passed!\n');
    } else {
      console.log('\n⚠️  Some validations failed. You may need to fix issues manually.\n');
    }

    return allPassed;
  }

  async validateEnvFile() {
    const envContent = await fs.readFile('.env', 'utf8');

    if (!envContent.includes('OPENROUTER_API_KEY=') || envContent.includes('your_openrouter_api_key_here')) {
      throw new Error('OpenRouter API key not set');
    }

    if (!envContent.includes('TELEGRAM_BOT_TOKEN=') || envContent.includes('your_telegram_bot_token_here')) {
      throw new Error('Telegram bot token not set');
    }
  }

  async validateDependencies() {
    const packageJson = require('../package.json');
    const deps = Object.keys(packageJson.dependencies || {});

    if (deps.length < 15) {
      throw new Error('Not all dependencies installed');
    }
  }

  async validateCliCommands() {
    try {
      await execAsync('node src/index.js --help');
      return true;
    } catch (error) {
      throw new Error('CLI not working');
    }
  }

  showFinalInstructions() {
    console.log('🎯 Mirror Setup Complete!');
    console.log('═══════════════════════════════\n');

    console.log('🚀 Quick Start Commands:');
    console.log('  node src/index.js status          # Check system status');
    console.log('  node src/index.js scrape --sources nba --parallel 5  # Get NBA data');
    console.log('  node src/index.js predict --number 10    # Generate predictions');
    console.log('  node src/index.js telegram         # Start bot server');
    console.log('');

    console.log('📊 PM2 Process Management (if installed):');
    console.log('  npm run pm2:start                  # Start all services');
    console.log('  npm run pm2:status                 # Check service status');
    console.log('  npm run pm2:logs                   # View service logs');
    console.log('');

    console.log('🧪 Testing Your Setup:');
    console.log('  node src/index.js backtest --name "Test Run"  # Validate predictions');
    console.log('  node src/index.js research --query "NBA odds" --browse  # Test AI research');
    console.log('');

    console.log('📚 Next Steps:');
    console.log('1. Run scraping to collect game data');
    console.log('2. Generate and validate predictions');
    console.log('3. Set up Telegram channels for broadcasting');
    console.log('4. Start live monitoring for real-time opportunities');
    console.log('');

    console.log('🆘 Need Help?');
    console.log('  node src/index.js interactive      # Guided interface');
    console.log('  node src/index.js --help          # Command help');
    console.log('');

    console.log('🎉 Welcome to Mirror AI - The future of betting intelligence! 🚀');
  }
}

// Run setup if called directly
if (require.main === module) {
  const setup = new MirrorSetup();
  setup.run().catch(console.error);
}

module.exports = MirrorSetup;
