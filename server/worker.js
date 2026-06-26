/**
 * AniCart Worker Entry Point
 * Runs background jobs (image processing, cleanup jobs) separately from the main API.
 */

// Suppress BullMQ Eviction policy warning
const originalConsoleWarn = console.warn;
console.warn = (...args) => {
  const msg = args.join(' ');
  if (msg.includes('Eviction policy') && msg.includes('noeviction')) return;
  return originalConsoleWarn.apply(console, args);
};

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const connectDB = require('./db/database');
const logger = require('./utils/logger');

// Import BullMQ workers (they start automatically on import)
const imageProcessorWorker = require('./jobs/imageProcessor');
const { scheduleCleanupJob } = require('./jobs/cleanupOrphanedFiles');
const { startCleanupPendingOrdersJob } = require('./jobs/cleanupPendingOrders');

// Global crash handlers
process.on('uncaughtException', (err) => {
  logger.error('[Worker] Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  logger.error('[Worker] Unhandled Rejection:', err);
  process.exit(1);
});

const startWorker = async () => {
  try {
    await connectDB();
    logger.info(`✓ Environment: ${process.env.NODE_ENV ? process.env.NODE_ENV.charAt(0).toUpperCase() + process.env.NODE_ENV.slice(1) : 'Development'}`);
    
    // Start scheduling cleanup jobs
    scheduleCleanupJob();
    startCleanupPendingOrdersJob();
  } catch (error) {
    logger.error(`✗ Worker Failed to Start: ${error.message}`);
    process.exit(1);
  }
};

startWorker();

// Graceful shutdown
const shutdown = async () => {
  logger.info('[Worker] Shutting down gracefully...');
  if (imageProcessorWorker) {
    try {
      await imageProcessorWorker.close();
    } catch (err) {
      logger.error('[Worker] Error closing worker:', err.message);
    }
  }
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
