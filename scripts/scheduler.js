#!/usr/bin/env node

// Mirror - Automated Scheduler
// Phase 8: Deployment & Operations

const cron = require('node-cron');
const { spawn } = require('child_process');
const path = require('path');

class MirrorScheduler {
  constructor() {
    this.jobs = [];
    this.isRunning = false;
  }

  start() {
    if (this.isRunning) {
      console.log('🔄 Scheduler already running');
      return;
    }

    console.log('⏰ Starting Mirror Scheduler...');
    this.isRunning = true;

    // Schedule regular tasks
    this.scheduleTasks();

    console.log('✅ Scheduler started - tasks will run automatically');
    console.log('📋 Scheduled Tasks:');
    this.jobs.forEach(job => {
      console.log(`   ${job.name}: ${job.schedule}`);
    });
    console.log('');
  }

  stop() {
    console.log('🛑 Stopping Mirror Scheduler...');

    this.jobs.forEach(job => {
      if (job.cronJob) {
        job.cronJob.stop();
      }
    });

    this.jobs = [];
    this.isRunning = false;
    console.log('✅ Scheduler stopped');
  }

  scheduleTasks() {
    // Daily data refresh (6 AM)
    this.addJob({
      name: 'Daily Data Scrape',
      schedule: '0 6 * * *',
      task: () => this.runCommand('scrape', ['--sources', 'all', '--parallel', '10'])
    });

    // Prediction generation (8 AM, 2 PM, 8 PM)
    this.addJob({
      name: 'Morning Predictions',
      schedule: '0 8 * * *',
      task: () => this.runCommand('predict', ['--number', '50', '--confidence', '0.7'])
    });

    this.addJob({
      name: 'Afternoon Predictions',
      schedule: '0 14 * * *',
      task: () => this.runCommand('predict', ['--number', '50', '--confidence', '0.7'])
    });

    this.addJob({
      name: 'Evening Predictions',
      schedule: '0 20 * * *',
      task: () => this.runCommand('predict', ['--number', '50', '--confidence', '0.7'])
    });

    // Backtesting validation (weekly on Sunday at 3 AM)
    this.addJob({
      name: 'Weekly Backtest',
      schedule: '0 3 * * 0',
      task: () => this.runCommand('backtest', [
        '--name', `Weekly-${new Date().toISOString().split('T')[0]}`,
        '--start', '2023-01-01',
        '--end', new Date().toISOString().split('T')[0],
        '--confidence', '0.7'
      ])
    });

    // System health check (every 6 hours)
    this.addJob({
      name: 'System Health Check',
      schedule: '0 */6 * * *',
      task: () => this.runHealthCheck()
    });

    // Log cleanup (daily at 4 AM)
    this.addJob({
      name: 'Log Cleanup',
      schedule: '0 4 * * *',
      task: () => this.cleanupLogs()
    });

    // Performance report (monthly on 1st at 5 AM)
    this.addJob({
      name: 'Monthly Performance Report',
      schedule: '0 5 1 * *',
      task: () => this.runCommand('backtest', ['--report', 'text'])
    });
  }

  addJob(jobConfig) {
    const { name, schedule, task } = jobConfig;

    const cronJob = cron.schedule(schedule, async () => {
      console.log(`⏰ Running scheduled task: ${name}`);

      try {
        await task();
        console.log(`✅ Scheduled task completed: ${name}`);
      } catch (error) {
        console.error(`❌ Scheduled task failed: ${name}`, error.message);
      }
    }, {
      scheduled: false // Don't start immediately
    });

    this.jobs.push({
      name,
      schedule,
      task,
      cronJob
    });
  }

