/**
 * Self-ping scheduler to keep the backend warm.
 */

const config = require('../config');
const logger = require('./logger');

let isPingInProgress = false;
let intervalId = null;
let sigintHandler = null;
let sigtermHandler = null;

/**
 * Determines the target base URL of the running server.
 * Priority:
 * 1. Existing public URL present in the project environment.
 * 2. Existing server URL configuration.
 * 3. Current server address if available.
 * 4. Fallback to http://localhost:<port>
 */
function getTargetUrl(server, port) {
  // 1. Existing frontend/backend public URL in environment
  const envUrl = process.env.RENDER_EXTERNAL_URL || process.env.SERVER_URL || process.env.API_URL || process.env.BACKEND_URL;
  if (envUrl) {
    return envUrl.replace(/\/$/, '');
  }

  // 2. Existing server URL configuration
  if (config.SERVER_URL) {
    return config.SERVER_URL.replace(/\/$/, '');
  }

  // 3. Current server address if available
  if (server && typeof server.address === 'function') {
    const addr = server.address();
    if (addr) {
      if (typeof addr === 'string') {
        return addr.replace(/\/$/, '');
      }
      const host = addr.address === '::' || addr.address === '0.0.0.0' ? 'localhost' : addr.address;
      return `http://${host}:${addr.port}`;
    }
  }

  // 4. Fallback to localhost
  const portToUse = port || config.PORT || 5000;
  return `http://localhost:${portToUse}`;
}

/**
 * Performs a single HTTP GET request to the health endpoint.
 */
async function pingServer(url) {
  if (isPingInProgress) {
    // Skip if a previous ping is still running
    return;
  }

  isPingInProgress = true;
  const startTime = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10-second timeout

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'AniCart-Self-Ping/1.0',
      },
    });

    clearTimeout(timeoutId);
    const duration = Date.now() - startTime;

    if (response.ok) {
      logger.info(`✓ Self-ping successful (${duration} ms)`);
    } else {
      logger.warn(`⚠ Self-ping failed: Status ${response.status}`);
    }
  } catch (error) {
    clearTimeout(timeoutId);
    let reason = error.message;
    if (error.name === 'AbortError') {
      reason = 'Request timed out after 10s';
    }
    logger.warn(`⚠ Self-ping failed: ${reason}`);
  } finally {
    isPingInProgress = false;
  }
}

/**
 * Starts the self-ping scheduler.
 */
function startSelfPing(server, port) {
  if (intervalId) {
    // Prevent duplicate timers
    return;
  }

  const baseUrl = getTargetUrl(server, port);
  const url = `${baseUrl}/`;

  logger.info('✓ Self-ping scheduler started (10 min interval)');

  // Run the first ping immediately at start (after the 60-second delay)
  pingServer(url).catch((err) => {
    logger.warn(`⚠ Self-ping failed: ${err.message}`);
  });

  // Schedule subsequent pings every 10 minutes
  const INTERVAL_MS = 10 * 60 * 1000; // 10 minutes
  intervalId = setInterval(() => {
    pingServer(url).catch((err) => {
      logger.warn(`⚠ Self-ping failed: ${err.message}`);
    });
  }, INTERVAL_MS);

  // Set up process shutdown cleanups
  sigintHandler = () => {
    cleanup();
  };
  sigtermHandler = () => {
    cleanup();
  };

  process.once('SIGINT', sigintHandler);
  process.once('SIGTERM', sigtermHandler);
}

/**
 * Clears the active interval timer.
 */
function cleanup() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  if (sigintHandler) {
    process.off('SIGINT', sigintHandler);
    sigintHandler = null;
  }
  if (sigtermHandler) {
    process.off('SIGTERM', sigtermHandler);
    sigtermHandler = null;
  }
}

module.exports = {
  startSelfPing,
  cleanup,
};
