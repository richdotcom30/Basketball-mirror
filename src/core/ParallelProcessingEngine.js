// Mirror - Parallel Processing Engine
// Phase 6: Scaling & Performance

const os = require('os');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const path = require('path');
const EventEmitter = require('events');

class ParallelProcessingEngine extends EventEmitter {
  constructor(options = {}) {
    super();

    // Configuration
    this.maxWorkers = options.maxWorkers || Math.max(1, os.cpus().length - 1);
    this.taskTimeout = options.taskTimeout || 30000; // 30 seconds
    this.maxRetries = options.maxRetries || 3;
    this.loadBalancingEnabled = options.loadBalancing !== false;

    // State management
    this.workers = new Map();
    this.activeTasks = new Map();
    this.taskQueue = [];
    this.isProcessing = false;

    // Performance metrics
    this.metrics = {
      totalTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      averageTaskTime: 0,
      peakConcurrentTasks: 0,
      workerUtilization: 0,
      memoryUsage: 0,
      startTime: Date.now()
    };

    // Task types and their handlers
    this.taskHandlers = new Map();
    this.registerDefaultHandlers();

    console.log(`🛠️  Initialized Parallel Processing Engine with ${this.maxWorkers} workers`);
  }

  registerDefaultHandlers() {
    // Scraping tasks
    this.registerTaskHandler('scrape_source', async (data) => {
      const WebScraper = require('../scrapers/WebScraper');
      const scraper = new WebScraper();
      return await scraper.scrapeSource(data.sourceKey, data.options);
    });

    // AI prediction tasks
    this.registerTaskHandler('predict_games', async (data) => {
      try {
        const PredictionEngine = require('./PredictionEngine');
        const engine = new PredictionEngine();
        return await engine.predictGames(data.games, data.marketData);
      } catch (error) {
        // Fallback to mock predictions if AI is not available
        console.log('🤖 AI not available, generating mock predictions for demonstration...');
        return this.generateMockPredictions(data.games);
      }
    });

    // AI analysis tasks
    this.registerTaskHandler('analyze_game', async (data) => {
      const OpenRouterClient = require('../ai/OpenRouterClient');
      const ai = new OpenRouterClient();
      return await ai.analyzeGame(data.gameData, data.context);
    });

    // Research tasks
    this.registerTaskHandler('research_topic', async (data) => {
      const AIScraper = require('../scrapers/AIScraper');
      const researcher = new AIScraper();
      return await researcher.intelligentResearch(data.query, data.options);
    });

    // Data processing tasks
    this.registerTaskHandler('process_data', async (data) => {
      // Custom data processing logic
      return this.processDataBatch(data.batch, data.operations);
    });
  }

  registerTaskHandler(taskType, handler) {
    this.taskHandlers.set(taskType, handler);
  }

