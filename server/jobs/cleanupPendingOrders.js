/**
 * Cleanup Pending Orders Job
 * 
 * Cancels pending orders that are older than a configurable threshold
 * to prevent accumulation of abandoned checkout orders.
 * 
 * Runs daily at 2:00 AM (before orphaned file cleanup at 3 AM).
 */

const cron = require('node-cron');
const Order = require('../models/Order');
const logger = require('../utils/logger');

// How old a pending order must be before auto-cancellation (default: 2 hours)
const PENDING_ORDER_MAX_AGE_MS = parseInt(process.env.PENDING_ORDER_MAX_AGE_MS, 10) || 2 * 60 * 60 * 1000;

async function cleanupPendingOrders() {
  const threshold = new Date(Date.now() - PENDING_ORDER_MAX_AGE_MS);
  
  try {
    const result = await Order.updateMany(
      {
        status: 'pending',
        createdAt: { $lt: threshold },
      },
      {
        $set: { status: 'cancelled' },
      }
    );

    if (result.modifiedCount > 0) {
      logger.info(`[CleanupPendingOrders] Cancelled ${result.modifiedCount} abandoned pending order(s) older than ${PENDING_ORDER_MAX_AGE_MS / 3600000}h`);
    }
  } catch (err) {
    logger.error('[CleanupPendingOrders] Failed to cleanup pending orders:', err);
  }
}

/**
 * Start the cron job (runs daily at 2:00 AM)
 */
function startCleanupPendingOrdersJob() {
  cron.schedule('0 2 * * *', cleanupPendingOrders, {
    timezone: 'UTC',
  });
  logger.info(`[CleanupPendingOrders] Scheduled daily at 2:00 AM UTC (max age: ${PENDING_ORDER_MAX_AGE_MS / 3600000}h)`);
}

module.exports = {
  cleanupPendingOrders,
  startCleanupPendingOrdersJob,
};