  async runCommand(command, args = []) {
    return new Promise((resolve, reject) => {
      const cliPath = path.join(__dirname, '..', 'src', 'index.js');
      const child = spawn('node', [cliPath, command, ...args], {
        stdio: 'inherit',
        cwd: path.join(__dirname, '..')
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Command failed with code ${code}`));
        }
      });

      child.on('error', (error) => {
        reject(error);
      });
    });
  }

  async runHealthCheck() {
    try {
      // Run system status check
      await this.runCommand('status');

      // Check if key processes are running
      const pm2Status = await this.checkPm2Status();

      if (!pm2Status.botRunning) {
        console.log('⚠️  Telegram bot not running, attempting restart...');
        await this.restartService('mirror-bot');
      }

      if (!pm2Status.monitorRunning) {
        console.log('⚠️  Live monitor not running, attempting restart...');
        await this.restartService('mirror-monitor');
      }

      console.log('✅ Health check completed');

    } catch (error) {
      console.error('❌ Health check failed:', error.message);
    }
  }

  async checkPm2Status() {
    try {
      const { exec } = require('child_process');
      const util = require('util');
      const execAsync = util.promisify(exec);

      const { stdout } = await execAsync('pm2 jlist');
      const processes = JSON.parse(stdout);

      const botProcess = processes.find(p => p.name === 'mirror-bot');
      const monitorProcess = processes.find(p => p.name === 'mirror-monitor');

      return {
        botRunning: botProcess && botProcess.pm2_env.status === 'online',
        monitorRunning: monitorProcess && monitorProcess.pm2_env.status === 'online'
      };

    } catch (error) {
      console.error('Failed to check PM2 status:', error.message);
      return { botRunning: false, monitorRunning: false };
    }
  }

  async restartService(serviceName) {
    try {
      const { exec } = require('child_process');
      const util = require('util');
      const execAsync = util.promisify(exec);

      await execAsync(`pm2 restart ${serviceName}`);
      console.log(`✅ Service restarted: ${serviceName}`);

    } catch (error) {
      console.error(`❌ Failed to restart service: ${serviceName}`, error.message);
    }
  }

  async cleanupLogs() {
    try {
      const fs = require('fs').promises;
      const path = require('path');
      const logsDir = path.join(__dirname, '..', 'logs');

      // Remove log files older than 7 days
      const files = await fs.readdir(logsDir);
      const cutoffDate = Date.now() - (7 * 24 * 60 * 60 * 1000);

      for (const file of files) {
        if (file.endsWith('.log')) {
          const filePath = path.join(logsDir, file);
          const stats = await fs.stat(filePath);

          if (stats.mtime.getTime() < cutoffDate) {
            await fs.unlink(filePath);
            console.log(`🗑️ Cleaned up old log: ${file}`);
          }
        }
      }

      console.log('✅ Log cleanup completed');

    } catch (error) {
      console.error('❌ Log cleanup failed:', error.message);
    }
  }

  getScheduledJobs() {
    return this.jobs.map(job => ({
      name: job.name,
      schedule: job.schedule,
      nextRun: job.cronJob ? job.cronJob.nextDate() : null
    }));
  }

  startAllJobs() {
    this.jobs.forEach(job => {
      if (job.cronJob && !job.cronJob.running) {
        job.cronJob.start();
      }
    });
    console.log('▶️  All scheduled jobs started');
  }

  stopAllJobs() {
    this.jobs.forEach(job => {
      if (job.cronJob && job.cronJob.running) {
        job.cronJob.stop();
      }
    });
    console.log('⏸️  All scheduled jobs stopped');
  }
}

// Handle process signals
process.on('SIGINT', () => {
  console.log('\n⏰ Received shutdown signal, stopping scheduler...');
  if (global.scheduler) {
    global.scheduler.stop();
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n⏰ Received termination signal, stopping scheduler...');
  if (global.scheduler) {
    global.scheduler.stop();
  }
  process.exit(0);
});

// Run scheduler if called directly
if (require.main === module) {
  const scheduler = new MirrorScheduler();
  global.scheduler = scheduler;

  scheduler.start();
  scheduler.startAllJobs();

  // Keep process alive
  console.log('⏰ Scheduler is running. Press Ctrl+C to stop.\n');

  // Optional: Add interactive commands
  process.stdin.on('data', (data) => {
    const command = data.toString().trim().toLowerCase();

    switch (command) {
      case 'status':
        console.log('📋 Scheduled Jobs:');
        scheduler.getScheduledJobs().forEach(job => {
          console.log(`   ${job.name}: ${job.schedule}`);
        });
        break;

      case 'stop':
        scheduler.stopAllJobs();
        break;

      case 'start':
        scheduler.startAllJobs();
        break;

      case 'help':
        console.log('📖 Scheduler Commands:');
        console.log('   status - Show scheduled jobs');
        console.log('   start  - Start all jobs');
        console.log('   stop   - Stop all jobs');
        console.log('   help   - Show this help');
        break;

      default:
        console.log('Unknown command. Type "help" for available commands.');
    }
  });
}

module.exports = MirrorScheduler;