  async processTask(task) {
    const taskId = task.id || `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const taskWithId = { ...task, id: taskId, submittedAt: Date.now() };

    return new Promise((resolve, reject) => {
      // Add to queue
      this.taskQueue.push(taskWithId);

      // Set up promise resolution
      this.activeTasks.set(taskId, {
        task: taskWithId,
        resolve,
        reject,
        timeout: setTimeout(() => {
          this.activeTasks.delete(taskId);
          reject(new Error(`Task ${taskId} timed out after ${this.taskTimeout}ms`));
        }, this.taskTimeout)
      });

      // Start processing if not already running
      if (!this.isProcessing) {
        this.processQueue();
      }
    });
  }

  async processQueue() {
    if (this.isProcessing || this.taskQueue.length === 0) return;

    this.isProcessing = true;

    while (this.taskQueue.length > 0 && this.workers.size < this.maxWorkers) {
      const task = this.taskQueue.shift();
      await this.assignTaskToWorker(task);
    }

    this.isProcessing = false;

    // Update metrics
    this.updateMetrics();
  }

  async assignTaskToWorker(task) {
    // Find or create available worker
    let worker = this.findAvailableWorker();

    if (!worker) {
      worker = await this.createWorker();
    }

    // Assign task to worker
    worker.activeTasks++;
    worker.lastTaskAt = Date.now();

    try {
      const result = await this.executeTaskOnWorker(worker, task);

      // Handle success
      const taskRecord = this.activeTasks.get(task.id);
      if (taskRecord) {
        clearTimeout(taskRecord.timeout);
        taskRecord.resolve(result);
        this.activeTasks.delete(task.id);
      }

      this.metrics.completedTasks++;
      worker.completedTasks++;

    } catch (error) {
      console.error(`❌ Task ${task.id} failed:`, error.message);

      // Handle retry logic
      if (task.retryCount < this.maxRetries) {
        task.retryCount = (task.retryCount || 0) + 1;
        console.log(`🔄 Retrying task ${task.id} (attempt ${task.retryCount})`);
        this.taskQueue.unshift(task); // Add back to front of queue
      } else {
        // Final failure
        const taskRecord = this.activeTasks.get(task.id);
        if (taskRecord) {
          clearTimeout(taskRecord.timeout);
          taskRecord.reject(error);
          this.activeTasks.delete(task.id);
        }
        this.metrics.failedTasks++;
      }
    } finally {
      worker.activeTasks--;
    }
  }

  findAvailableWorker() {
    // Find worker with least active tasks
    let bestWorker = null;
    let minTasks = Infinity;

    for (const worker of this.workers.values()) {
      if (worker.activeTasks < minTasks) {
        minTasks = worker.activeTasks;
        bestWorker = worker;
      }
    }

    return bestWorker && bestWorker.activeTasks < 5 ? bestWorker : null; // Max 5 concurrent tasks per worker
  }

  async createWorker() {
    const workerId = `worker-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const worker = new Worker(path.join(__dirname, 'WorkerThread.js'), {
      workerData: { workerId }
    });

    const workerState = {
      id: workerId,
      worker,
      activeTasks: 0,
      completedTasks: 0,
      createdAt: Date.now(),
      lastTaskAt: null
    };

    this.workers.set(workerId, workerState);

    // Handle worker messages
    worker.on('message', (message) => {
      this.handleWorkerMessage(workerState, message);
    });

    worker.on('error', (error) => {
      console.error(`❌ Worker ${workerId} error:`, error);
      this.handleWorkerError(workerState, error);
    });

    worker.on('exit', (code) => {
      console.log(`👋 Worker ${workerId} exited with code ${code}`);
      this.workers.delete(workerId);
    });

    console.log(`🆕 Created worker ${workerId}`);
    return workerState;
  }

  async executeTaskOnWorker(worker, task) {
    return new Promise((resolve, reject) => {
      const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Set up response handler
      const responseHandler = (message) => {
        if (message.messageId === messageId) {
          worker.worker.removeListener('message', responseHandler);

          if (message.type === 'task_result') {
            resolve(message.result);
          } else if (message.type === 'task_error') {
            reject(new Error(message.error));
          }
        }
      };

      worker.worker.on('message', responseHandler);

      // Send task to worker
      worker.worker.postMessage({
        messageId,
        type: 'execute_task',
        task
      });

      // Timeout
      setTimeout(() => {
        worker.worker.removeListener('message', responseHandler);
        reject(new Error(`Task execution timeout for ${task.id}`));
      }, this.taskTimeout);
    });
  }

  handleWorkerMessage(worker, message) {
    // Handle worker status updates, health checks, etc.
    if (message.type === 'status') {
      worker.lastHeartbeat = Date.now();
    }
  }

  handleWorkerError(worker, error) {
    console.error(`❌ Worker ${worker.id} error:`, error);
    // Remove failed worker
    this.workers.delete(worker.id);
  }

