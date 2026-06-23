/**
 * AniCart Worker Entry Point
 * Runs background jobs (image processing, cleanup jobs) separately from the main API.
 */

require('dotenv').config();
const connectDB = require('./db/database');
const logger = require('./utils/logger');

// Import BullMQ workers (they start automatically on import)
const imageProcessorWorker = require('./jobs/imageProcessor');
require('./jobs/cleanupOrphanedFiles');

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
    logger.info('[MONGO] Connected');
    logger.info('[WORKER] BullMQ Worker listening for jobs...');
  } catch (error) {
    logger.error('[WORKER] Failed to start:', error);
    process.exit(1);
  }
};

startWorker();

// Graceful shutdown
const shutdown = async () => {
  logger.info('[Worker] Shutting down gracefully...');
  if (imageProcessorWorker) {
    await imageProcessorWorker.close();
  }
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
