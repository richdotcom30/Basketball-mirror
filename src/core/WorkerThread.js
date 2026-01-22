// Mirror - Worker Thread for Parallel Processing
// Phase 6: Scaling & Performance

const { parentPort, workerData } = require('worker_threads');
const { workerId } = workerData;

// Task handlers registry
const taskHandlers = new Map();

// Register default task handlers
taskHandlers.set('scrape_source', async (data) => {
  // Import required modules
  const WebScraper = require('../scrapers/WebScraper');
  const scraper = new WebScraper();

  try {
    const result = await scraper.scrapeSource(data.sourceKey, data.options || {});
    return result;
  } catch (error) {
    throw new Error(`Scraping failed: ${error.message}`);
  }
});

taskHandlers.set('predict_games', async (data) => {
  // Import required modules
  const PredictionEngine = require('./PredictionEngine');
  const engine = new PredictionEngine();

  try {
    const result = await engine.predictGames(data.games || [], data.marketData || {});
    return result;
  } catch (error) {
    throw new Error(`Prediction failed: ${error.message}`);
  }
});

taskHandlers.set('analyze_game', async (data) => {
  // Import required modules
  const OpenRouterClient = require('../ai/OpenRouterClient');
  const ai = new OpenRouterClient();

  try {
    const result = await ai.analyzeGame(data.gameData, data.context || {});
    return result;
  } catch (error) {
    throw new Error(`Analysis failed: ${error.message}`);
  }
});

taskHandlers.set('research_topic', async (data) => {
  // Import required modules
  const AIScraper = require('../scrapers/AIScraper');
  const researcher = new AIScraper();

  try {
    const result = await researcher.intelligentResearch(data.query, data.options || {});
    return result;
  } catch (error) {
    throw new Error(`Research failed: ${error.message}`);
  }
});

taskHandlers.set('process_data', async (data) => {
  try {
    let result = data.batch || [];

    // Apply operations sequentially
    for (const operation of data.operations || []) {
      result = applyOperation(result, operation);
    }

    return result;
  } catch (error) {
    throw new Error(`Data processing failed: ${error.message}`);
  }
});

// Helper function for data operations
function applyOperation(data, operation) {
  switch (operation.type) {
    case 'filter':
      return data.filter(operation.fn);
    case 'map':
      return data.map(operation.fn);
    case 'reduce':
      return data.reduce(operation.fn, operation.initialValue);
    case 'sort':
      return [...data].sort(operation.fn);
    case 'group':
      return groupBy(data, operation.key);
    case 'transform':
      return operation.fn(data);
    default:
      throw new Error(`Unknown operation type: ${operation.type}`);
  }
}

function groupBy(array, key) {
  return array.reduce((groups, item) => {
    const groupKey = typeof key === 'function' ? key(item) : item[key];
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(item);
    return groups;
  }, {});
}

// Handle messages from main thread
parentPort.on('message', async (message) => {
  const { messageId, type, task } = message;

  try {
    let result;

    switch (type) {
      case 'execute_task':
        const handler = taskHandlers.get(task.type);
        if (!handler) {
          throw new Error(`Unknown task type: ${task.type}`);
        }

        // Execute the task
        result = await handler(task);
        break;

      case 'health_check':
        result = {
          workerId,
          status: 'healthy',
          uptime: Date.now() - process.hrtime()[0] * 1000,
          memory: process.memoryUsage(),
          activeHandlers: Array.from(taskHandlers.keys())
        };
        break;

      case 'shutdown':
        // Graceful shutdown
        parentPort.postMessage({
          messageId,
          type: 'shutdown_ack',
          result: { workerId, status: 'shutting_down' }
        });
        process.exit(0);
        return;

      default:
        throw new Error(`Unknown message type: ${type}`);
    }

    // Send success response
    parentPort.postMessage({
      messageId,
      type: 'task_result',
      result
    });

  } catch (error) {
    // Send error response
    parentPort.postMessage({
      messageId,
      type: 'task_error',
      error: error.message,
      stack: error.stack
    });
  }
});

// Send periodic heartbeat
setInterval(() => {
  parentPort.postMessage({
    type: 'status',
    workerId,
    timestamp: Date.now(),
    memory: process.memoryUsage().rss
  });
}, 30000); // Every 30 seconds

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error(`Worker ${workerId} uncaught exception:`, error);
  parentPort.postMessage({
    type: 'worker_error',
    workerId,
    error: error.message,
    stack: error.stack
  });
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(`Worker ${workerId} unhandled rejection:`, reason);
  parentPort.postMessage({
    type: 'worker_error',
    workerId,
    error: reason.toString()
  });
});

// Signal ready
parentPort.postMessage({
  type: 'worker_ready',
  workerId,
  timestamp: Date.now()
});

console.log(`🧵 Worker thread ${workerId} started and ready`);
