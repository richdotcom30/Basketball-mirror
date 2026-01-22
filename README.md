# 🔮 Mirror AI - Advanced Basketball Prediction System

<div align="center">

![Mirror AI](https://img.shields.io/badge/Mirror-AI-blue?style=for-the-badge&logo=robot)
![Version](https://img.shields.io/badge/version-1.0.0-green?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen?style=flat-square)

**Professional Basketball Prediction AI with Stage 2 Quality Filtering**

[🚀 Quick Start](#-quick-start) • [📚 Documentation](#-documentation) • [🤝 Contributing](#-contributing)

</div>

---

## 📖 Table of Contents

- [✨ What is Mirror AI?](#-what-is-mirror-ai)
- [🎯 Key Features](#-key-features)
- [🚀 Quick Start](#-quick-start)
- [📋 Requirements](#-requirements)
- [⚙️ Installation](#️-installation)
- [🔧 Configuration](#-configuration)
- [📖 Usage](#-usage)
- [🎮 Commands](#-commands)
- [🧠 How It Works](#-how-it-works)
- [📊 Prediction Quality](#-prediction-quality)
- [🌐 Supported Leagues](#-supported-leagues)
- [🤖 AI Integration](#-ai-integration)
- [📱 Telegram Integration](#-telegram-integration)
- [🔧 Development](#-development)
- [📚 Documentation](#-documentation)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)
- [⚠️ Disclaimer](#-disclaimer)

---

## ✨ What is Mirror AI?

Mirror AI is a **professional-grade basketball prediction system** that uses advanced AI models to analyze basketball games and generate high-quality predictions. Unlike simple prediction tools, Mirror AI features a **two-stage prediction pipeline** with rigorous quality filtering to ensure only the most reliable predictions reach users.

### 🎯 What Makes Mirror AI Special?

- **Stage 1**: Multi-model AI analysis using Claude, Llama, Grok, and Gemini
- **Stage 2**: Quality filter that only allows 85%+ probability + 75%+ confidence predictions
- **Multi-Market**: Moneyline, totals, handicaps, and team totals
- **Real-time Processing**: Handle 50+ games simultaneously
- **Professional Output**: Detailed reports with expected value calculations

---

## 🎯 Key Features

### 🤖 Advanced AI Engine
- **Multi-Model Ensemble**: 4 different AI models for comprehensive analysis
- **OpenRouter Integration**: Access to premium AI models at no cost
- **Intelligent Analysis**: Pattern recognition, statistical modeling, situational factors

### 🎯 Stage 2 Quality Filter
- **85%+ Probability Threshold**: Only predictions with high win probability
- **75%+ Confidence Score**: Rigorous data quality validation
- **Risk Assessment**: Expected value and Kelly criterion stake sizing

### 📊 Comprehensive Predictions
- **Moneyline**: Match winner predictions
- **Total Points**: Over/under predictions
- **Team Totals**: Individual team scoring predictions
- **Handicaps**: Spread betting analysis

### ⚡ Performance & Scale
- **Parallel Processing**: Multi-threaded analysis for speed
- **Real-time Generation**: Process 50+ games in minutes
- **Zero Operational Cost**: Free AI models, no database fees

### 📱 Professional Integration
- **Telegram Bot**: Automated broadcasting and data storage
- **Markdown Reports**: Professional prediction reports
- **API Ready**: RESTful endpoints for integration

---

## 🚀 Quick Start

### For Beginners (5 minutes)

1. **Download & Install**
   ```bash
   git clone <repository-url>
   cd mirror
   npm install
   ```

2. **Configure API Key**
   ```bash
   cp .env.example .env
   # Edit .env and add your OpenRouter API key
   ```

3. **Run Your First Prediction**
   ```bash
   # Add today's games
   node src/index.js add-games "Lakers vs Warriors @ 8:00 PM"

   # Generate predictions
   node src/index.js predict --today --number 10
   ```

4. **View Results**
   - Check `predictions-today.md` for detailed analysis
   - Check `stage2-filter-results.md` for elite predictions only

### For Advanced Users

```bash
# Full pipeline with 50 games and high confidence
node src/index.js predict --today --number 50 --confidence 0.8

# Send to Telegram (if configured)
node src/index.js telegram --channel @your_channel
```

---

## 📋 Requirements

- **Node.js**: Version 18.0.0 or higher
- **npm**: Latest version (comes with Node.js)
- **Operating System**: Windows, macOS, or Linux
- **RAM**: Minimum 4GB (8GB recommended for large datasets)
- **Internet**: Required for AI API calls

### Optional Requirements
- **Telegram Bot Token**: For automated broadcasting
- **Git**: For cloning and version control

---

## ⚙️ Installation

### Option 1: Clone Repository (Recommended)

```bash
# Clone the repository
git clone https://github.com/yourusername/mirror-ai.git
cd mirror-ai

# Install dependencies
npm install

# Verify installation
node src/index.js --version
```

### Option 2: Direct Download

1. Download the ZIP file from GitHub releases
2. Extract to a folder on your computer
3. Open terminal/command prompt in that folder
4. Run `npm install`

### Verify Installation

```bash
# Check if Mirror AI is working
node src/index.js status

# Should output:
# 📊 Mirror System Status
# ───────────────────────────────
# version   : 1.0.0
# node      : v20.x.x
# platform  : win32
# memory    : XXMB
# uptime    : Xs
```

---

## 🔧 Configuration

### 1. API Keys Setup

Mirror AI requires an OpenRouter API key for AI predictions. Here's how to get one:

#### Get OpenRouter API Key

1. **Visit OpenRouter**: Go to [openrouter.ai](https://openrouter.ai)
2. **Sign Up**: Create a free account
3. **Get API Key**: Navigate to API Keys section
4. **Copy Key**: Save your API key securely

#### Configure Environment

```bash
# Copy the example configuration
cp .env.example .env

# Edit the .env file
nano .env  # or use any text editor
```

Add your API key to the `.env` file:

```env
# Required: OpenRouter API Key
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Optional: Telegram Bot (for broadcasting)
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here

# Optional: Telegram Channel ID
TELEGRAM_CHANNEL_ID=@your_channel_username
```

### 2. Verify Configuration

```bash
# Test your API key
node src/index.js status

# Should show API key status
```

---

## 📖 Usage

### Basic Workflow

1. **Add Games**: Input today's games manually
2. **Generate Predictions**: Run AI analysis
3. **Review Results**: Check generated reports
4. **Broadcast** (Optional): Send to Telegram

### Step-by-Step Example

```bash
# Step 1: Add today's games
node src/index.js add-games "Lakers vs Warriors @ 8:00 PM" "Celtics vs Heat @ 7:30 PM"

# Step 2: Generate predictions with Stage 2 filtering
node src/index.js predict --today --number 20 --confidence 0.7

# Step 3: View results
# - predictions-today.md: All predictions
# - stage2-filter-results.md: Elite predictions only

# Step 4: Send to Telegram (if configured)
node src/index.js telegram
```

### Understanding Output Files

#### `predictions-today.md`
- **Complete Analysis**: All predictions with detailed reasoning
- **Multi-Market Coverage**: Moneyline, totals, handicaps
- **Confidence Levels**: AI model consensus scores
- **Expected Value**: Kelly criterion stake recommendations

#### `stage2-filter-results.md`
- **Elite Predictions Only**: 85%+ probability + 75%+ confidence
- **Quality Assurance**: Only highest-confidence predictions
- **Betting Recommendations**: Conservative, balanced, and risk strategies
- **Statistical Summary**: Performance metrics and analysis

---

## 🎮 Commands

### Core Commands

| Command | Description | Example |
|---------|-------------|---------|
| `status` | Show system status | `node src/index.js status` |
| `add-games` | Add games manually | `node src/index.js add-games "Team A vs Team B"` |
| `predict` | Generate predictions | `node src/index.js predict --today` |
| `telegram` | Send to Telegram | `node src/index.js telegram` |
| `help` | Show help | `node src/index.js --help` |

### Command Options

#### `add-games` Command

```bash
# Basic usage
node src/index.js add-games "Team A vs Team B"

# With time and league
node src/index.js add-games "Lakers vs Warriors @ 8:00 PM - NBA"

# Multiple games
node src/index.js add-games "Game 1" "Game 2" "Game 3"
```

#### `predict` Command

```bash
# Basic prediction
node src/index.js predict --today

# Advanced options
node src/index.js predict --today --number 50 --confidence 0.8 --league nba

# Options:
# --today: Use manually added games
# --number: Maximum predictions to generate (default: 100)
# --confidence: Minimum confidence threshold (default: 0.7)
# --league: Filter by league (nba, euroleague, etc.)
```

#### `telegram` Command

```bash
# Send to configured channel
node src/index.js telegram

# Send with custom message
node src/index.js telegram --message "Today's elite predictions"

# Options:
# --channel: Specify Telegram channel
# --message: Custom message prefix
```

### Interactive Mode

For users who prefer a menu-driven interface:

```bash
node src/index.js interactive
```

This launches a user-friendly menu system for all operations.

---

## 🧠 How It Works

### Stage 1: AI Analysis Pipeline

1. **Data Collection**: Games are loaded from manual input or scraped data
2. **Multi-Model Analysis**: Each game analyzed by 4 AI models:
   - **Claude Haiku**: Fast, accurate analysis
   - **Llama 3 70B**: Deep reasoning and patterns
   - **Grok Beta**: Real-time insights and trends
   - **Gemini Pro**: Cross-validation and consistency
3. **Ensemble Voting**: Models consensus on predictions
4. **Confidence Scoring**: Statistical validation of predictions

### Stage 2: Quality Filtering

1. **Probability Threshold**: Must be 85%+ win probability
2. **Confidence Score**: Must achieve 75+ data quality score
3. **Risk Assessment**: Expected value calculations
4. **Re-analysis**: Borderline predictions get AI re-evaluation
5. **Final Approval**: Only elite predictions pass through

### Output Generation

- **Predictions Report**: Complete analysis for all games
- **Stage 2 Report**: Only top-tier predictions with betting recommendations
- **Performance Metrics**: Accuracy tracking and statistical analysis

---

## 📊 Prediction Quality

### Quality Metrics

| Metric | Target | Current Status |
|--------|--------|----------------|
| **Probability Threshold** | 85%+ | ✅ Implemented |
| **Confidence Score** | 75+ | ✅ Implemented |
| **Expected Value** | Positive | ✅ Calculated |
| **Multi-Market Coverage** | 4 markets | ✅ Complete |

### Expected Performance

- **Stage 2 Pass Rate**: 10-25% of predictions (quality over quantity)
- **Win Rate Target**: 75-85% on approved predictions
- **Processing Speed**: 50+ games in 2-3 minutes
- **Consistency**: Statistical validation ensures reliability

### Quality Assurance

- **Cross-Model Validation**: Multiple AI models must agree
- **Statistical Backing**: Historical data pattern recognition
- **Risk Assessment**: Kelly criterion for responsible betting
- **Continuous Learning**: Performance tracking and optimization

---

## 🌐 Supported Leagues

Mirror AI supports basketball leagues worldwide:

### Major Leagues
- **NBA** (National Basketball Association)
- **EuroLeague** (European premier basketball)
- **EuroCup** (European secondary competition)

### Regional Leagues
- **Liga ACB** (Spain)
- **BSL** (Turkey)
- **Basketball Bundesliga** (Germany)
- **Lega Basket Serie A** (Italy)
- **LNB Pro A** (France)

### Other Competitions
- **NCAA** (College basketball)
- **CBA** (China)
- **NBL** (Australia)
- **And 50+ more international leagues**

### Adding New Leagues

The system is designed to easily support new leagues by:
- Adding league-specific data sources
- Configuring AI prompts for league characteristics
- Updating statistical models

---

## 🤖 AI Integration

### OpenRouter Platform

Mirror AI uses **OpenRouter** to access multiple premium AI models:

#### Supported Models

| Model | Purpose | Cost | Speed |
|-------|---------|------|-------|
| **Claude 3 Haiku** | Fast Analysis | Free | ⚡ Fast |
| **Llama 3 70B** | Deep Reasoning | Free | 🐌 Slower |
| **Grok Beta** | Real-time Insights | Free | ⚡ Fast |
| **Gemini Pro** | Validation | Free | ⚡ Fast |

#### API Configuration

```javascript
// Example API call structure
const response = await openRouter.callModel('analysis', {
  model: 'anthropic/claude-3-haiku',
  prompt: 'Analyze this basketball game...',
  temperature: 0.3,
  max_tokens: 1000
});
```

#### Rate Limits & Costs

- **Free Tier**: 1000+ requests per day
- **No Monthly Fees**: Pay only for actual usage
- **Generous Limits**: Perfect for daily predictions
- **Fallback Models**: Automatic switching if limits reached

### AI Prompt Engineering

Each AI model receives carefully crafted prompts:

```javascript
// Example prediction prompt
const predictionPrompt = `
Analyze this basketball game and provide:
1. Win probability assessment
2. Key statistical factors
3. Situational advantages
4. Confidence score (0-100)
5. Recommended stake size

Game: ${homeTeam} vs ${awayTeam}
League: ${league}
Historical Data: ${stats}
`;
```

---

## 📱 Telegram Integration

### Bot Setup

1. **Create Bot**: Message [@BotFather](https://t.me/botfather) on Telegram
2. **Get Token**: Save the bot token
3. **Configure Channel**: Create a channel for predictions
4. **Set Permissions**: Make bot an administrator

### Configuration

```env
# .env file
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHANNEL_ID=@your_predictions_channel
```

### Features

- **Automated Broadcasting**: Send predictions instantly
- **Message Storage**: Use Telegram as database
- **Real-time Alerts**: High-confidence notifications
- **Performance Tracking**: Historical prediction storage

### Usage Example

```bash
# Send all predictions
node src/index.js telegram

# Send with custom message
node src/index.js telegram --message "🔥 Today's Elite Predictions"

# Send only high-confidence picks
node src/index.js telegram --filter high-confidence
```

---

## 🔧 Development

### Project Structure

```
mirror/
├── src/
│   ├── index.js              # CLI entry point
│   ├── commands/             # CLI commands
│   │   ├── predict.js        # Prediction command
│   │   ├── add-games.js      # Game management
│   │   └── telegram.js       # Telegram integration
│   ├── core/                 # Core business logic
│   │   ├── PredictionEngine.js    # AI prediction engine
│   │   ├── PredictionFilter.js    # Stage 2 quality filter
│   │   └── ParallelProcessingEngine.js
│   ├── ai/                   # AI integrations
│   │   └── OpenRouterClient.js    # OpenRouter API client
│   ├── scrapers/             # Web scraping (future)
│   └── telegram/             # Telegram bot logic
├── data/                     # Temporary data storage
├── config/                   # Configuration files
├── scripts/                  # Utility scripts
├── tests/                    # Test suites
├── .env.example              # Environment template
├── package.json              # Dependencies
├── ecosystem.config.js       # PM2 configuration
└── README.md                 # This file
```

### Development Commands

```bash
# Install development dependencies
npm install

# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format

# Start development server
npm run dev

# Build for production
npm run build
```

### Adding New Features

1. **Create Command**: Add to `src/commands/`
2. **Update CLI**: Register in `src/index.js`
3. **Add Tests**: Create test files in `tests/`
4. **Update Docs**: Modify this README

### Code Standards

- **ES6+ Syntax**: Modern JavaScript features
- **Async/Await**: For all asynchronous operations
- **Error Handling**: Comprehensive try/catch blocks
- **Documentation**: JSDoc comments for functions

---

## 📚 Documentation

### User Guides

- [Quick Start Guide](docs/quick-start.md)
- [Configuration Guide](docs/configuration.md)
- [Command Reference](docs/commands.md)
- [Troubleshooting](docs/troubleshooting.md)

### Technical Documentation

- [API Reference](docs/api.md)
- [Architecture Overview](docs/architecture.md)
- [AI Integration Guide](docs/ai-integration.md)
- [Contributing Guide](docs/contributing.md)

### Video Tutorials

- [Installation & Setup](https://youtube.com/watch?v=...)
- [First Predictions](https://youtube.com/watch?v=...)
- [Advanced Configuration](https://youtube.com/watch?v=...)

---

## 🤝 Contributing

We welcome contributions from the community! Here's how to get involved:

### Ways to Contribute

- **🐛 Bug Reports**: Found a bug? [Open an issue](https://github.com/yourusername/mirror-ai/issues)
- **💡 Feature Requests**: Have an idea? [Suggest it](https://github.com/yourusername/mirror-ai/discussions)
- **📝 Documentation**: Help improve docs and tutorials
- **🔧 Code**: Submit pull requests for new features

### Development Process

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Contributor Guidelines

- Follow the existing code style
- Add tests for new features
- Update documentation
- Ensure all tests pass
- Follow semantic commit messages

### Community

- **Discord**: Join our [Discord server](https://discord.gg/mirror-ai)
- **Forum**: Discuss on [GitHub Discussions](https://github.com/yourusername/mirror-ai/discussions)
- **Newsletter**: Subscribe for updates

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2024 Mirror AI

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

---

## ⚠️ Disclaimer

### Important Legal Notice

**Mirror AI is for educational and research purposes only.**

- **Not Financial Advice**: This software does not provide investment or betting advice
- **No Guarantees**: Past performance does not guarantee future results
- **Legal Compliance**: Ensure compliance with local gambling regulations
- **Responsible Use**: Use responsibly and within legal limits

### Accuracy Expectations

- **Realistic Target**: 65-75% accuracy with proper optimization
- **Quality Over Quantity**: Stage 2 filtering ensures high-quality predictions only
- **Continuous Improvement**: System learns and improves over time
- **User Responsibility**: Users are responsible for their own decisions

### Risk Warning

- **Financial Risk**: Sports betting involves financial risk
- **Data Accuracy**: AI predictions are not infallible
- **External Factors**: Many variables affect game outcomes
- **Professional Consultation**: Consult professionals for serious betting activities

---

<div align="center">

**Built with ❤️ by the Mirror AI Team**

*Transforming sports analysis with artificial intelligence*

[⭐ Star us on GitHub](https://github.com/yourusername/mirror-ai) • [🐛 Report Issues](https://github.com/yourusername/mirror-ai/issues) • [💬 Join Discussions](https://github.com/yourusername/mirror-ai/discussions)

</div>
