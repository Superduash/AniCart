/**
 * Order service — checkout, listing, detail, cancel, stats.
 */

const mongoose = require('mongoose');
const stripe = require('stripe')(require('../config').STRIPE_SECRET_KEY);
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const User = require('../models/User');
const Product = require('../models/Product');
const License = require('../models/License');
const ApiError = require('../utils/apiError');
const CONSTANTS = require('../utils/constants');
const config = require('../config');

// Regional tax rates by country code (ISO 3166-1 alpha-2)
const REGIONAL_TAX_RATES = {
  US: 0, CA: 0.13, GB: 0.20, EU: 0.20, AU: 0.10,
  IN: 0.18, JP: 0.10, BR: 0.17, DE: 0.19, FR: 0.20,
};

// Platform fee percentage (what AniCart keeps from each creator sale)
const PLATFORM_FEE_PERCENT = 0.15; // 15%

async function createPaymentIntent(userId, countryCode = 'US') {
  const cart = await Cart.findOne({ user: userId }).populate({
    path: 'items.product',
    select: '-__v',
  });

  if (!cart || cart.items.length === 0) {
    throw ApiError.badRequest('Cart is empty');
  }

  const inactiveItems = cart.items.filter((item) => item.product?.status !== 'active');
  if (inactiveItems.length > 0) {
    const productNames = inactiveItems.map((item) => item.product?.name || 'Unknown');
    throw ApiError.badRequest(
      `Some items are no longer available: ${productNames.join(', ')}`
    );
  }

  // H4 Fix: prevent repurchasing already-owned products
  const existingLicenses = await License.find({
    user: userId,
    product: { $in: cart.items.map(i => i.product._id) },
    isActive: true,
  }).select('product');

  if (existingLicenses.length > 0) {
    const ownedIds = new Set(existingLicenses.map(l => l.product.toString()));
    const alreadyOwned = cart.items.filter(i => ownedIds.has(i.product._id.toString()));
    const names = alreadyOwned.map(i => i.product.name).join(', ');
    throw ApiError.badRequest(`You already own: ${names}. Remove them from your cart.`);
  }

  if (!require('../config').STRIPE_SECRET_KEY) {
    throw ApiError.internal('Payments are currently disabled');
  }

  // GAP 1 FIX: Idempotency — check for existing pending order with same cart items
  const cartProductIds = cart.items.map(i => i.product._id.toString()).sort();
  const cartHash = require('crypto')
    .createHash('sha256')
    .update(`${userId}:${cartProductIds.join(',')}`)
    .digest('hex');

  const existingPendingOrder = await Order.findOne({
    user: userId,
    status: 'pending',
    _cartHash: cartHash,
    createdAt: { $gt: new Date(Date.now() - 30 * 60 * 1000) }, // within 30 min
  });

  let order;
  if (existingPendingOrder && existingPendingOrder.stripePaymentIntentId) {
    // Reuse existing pending order — fetch its PaymentIntent to return clientSecret
    order = existingPendingOrder;
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(order.stripePaymentIntentId);
      return {
        clientSecret: paymentIntent.client_secret,
        orderId: order._id,
        total: order.total,
        subtotal: order.subtotal,
        tax: order.tax,
      };
    } catch (err) {
      // PaymentIntent may have expired; fall through to create new one
      order = existingPendingOrder;
    }
  } else {
    order = await Order.createFromCart(userId, cart.items);
    order._cartHash = cartHash;
    
    // GAP 8: Apply regional tax based on country code
    const taxRate = REGIONAL_TAX_RATES[countryCode?.toUpperCase()] ?? 0;
    if (taxRate > 0) {
      order.tax = Number((order.subtotal * taxRate).toFixed(2));
      order.total = Number((order.subtotal + order.tax).toFixed(2));
      order.taxRate = taxRate;
      order.countryCode = countryCode.toUpperCase();
    }
    
    await order.save();
  }

  const amount = Math.round(order.total * 100);

  // GAP 7: Calculate revenue splits for connected creators
  const transferData = [];
  const creatorItems = {};
  
  for (const item of cart.items) {
    const creatorId = item.product?.creatorId?.toString();
    if (!creatorId) continue;
    if (!creatorItems[creatorId]) creatorItems[creatorId] = 0;
    creatorItems[creatorId] += item.price || 0;
  }

  for (const [creatorId, grossAmount] of Object.entries(creatorItems)) {
    const creator = await User.findById(creatorId).select('creatorStats');
    if (!creator?.creatorStats?.stripeAccountId || !creator.creatorStats.payoutsEnabled) continue;
    
    const platformFee = Math.round(grossAmount * PLATFORM_FEE_PERCENT * 100);
    const creatorAmount = Math.round(grossAmount * 100) - platformFee;
    
    if (creatorAmount > 0) {
      transferData.push({
        destination: creator.creatorStats.stripeAccountId,
        amount: creatorAmount,
      });
    }
  }

  // Use idempotency key to prevent duplicate PaymentIntents on retries
  const paymentIntentParams = {
    amount,
    currency: 'usd',
    metadata: {
      orderId: order._id.toString(),
      userId: userId.toString(),
    },
  };

  // Add transfer_data if there are connected creators (GAP 7)
  if (transferData.length > 0) {
    paymentIntentParams.transfer_data = transferData;
  }

  const paymentIntent = await stripe.paymentIntents.create(
    paymentIntentParams,
    {
      idempotencyKey: `order_${order._id.toString()}`,
    }
  );

  order.stripePaymentIntentId = paymentIntent.id;
  await order.save();

  return {
    clientSecret: paymentIntent.client_secret,
    orderId: order._id,
    total: order.total,
    subtotal: order.subtotal,
    tax: order.tax,
  };
}

