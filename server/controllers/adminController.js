const { successResponse } = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const catchAsync = require('../utils/catchAsync');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { processImageDirectly } = require('../jobs/imageProcessor');

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
        // C10 Fix: Order model uses 'qty' not 'quantity' — this caused sales to always be 0
        sales: { $sum: '$items.qty' },
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

/**
 * @desc    Reprocess a product to regenerate all image variants (including mobile)
 * @route   POST /api/v1/admin/products/:id/reprocess
 * @access  Private/Admin
 */
const reprocessProduct = catchAsync(async (req, res) => {
  const { id } = req.params;
  
  const product = await Product.findById(id);
  if (!product) {
    throw ApiError.notFound('Product not found');
  }

  // Get original key from assets
  const originalKey = product.assets?.original?.key;
  if (!originalKey) {
    throw ApiError.badRequest('Product has no original asset to reprocess from');
  }

  // Reset assets status
  product.assets.status = 'processing';
  product.status = 'pending';
  await product.save();

  // Process synchronously (for admin action, we want immediate feedback)
  try {
    const result = await processImageDirectly({
      productId: id,
      r2OriginalKey: originalKey,
      creatorId: product.creatorId?.toString() || 'admin',
    });

    const updatedProduct = await Product.findById(id);
    
    res.status(200).json(
      successResponse({
        message: 'Product reprocessed successfully',
        data: {
          product: updatedProduct,
          processingResult: result,
        },
      })
    );
  } catch (error) {
    product.assets.status = 'failed';
    product.status = 'pending';
    await product.save();
    throw ApiError.internal(`Reprocessing failed: ${error.message}`);
  }
});

/**
 * @desc    Reprocess all products that are missing mobile variants
 * @route   POST /api/v1/admin/products/reprocess-all
 * @access  Private/Admin
 */
const reprocessAllProducts = catchAsync(async (req, res) => {
  // Find all active products missing mobile variants
  const products = await Product.find({
    status: 'active',
    'assets.original.key': { $exists: true },
    $or: [
      { 'assets.mobile-portrait': null },
      { 'assets.mobile-portrait': { $exists: false } },
      { 'assets.720p': null },
      { 'assets.720p': { $exists: false } },
    ],
  });

  const results = {
    total: products.length,
    processed: 0,
    failed: 0,
    errors: [],
  };

  for (const product of products) {
    const originalKey = product.assets?.original?.key;
    if (!originalKey) {
      results.failed++;
      results.errors.push({ id: product._id, name: product.name, error: 'No original asset' });
      continue;
    }

    try {
      product.assets.status = 'processing';
      product.status = 'pending';
      await product.save();

      await processImageDirectly({
        productId: product._id.toString(),
        r2OriginalKey: originalKey,
        creatorId: product.creatorId?.toString() || 'admin',
      });

      results.processed++;
    } catch (error) {
      results.failed++;
      results.errors.push({ id: product._id, name: product.name, error: error.message });
      
      try {
        product.assets.status = 'failed';
        product.status = 'pending';
        await product.save();
      } catch {}
    }
  }

  res.status(200).json(
    successResponse({
      message: `Reprocessing complete: ${results.processed}/${results.total} successful`,
      data: results,
    })
  );
});

module.exports = {
  getAdminStats,
  reprocessProduct,
  reprocessAllProducts,
};
