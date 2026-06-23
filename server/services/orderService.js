/**
 * Order service — checkout, listing, detail, cancel, stats.
 */

const mongoose = require('mongoose');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const User = require('../models/User');
const ApiError = require('../utils/apiError');
const CONSTANTS = require('../utils/constants');

async function checkout(userId) {
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

  const purchasedProductIds = cart.items.map((item) => item.product._id);
  await User.findByIdAndUpdate(userId, {
    $addToSet: { library: { $each: purchasedProductIds } },
    $inc: {
      purchasesCount: cart.items.length,
      points: Math.floor(order.total * 10),
    },
  });

  await cart.clearCart();

  const populatedOrder = await Order.findById(order._id).populate({
    path: 'items.product',
    select: '-__v',
  });

  return populatedOrder;
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
  checkout,
  getOrders,
  getOrder,
  cancelOrder,
  getOrderStats,
};
