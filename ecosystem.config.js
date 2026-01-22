// Mirror - PM2 Process Management Configuration
// Phase 8: Deployment & Operations

module.exports = {
  apps: [
    {
      name: 'mirror-bot',
      script: './src/index.js',
      args: 'telegram',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'development',
        ...require('dotenv').config().parsed
      },
      env_production: {
        NODE_ENV: 'production',
        ...require('dotenv').config().parsed
      },
      // Restart policy
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      // Logging
      log_file: './logs/pm2-mirror-bot.log',
      out_file: './logs/pm2-mirror-bot-out.log',
      error_file: './logs/pm2-mirror-bot-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      // Resource limits
      max_memory_restart: '500M',
      // Health checks
      health_check: {
        enabled: true,
        url: 'http://localhost:3000/health',
        interval: 30000, // 30 seconds
        timeout: 5000,
        unhealthy_threshold: 3,
        healthy_threshold: 2
      }
    },
    {
      name: 'mirror-monitor',
      script: './src/index.js',
      args: 'monitor --daemon --interval 5 --threshold 0.8',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'development',
        ...require('dotenv').config().parsed
      },
      env_production: {
        NODE_ENV: 'production',
        ...require('dotenv').config().parsed
      },
      // Restart policy
      autorestart: true,
      max_restarts: 5,
      min_uptime: '30s',
      // Logging
      log_file: './logs/pm2-mirror-monitor.log',
      out_file: './logs/pm2-mirror-monitor-out.log',
      error_file: './logs/pm2-mirror-monitor-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      // Resource limits
      max_memory_restart: '300M'
    },
    {
      name: 'mirror-scheduler',
      script: './scripts/scheduler.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'development',
        ...require('dotenv').config().parsed
      },
      env_production: {
        NODE_ENV: 'production',
        ...require('dotenv').config().parsed
      },
      // Schedule-based restarts (optional)
      cron_restart: '0 */6 * * *', // Restart every 6 hours
      autorestart: true,
      max_restarts: 3,
      // Logging
      log_file: './logs/pm2-mirror-scheduler.log',
      out_file: './logs/pm2-mirror-scheduler-out.log',
      error_file: './logs/pm2-mirror-scheduler-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ],

  deploy: {
    production: {
      user: 'node',
      host: 'your-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:your-repo/mirror.git',
      path: '/var/www/production',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};
