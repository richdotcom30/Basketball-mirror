#!/usr/bin/env node

// Mirror - Health Check Script
// Phase 8: Deployment & Operations

const fs = require('fs');
const path = require('path');

async function healthCheck() {
  try {
    // Check if required files exist
    const requiredFiles = [
      'package.json',
      '.env',
      'src/index.js'
    ];

    for (const file of requiredFiles) {
      if (!fs.existsSync(file)) {
        throw new Error(`Required file missing: ${file}`);
      }
    }

    // Check if environment variables are set
    const requiredEnvVars = [
      'OPENROUTER_API_KEY',
      'TELEGRAM_BOT_TOKEN'
    ];

    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        throw new Error(`Required environment variable missing: ${envVar}`);
      }
    }

    // Check if data directories exist
    const requiredDirs = [
      'data',
      'logs'
    ];

    for (const dir of requiredDirs) {
      if (!fs.existsSync(dir)) {
        // Try to create directory
        try {
          fs.mkdirSync(dir, { recursive: true });
        } catch (error) {
          throw new Error(`Cannot create required directory: ${dir}`);
        }
      }
    }

    // Try to import main module
    try {
      require('./src/index.js');
    } catch (error) {
      throw new Error(`Cannot load main application: ${error.message}`);
    }

    // All checks passed
    console.log('✅ Health check passed');
    process.exit(0);

  } catch (error) {
    console.error(`❌ Health check failed: ${error.message}`);
    process.exit(1);
  }
}

// Run health check if called directly
if (require.main === module) {
  healthCheck();
}

module.exports = healthCheck;
