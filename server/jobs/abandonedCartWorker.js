const cron = require('node-cron');
const { redisConnection } = require('../config/redis');
const User = require('../models/User');
const emailService = require('../services/emailService');
const logger = require('../utils/logger');

/**
 * Abandoned Cart Recovery Worker
 * Runs every hour to find carts that have been abandoned for > 24 hours
 * 
 * Note (Portfolio Project): In a full production environment, this would use a robust 
 * queueing system like BullMQ and track email states in the DB to prevent duplicate emails.
 */

// Format: cart:userId
const CART_PREFIX = 'cart:';
const ABANDONED_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24 hours

const processAbandonedCarts = async () => {
  if (!redisConnection) return;

  try {
    const keys = await redisConnection.keys(`${CART_PREFIX}*`);
    if (!keys || keys.length === 0) return;

    for (const key of keys) {
      const userId = key.split(':')[1];
      if (!userId || userId.length !== 24) continue; // Skip anonymous/invalid carts

      // Use Redis IDLETIME to see how long the key has been untouched
      // idletime returns seconds
      const idleTimeSeconds = await redisConnection.object('IDLETIME', key);
      
      // If idle for more than 24 hours but less than 48 hours (to prevent spamming very old carts)
      if (idleTimeSeconds >= 86400 && idleTimeSeconds < 172800) {
        // Check if we already sent an email (using a simple Redis flag)
        const emailSentKey = `abandoned_email_sent:${userId}`;
        const alreadySent = await redisConnection.get(emailSentKey);

        if (!alreadySent) {
          const user = await User.findById(userId);
          if (user && user.email) {
            const cartData = await redisConnection.get(key);
            const cartItems = JSON.parse(cartData);

            if (cartItems && cartItems.length > 0) {
              logger.info(`[Abandoned Cart Worker] Found abandoned cart for user ${userId} with ${cartItems.length} items. Sending recovery email.`);
              
              // STUB: Call email service
              // await emailService.sendAbandonedCartEmail(user, cartItems);
              console.log(`[STUB] Email sent to ${user.email}: "You left ${cartItems.length} items in your cart!"`);

              // Mark as sent for 7 days
              await redisConnection.setex(emailSentKey, 7 * 24 * 60 * 60, 'true');
            }
          }
        }
      }
    }
  } catch (error) {
    logger.error(`[Abandoned Cart Worker] Error processing carts:`, error);
  }
};

// Schedule to run every hour at minute 0
cron.schedule('0 * * * *', processAbandonedCarts);

module.exports = {
  processAbandonedCarts
};
