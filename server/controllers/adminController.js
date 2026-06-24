const { successResponse } = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');

/**
 * @desc    Get admin statistics
 * @route   GET /api/v1/admin/stats
 * @access  Private/Admin
 */
const getAdminStats = catchAsync(async (req, res) => {
  const [totalUsers, totalProducts, totalOrders] = await Promise.all([
    User.countDocuments(),
    Product.countDocuments(),
    Order.countDocuments({ status: 'completed' }),
  ]);

  const orders = await Order.find({ status: 'completed' }).select('total');
  const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);

  // New users this week
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const newUsersThisWeek = await User.countDocuments({ createdAt: { $gte: oneWeekAgo } });

  // Top selling products based on orders
  // Using an aggregation to find top-selling products
  const topSelling = await Order.aggregate([
    { $match: { status: 'completed' } },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.product',
        sales: { $sum: '$items.quantity' },
        revenue: { $sum: '$items.price' },
      },
    },
    { $sort: { sales: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'product',
      },
    },
    { $unwind: '$product' },
    {
      $project: {
        _id: 1,
        sales: 1,
        revenue: 1,
        name: '$product.name',
        price: '$product.price',
        img: '$product.img',
      },
    },
  ]);

  res.status(200).json(
    successResponse({
      message: 'Admin stats retrieved successfully',
      data: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue: Number(totalRevenue.toFixed(2)),
        newUsersThisWeek,
        topSellingProducts: topSelling,
      },
    })
  );
});

module.exports = {
  getAdminStats,
};
