const cron = require('node-cron');
const User = require('../models/User');
const emailService = require('../services/emailService');
const logger = require('../utils/logger');

/**
 * Abandoned Cart Recovery Worker
 * Runs every hour to find carts that have been abandoned for > 24 hours
 */

const processAbandonedCarts = async () => {
  try {
    const Cart = require('../models/Cart');
    const User = require('../models/User');
    const threshold = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const oldCarts = await Cart.find({
      updatedAt: { $lte: threshold },
      'items.0': { $exists: true }
    }).limit(50);
    for (const cart of oldCarts) {
      const user = await User.findById(cart.user);
      if (user) {
        console.log(`[STUB] Abandoned cart email to ${user.email} (${cart.items.length} items)`);
      }
    }
  } catch (error) {
    logger.error('[Abandoned Cart Worker] Error:', error);
  }
};

// Schedule to run every hour at minute 0
cron.schedule('0 * * * *', processAbandonedCarts);

module.exports = {
  processAbandonedCarts
};