async function completeOrder(paymentIntentId) {
  const order = await Order.findOne({ stripePaymentIntentId: paymentIntentId });
  if (!order || order.status === 'completed') return;

  order.status = 'completed';
  await order.save();

  const purchasedProductIds = order.items.map((item) => item.product);

  const licenseOps = purchasedProductIds.map((productId) => ({
    updateOne: {
      filter: { user: order.user, product: productId },
      update: { $setOnInsert: { user: order.user, product: productId, isActive: true, downloadCount: 0, maxDownloads: 10 } },
      upsert: true,
    },
  }));
  
  if (licenseOps.length > 0) {
    await License.bulkWrite(licenseOps);
  }

  await User.findByIdAndUpdate(order.user, {
    $addToSet: { library: { $each: purchasedProductIds } },
    $inc: {
      purchasesCount: order.items.length,
      points: Math.floor(order.total * 10),
    },
  });

  const cart = await Cart.findOne({ user: order.user });
  if (cart) {
    await cart.clearCart();
  }

  // send order receipt email
  const user = await User.findById(order.user).select('name email');
  const populatedOrder = await Order.findById(order._id).populate({
    path: 'items.product',
    select: '-__v',
  });
  
  const { sendOrderReceiptEmail } = require('./emailService');
  await sendOrderReceiptEmail(user, populatedOrder).catch((err) => require('../utils/logger').error('Receipt email failed', err));
}

/**
 * @param {string} userId
 * @param {{ page?: string|number, limit?: string|number, status?: string }} query
 */
async function getOrders(userId, query) {
  const { page = 1, limit = CONSTANTS.DEFAULTS.PAGE_LIMIT, status } = query;

  const filter = { user: userId };
  if (status) {
    filter.status = status;
  }

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(
    CONSTANTS.LIMITS.MAX_PAGE_SIZE,
    Math.max(1, parseInt(limit, 10))
  );
  const skip = (pageNum - 1) * limitNum;

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate({
        path: 'items.product',
        select: '-__v',
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Order.countDocuments(filter),
  ]);

  return { orders, page: pageNum, limit: limitNum, total };
}

async function getOrder(userId, id) {
  const order = await Order.findOne({
    _id: id,
    user: userId,
  }).populate({
    path: 'items.product',
    select: '-__v',
  });

  if (!order) {
    throw ApiError.notFound('Order not found');
  }

  return order;
}

async function cancelOrder(userId, id) {
  const order = await Order.findOne({
    _id: id,
    user: userId,
  });

  if (!order) {
    throw ApiError.notFound('Order not found');
  }

  // GAP 4 FIX: Refund completed orders via Stripe
  if (order.status === 'completed' && order.stripePaymentIntentId) {
    try {
      await stripe.refunds.create({
        payment_intent: order.stripePaymentIntentId,
      });
    } catch (err) {
      // Log but don't block cancellation — refund can be manual
      require('../utils/logger').error(`Refund failed for order ${id}:`, err.message);
    }
  }

  await order.cancel();
  return order;
}

async function getOrderStats(userId) {
  const stats = await Order.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalSpent: { $sum: '$total' },
        completedOrders: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
        },
        cancelledOrders: {
          $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] },
        },
      },
    },
  ]);

  return (
    stats[0] || {
      totalOrders: 0,
      totalSpent: 0,
      completedOrders: 0,
      cancelledOrders: 0,
    }
  );
}

module.exports = {
  createPaymentIntent,
  completeOrder,
  getOrders,
  getOrder,
  cancelOrder,
  getOrderStats,
};