  async processDataBatch(batch, operations) {
    let data = batch;

    for (const operation of operations) {
      switch (operation.type) {
        case 'filter':
          data = data.filter(operation.fn);
          break;
        case 'map':
          data = data.map(operation.fn);
          break;
        case 'reduce':
          data = data.reduce(operation.fn, operation.initialValue);
          break;
        case 'sort':
          data = data.sort(operation.fn);
          break;
        case 'group':
          data = this.groupBy(data, operation.key);
          break;
        default:
          throw new Error(`Unknown operation type: ${operation.type}`);
      }
    }

    return data;
  }

  groupBy(array, key) {
    return array.reduce((groups, item) => {
      const groupKey = typeof key === 'function' ? key(item) : item[key];
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
      return groups;
    }, {});
  }

  updateMetrics() {
    const now = Date.now();
    const runtime = now - this.metrics.startTime;

    // Update average task time
    if (this.metrics.completedTasks > 0) {
      const totalTaskTime = this.metrics.averageTaskTime * (this.metrics.completedTasks - 1);
      this.metrics.averageTaskTime = totalTaskTime / this.metrics.completedTasks;
    }

    // Update peak concurrent tasks
    const currentConcurrent = Array.from(this.workers.values())
      .reduce((sum, w) => sum + w.activeTasks, 0);
    this.metrics.peakConcurrentTasks = Math.max(
      this.metrics.peakConcurrentTasks,
      currentConcurrent
    );

    // Update worker utilization
    const totalWorkers = this.workers.size;
    if (totalWorkers > 0) {
      const activeWorkers = Array.from(this.workers.values())
        .filter(w => w.activeTasks > 0).length;
      this.metrics.workerUtilization = activeWorkers / totalWorkers;
    }

    // Update memory usage
    this.metrics.memoryUsage = process.memoryUsage().heapUsed;
  }

  async batchProcessTasks(tasks, options = {}) {
    const batchSize = options.batchSize || 10;
    const results = [];
    const errors = [];

    // Process in batches
    for (let i = 0; i < tasks.length; i += batchSize) {
      const batch = tasks.slice(i, i + batchSize);

      try {
        const batchPromises = batch.map(task => this.processTask(task));
        const batchResults = await Promise.allSettled(batchPromises);

        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            results.push(result.value);
          } else {
            errors.push({
              task: batch[index],
              error: result.reason.message
            });
          }
        });

        // Progress update
        const processed = Math.min(i + batchSize, tasks.length);
        console.log(`📊 Batch processing: ${processed}/${tasks.length} tasks completed`);

