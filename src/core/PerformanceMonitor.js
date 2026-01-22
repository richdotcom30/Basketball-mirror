// Mirror - Performance Monitoring System
// Phase 6: Scaling & Performance

const fs = require('fs').promises;
const path = require('path');
const os = require('os');

class PerformanceMonitor {
  constructor(options = {}) {
    this.logDirectory = options.logDirectory || path.join(process.cwd(), 'logs');
    this.metricsInterval = options.metricsInterval || 60000; // 1 minute
    this.retentionDays = options.retentionDays || 7;
    this.enableDetailedLogging = options.enableDetailedLogging !== false;

    // Performance metrics
    this.metrics = {
      startTime: Date.now(),
      system: {
        platform: os.platform(),
        arch: os.arch(),
        cpus: os.cpus().length,
        totalMemory: os.totalmem(),
        nodeVersion: process.version
      },
      operations: {
        scrapes: { count: 0, totalTime: 0, errors: 0 },
        predictions: { count: 0, totalTime: 0, errors: 0 },
        research: { count: 0, totalTime: 0, errors: 0 },
        telegram: { count: 0, totalTime: 0, errors: 0 }
      },
      performance: {
        peakMemoryUsage: 0,
        averageResponseTime: 0,
        throughput: 0, // operations per minute
        errorRate: 0
      },
      resources: [],
      alerts: []
    };

    // Historical data
    this.history = [];
    this.isMonitoring = false;

    this.initializeLogging();
  }

  async initializeLogging() {
    try {
      await fs.mkdir(this.logDirectory, { recursive: true });
      console.log(`📊 Performance monitoring initialized. Logs: ${this.logDirectory}`);
    } catch (error) {
      console.error('Failed to initialize performance logging:', error.message);
    }
  }

  startMonitoring() {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    console.log('📈 Performance monitoring started');

    // Start metrics collection
    this.metricsTimer = setInterval(() => {
      this.collectMetrics();
    }, this.metricsInterval);

    // Start resource monitoring
    this.resourceTimer = setInterval(() => {
      this.monitorResources();
    }, 10000); // Every 10 seconds

    // Start cleanup (daily)
    this.cleanupTimer = setInterval(() => {
      this.cleanupOldLogs();
    }, 24 * 60 * 60 * 1000); // Daily
  }

  stopMonitoring() {
    this.isMonitoring = false;

    if (this.metricsTimer) {
      clearInterval(this.metricsTimer);
      this.metricsTimer = null;
    }

    if (this.resourceTimer) {
      clearInterval(this.resourceTimer);
      this.resourceTimer = null;
    }

    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }

