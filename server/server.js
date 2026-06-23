/**
 * AniCart Server Entry Point
 * Crash-safe + Sentry + Auto restart via nodemon
 */

// Suppress url.parse warning BEFORE anything loads
const originalEmitWarning = process.emitWarning;
process.emitWarning = (warning, ...args) => {
  const msg = typeof warning === 'string' ? warning : warning?.message || '';
  const code = typeof warning === 'object' ? warning?.code : args[1];

  if (code === 'DEP0169' || msg.includes('url.parse()')) return;
  return originalEmitWarning.call(process, warning, ...args);
};

require('dotenv').config();

const config = require('./config');
const connectDB = require('./db/database');
const { startCreatorMonthlyResetJob } = require('./jobs/creatorMonthlyResetJob');
const logger = require('./utils/logger');

let Sentry;
if (config.SENTRY_DSN) {
  Sentry = require('@sentry/node');
  Sentry.init({
    dsn: config.SENTRY_DSN,
    environment: config.NODE_ENV || 'development',
    tracesSampleRate: 1.0,
  });
}

const app = require('./app');

let server;

// GLOBAL ERROR HANDLERS (VERY IMPORTANT)
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
  if (Sentry) Sentry.captureException(err);
  shutdown();
});

process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION:', err);
  if (Sentry) Sentry.captureException(err);
  shutdown();
});

function shutdown() {
  console.log('Shutting down gracefully...');

  if (server) {
    server.close(() => {
      console.log('Process terminated');
      process.exit(1);
    });

    // Force close after 10s
    setTimeout(() => {
      process.exit(1);
    }, 10000);
  } else {
    process.exit(1);
  }
}

// Connect DB
connectDB();
startCreatorMonthlyResetJob();

// Start server
const PORT = config.PORT || 5000;

server = app.listen(PORT, () => {
  logger.info(`[API] Server running on port ${PORT}`);
  logger.info(`[API] Environment: ${config.NODE_ENV}`);
  logger.info(`[API] URL: http://localhost:${PORT}/api/v1`);
});