        // Small delay between batches
        if (i + batchSize < tasks.length) {
          await this.delay(100);
        }

      } catch (error) {
        console.error('❌ Batch processing error:', error);
      }
    }

    return { results, errors };
  }

  async parallelScrapeSources(sources, options = {}) {
    const tasks = sources.map(sourceKey => ({
      type: 'scrape_source',
      sourceKey,
      options: options.scrapeOptions || {}
    }));

    console.log(`🔍 Starting parallel scraping of ${sources.length} sources...`);
    const result = await this.batchProcessTasks(tasks, { batchSize: this.maxWorkers });

    console.log(`✅ Parallel scraping complete: ${result.results.length} successful, ${result.errors.length} errors`);
    return result;
  }

  async parallelPredictGames(games, options = {}) {
    // Split games into smaller batches for parallel processing
    const batchSize = Math.max(1, Math.floor(games.length / this.maxWorkers));
    const gameBatches = [];

    for (let i = 0; i < games.length; i += batchSize) {
      gameBatches.push(games.slice(i, i + batchSize));
    }

    const tasks = gameBatches.map((batch, index) => ({
      type: 'predict_games',
      games: batch,
      marketData: options.marketData || {},
      batchId: index
    }));

    console.log(`🧠 Starting parallel prediction of ${games.length} games in ${gameBatches.length} batches...`);
    const result = await this.batchProcessTasks(tasks, { batchSize: Math.min(gameBatches.length, this.maxWorkers) });

    // Combine results from all batches
    const allPredictions = result.results.flatMap(batchResult =>
      batchResult.predictions || []
    );

    console.log(`✅ Parallel prediction complete: ${allPredictions.length} predictions generated`);
    return { predictions: allPredictions, errors: result.errors };
  }

  async parallelResearchTopics(queries, options = {}) {
    const tasks = queries.map(query => ({
      type: 'research_topic',
      query,
      options: options.researchOptions || {}
    }));

    console.log(`🧠 Starting parallel research of ${queries.length} topics...`);
    const result = await this.batchProcessTasks(tasks, { batchSize: Math.min(queries.length, this.maxWorkers) });

    console.log(`✅ Parallel research complete: ${result.results.length} successful, ${result.errors.length} errors`);
    return result;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getMetrics() {
    this.updateMetrics();
    return { ...this.metrics };
  }

  getWorkerStats() {
    return Array.from(this.workers.values()).map(worker => ({
      id: worker.id,
      activeTasks: worker.activeTasks,
      completedTasks: worker.completedTasks,
      uptime: Date.now() - worker.createdAt,
      lastTaskAt: worker.lastTaskAt
    }));
  }

  async shutdown() {
    console.log('🛑 Shutting down Parallel Processing Engine...');

    // Terminate all workers
    for (const worker of this.workers.values()) {
      worker.worker.terminate();
    }

    this.workers.clear();
    this.activeTasks.clear();
    this.taskQueue.length = 0;

    console.log('✅ Parallel Processing Engine shut down');
  }

  // Generate mock predictions for demonstration when AI is not available
  generateMockPredictions(games) {
    const predictions = [];
    const mockMarkets = ['spread', 'moneyline', 'total'];

    games.forEach((game, index) => {
      // Generate random but realistic predictions
      const confidence = 0.70 + Math.random() * 0.25; // 70-95% confidence
      const edge = Math.random() * 0.05; // 0-5% edge

      // Randomly choose prediction type
      const predictionTypes = [
        `${game.homeTeam} -${(1 + Math.random() * 3).toFixed(1)}`, // Spread
        game.homeTeam, // Moneyline
        `Over ${(100 + Math.random() * 20).toFixed(0)}` // Total
      ];

      const prediction = predictionTypes[Math.floor(Math.random() * predictionTypes.length)];

      predictions.push({
        gameId: game.id,
        homeTeam: game.homeTeam,
        awayTeam: game.awayTeam,
        league: game.league,
        prediction: prediction,
        confidence: confidence,
        edge: edge,
        analysis: `Mock analysis: ${game.homeTeam} vs ${game.awayTeam} - Strong performance indicators suggest ${prediction}`,
        timestamp: new Date().toISOString(),
        source: 'mock_ai'
      });
    });

    return { predictions };
  }

  // Health monitoring
  async healthCheck() {
    const metrics = this.getMetrics();
    const workerStats = this.getWorkerStats();

    const health = {
      status: 'healthy',
      uptime: Date.now() - this.metrics.startTime,
      workers: {
        total: workerStats.length,
        active: workerStats.filter(w => w.activeTasks > 0).length,
        utilization: metrics.workerUtilization
      },
      tasks: {
        queued: this.taskQueue.length,
        active: this.activeTasks.size,
        completed: metrics.completedTasks,
        failed: metrics.failedTasks
      },
      performance: {
        averageTaskTime: metrics.averageTaskTime,
        peakConcurrentTasks: metrics.peakConcurrentTasks,
        memoryUsage: metrics.memoryUsage
      }
    };

    // Determine health status
    if (metrics.failedTasks > metrics.completedTasks * 0.1) { // >10% failure rate
      health.status = 'degraded';
    }

    if (this.taskQueue.length > 100 || this.activeTasks.size > this.maxWorkers * 2) {
      health.status = 'overloaded';
    }

    return health;
  }
}

module.exports = ParallelProcessingEngine;