    console.log('📉 Performance monitoring stopped');
  }

  collectMetrics() {
    const now = Date.now();
    const uptime = now - this.metrics.startTime;

    // Calculate current metrics
    const currentMetrics = {
      timestamp: now,
      uptime,
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      operations: { ...this.metrics.operations },
      performance: this.calculatePerformanceMetrics(),
      activeUsers: this.getActiveConnections()
    };

    // Update peak memory usage
    const currentMemory = currentMetrics.memory.heapUsed;
    this.metrics.performance.peakMemoryUsage = Math.max(
      this.metrics.performance.peakMemoryUsage,
      currentMemory
    );

    // Store in history
    this.history.push(currentMetrics);

    // Keep only last 1000 entries in memory
    if (this.history.length > 1000) {
      this.history = this.history.slice(-1000);
    }

    // Log to file if enabled
    if (this.enableDetailedLogging) {
      this.logMetrics(currentMetrics);
    }

    // Check for performance alerts
    this.checkPerformanceAlerts(currentMetrics);
  }

  calculatePerformanceMetrics() {
    const totalOperations = Object.values(this.metrics.operations)
      .reduce((sum, op) => sum + op.count, 0);

    const totalErrors = Object.values(this.metrics.operations)
      .reduce((sum, op) => sum + op.errors, 0);

    const totalTime = Object.values(this.metrics.operations)
      .reduce((sum, op) => sum + op.totalTime, 0);

    const uptimeMinutes = (Date.now() - this.metrics.startTime) / (1000 * 60);

    return {
      totalOperations,
      operationsPerMinute: uptimeMinutes > 0 ? totalOperations / uptimeMinutes : 0,
      errorRate: totalOperations > 0 ? (totalErrors / totalOperations) * 100 : 0,
      averageResponseTime: totalOperations > 0 ? totalTime / totalOperations : 0,
      peakMemoryUsage: this.metrics.performance.peakMemoryUsage,
      memoryEfficiency: this.calculateMemoryEfficiency()
    };
  }

  calculateMemoryEfficiency() {
    const memoryUsage = process.memoryUsage();
    const efficiency = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
    return Math.round(efficiency * 100) / 100; // Round to 2 decimal places
  }

  monitorResources() {
    const resourceSnapshot = {
      timestamp: Date.now(),
      cpu: process.cpuUsage(),
      memory: process.memoryUsage(),
      eventLoopLag: this.measureEventLoopLag(),
      activeHandles: this.getActiveHandles(),
      gcStats: this.getGCStats()
    };

    this.metrics.resources.push(resourceSnapshot);

    // Keep only last 100 resource snapshots
    if (this.metrics.resources.length > 100) {
      this.metrics.resources = this.metrics.resources.slice(-100);
    }
  }

  measureEventLoopLag() {
    // Simple event loop lag measurement
    const start = process.hrtime.bigint();
    return new Promise(resolve => {
      setImmediate(() => {
        const end = process.hrtime.bigint();
        const lag = Number(end - start) / 1e6; // Convert to milliseconds
        resolve(Math.round(lag * 100) / 100);
      });
    });
  }

  getActiveHandles() {
    // This is a simplified version - in production you'd use a proper monitoring library
    return process._getActiveHandles ? process._getActiveHandles().length : 0;
  }

  getGCStats() {
    // This would require a GC monitoring library in production
    return {
      collections: 0,
      totalTime: 0,
      averageTime: 0
    };
  }

  getActiveConnections() {
    // Simplified - would need proper connection tracking in production
    return 1; // Assume single user for now
  }

  async logMetrics(metrics) {
    try {
      const date = new Date(metrics.timestamp);
      const filename = `performance-${date.toISOString().split('T')[0]}.log`;
      const filepath = path.join(this.logDirectory, filename);

      const logEntry = {
        timestamp: metrics.timestamp,
        uptime: metrics.uptime,
        memory: {
          used: metrics.memory.heapUsed,
          total: metrics.memory.heapTotal,
          external: metrics.memory.external
        },
        operations: metrics.operations,
        performance: metrics.performance
      };

      await fs.appendFile(filepath, JSON.stringify(logEntry) + '\n');
    } catch (error) {
      console.error('Failed to log metrics:', error.message);
    }
  }

  checkPerformanceAlerts(currentMetrics) {
    const alerts = [];

    // Memory usage alert
    const memoryUsagePercent = (currentMetrics.memory.heapUsed / currentMetrics.memory.heapTotal) * 100;
    if (memoryUsagePercent > 90) {
      alerts.push({
        type: 'memory',
        severity: 'high',
        message: `High memory usage: ${memoryUsagePercent.toFixed(1)}%`,
        value: memoryUsagePercent
      });
    }

    // Error rate alert
    const errorRate = currentMetrics.performance.errorRate;
    if (errorRate > 10) {
      alerts.push({
        type: 'error_rate',
        severity: 'high',
        message: `High error rate: ${errorRate.toFixed(1)}%`,
        value: errorRate
      });
    }

    // Response time alert
    const avgResponseTime = currentMetrics.performance.averageResponseTime;
    if (avgResponseTime > 10000) { // 10 seconds
      alerts.push({
        type: 'response_time',
        severity: 'medium',
        message: `Slow response time: ${avgResponseTime.toFixed(0)}ms`,
        value: avgResponseTime
      });
    }

    // Store alerts
    this.metrics.alerts.push(...alerts);

    // Log critical alerts
    alerts.forEach(alert => {
      const logLevel = alert.severity === 'high' ? 'error' : 'warn';
      console[logLevel](`🚨 Performance Alert: ${alert.message}`);
    });
  }

  async cleanupOldLogs() {
    try {
      const files = await fs.readdir(this.logDirectory);
      const cutoffDate = Date.now() - (this.retentionDays * 24 * 60 * 60 * 1000);

      for (const file of files) {
        if (file.startsWith('performance-')) {
          const filepath = path.join(this.logDirectory, file);
          const stats = await fs.stat(filepath);

          if (stats.mtime.getTime() < cutoffDate) {
            await fs.unlink(filepath);
            console.log(`🗑️ Cleaned up old log file: ${file}`);
          }
        }
      }
    } catch (error) {
      console.error('Failed to cleanup old logs:', error.message);
    }
  }

  // Operation timing methods
  startOperation(operationType) {
    return {
      type: operationType,
      startTime: Date.now()
    };
  }

  endOperation(operationHandle, success = true) {
    const duration = Date.now() - operationHandle.startTime;

    if (this.metrics.operations[operationHandle.type]) {
      this.metrics.operations[operationHandle.type].count++;
      this.metrics.operations[operationHandle.type].totalTime += duration;

      if (!success) {
        this.metrics.operations[operationHandle.type].errors++;
      }
    }

    return duration;
  }

  // Public API methods
  getMetrics() {
    return {
      ...this.metrics,
      performance: this.calculatePerformanceMetrics(),
      recentHistory: this.history.slice(-10),
      activeAlerts: this.metrics.alerts.slice(-5)
    };
  }

  getHealthStatus() {
    const metrics = this.calculatePerformanceMetrics();
    const recentAlerts = this.metrics.alerts.slice(-10);

    let status = 'healthy';
    let issues = [];

    // Determine health status
    if (metrics.errorRate > 20) {
      status = 'critical';
      issues.push('High error rate');
    } else if (metrics.errorRate > 10) {
      status = 'degraded';
      issues.push('Elevated error rate');
    }

    if (metrics.memoryEfficiency > 95) {
      status = status === 'critical' ? 'critical' : 'warning';
      issues.push('High memory usage');
    }

    if (recentAlerts.some(alert => alert.severity === 'high')) {
      status = 'critical';
      issues.push('Active high-severity alerts');
    }

    return {
      status,
      issues,
      metrics,
      uptime: Date.now() - this.metrics.startTime,
      lastCheck: Date.now()
    };
  }

  generateReport(options = {}) {
    const { startDate, endDate, format = 'json' } = options;

    let reportData = this.history;

    // Filter by date range
    if (startDate || endDate) {
      reportData = this.history.filter(entry => {
        const entryDate = new Date(entry.timestamp);
        if (startDate && entryDate < startDate) return false;
        if (endDate && entryDate > endDate) return false;
        return true;
      });
    }

    const report = {
      generatedAt: new Date().toISOString(),
      period: {
        start: startDate || this.metrics.startTime,
        end: endDate || Date.now()
      },
      summary: this.calculatePerformanceMetrics(),
      operations: this.metrics.operations,
      alerts: this.metrics.alerts,
      data: reportData,
      recommendations: this.generateRecommendations()
    };

    if (format === 'text') {
      return this.formatTextReport(report);
    }

    return report;
  }

  generateRecommendations() {
    const recommendations = [];
    const metrics = this.calculatePerformanceMetrics();

    if (metrics.errorRate > 5) {
      recommendations.push('Consider implementing additional error handling and retry mechanisms');
    }

    if (metrics.memoryEfficiency > 85) {
      recommendations.push('Monitor memory usage and consider implementing memory optimization techniques');
    }

    if (metrics.averageResponseTime > 5000) {
      recommendations.push('Consider optimizing slow operations or implementing caching');
    }

    if (metrics.operationsPerMinute < 10) {
      recommendations.push('Consider scaling up parallel processing capacity');
    }

    return recommendations;
  }

  formatTextReport(report) {
    let text = `Performance Report\n`;
    text += `Generated: ${report.generatedAt}\n\n`;

    text += `Summary:\n`;
    text += `- Total Operations: ${report.summary.totalOperations}\n`;
    text += `- Operations/Minute: ${report.summary.operationsPerMinute.toFixed(1)}\n`;
    text += `- Error Rate: ${report.summary.errorRate.toFixed(1)}%\n`;
    text += `- Avg Response Time: ${report.summary.averageResponseTime.toFixed(0)}ms\n`;
    text += `- Peak Memory: ${(report.summary.peakMemoryUsage / 1024 / 1024).toFixed(1)}MB\n\n`;

    text += `Recommendations:\n`;
    report.recommendations.forEach(rec => {
      text += `- ${rec}\n`;
    });

    return text;
  }
}

module.exports = PerformanceMonitor;
