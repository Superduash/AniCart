/**
 * Order service — checkout, listing, detail, cancel, stats.
 */

const mongoose = require('mongoose');
const stripe = require('stripe')(require('../config').STRIPE_SECRET_KEY);
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const User = require('../models/User');
const License = require('../models/License');
const ApiError = require('../utils/apiError');
const CONSTANTS = require('../utils/constants');

async function createPaymentIntent(userId) {
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

  const order = await Order.createFromCart(userId, cart.items);

  if (!require('../config').STRIPE_SECRET_KEY) {
    // If Stripe isn't configured, we cannot proceed with real payments.
    throw ApiError.internal('Payments are currently disabled');
  }

  const amount = Math.round(order.total * 100);

  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency: 'usd',
    metadata: {
      orderId: order._id.toString(),
      userId: userId.toString(),
    },
  });

  order.stripePaymentIntentId = paymentIntent.id;
  await order.save();

  return {
    clientSecret: paymentIntent.client_secret,
    orderId: order._id,
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
