/**
 * Order Controller
 *
 * HTTP handlers for orders. Business logic lives in orderService.
 */

const { successResponse, paginatedResponse } = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');
const orderService = require('../services/orderService');

/**
 * @desc    Create order from cart (checkout)
 * @route   POST /api/v1/orders/checkout
 * @access  Private
 */
const checkout = catchAsync(async (req, res) => {
  const populatedOrder = await orderService.checkout(req.user.id);

  res.status(201).json(
    successResponse({
      message: 'Order placed successfully',
      data: { order: populatedOrder },
    })
  );
});

/**
 * @desc    Get user's order history
 * @route   GET /api/v1/orders
 * @access  Private
 */
const getOrders = catchAsync(async (req, res) => {
  const { orders, page, limit, total } = await orderService.getOrders(
    req.user.id,
    req.query
  );

  res.status(200).json(
    paginatedResponse({
      message: 'Orders retrieved successfully',
      data: orders,
      page,
      limit,
      total,
    })
  );
});

/**
 * @desc    Get single order detail
 * @route   GET /api/v1/orders/:id
 * @access  Private
 */
const getOrder = catchAsync(async (req, res) => {
  const order = await orderService.getOrder(req.user.id, req.params.id);

  res.status(200).json(
    successResponse({
      message: 'Order retrieved successfully',
      data: { order },
    })
  );
});

/**
 * @desc    Cancel an order (only if not completed)
 * @route   PUT /api/v1/orders/:id/cancel
 * @access  Private
 */
const cancelOrder = catchAsync(async (req, res) => {
  const order = await orderService.cancelOrder(req.user.id, req.params.id);

  res.status(200).json(
    successResponse({
      message: 'Order cancelled successfully',
      data: { order },
    })
  );
});

/**
 * @desc    Get order statistics for user
 * @route   GET /api/v1/orders/stats/summary
 * @access  Private
 */
const getOrderStats = catchAsync(async (req, res) => {
  const summary = await orderService.getOrderStats(req.user.id);

  res.status(200).json(
    successResponse({
      message: 'Order statistics retrieved successfully',
      data: { stats: summary },
    })
  );
});

module.exports = {
  checkout,
  getOrders,
  getOrder,
  cancelOrder,
  getOrderStats,
};
