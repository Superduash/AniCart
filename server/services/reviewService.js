const Review = require('../models/Review');
const Product = require('../models/Product');
const License = require('../models/License');
const ApiError = require('../utils/apiError');
const CONSTANTS = require('../utils/constants');
const mongoose = require('mongoose');

async function updateProductStats(productId) {
  const stats = await Review.aggregate([
    { $match: { productId: new mongoose.Types.ObjectId(productId) } },
    {
      $group: {
        _id: '$productId',
        avgRating: { $avg: '$rating' },
        numReviews: { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    await Product.findByIdAndUpdate(productId, {
      rating: Math.round(stats[0].avgRating * 10) / 10,
      reviews: stats[0].numReviews,
    });
  } else {
    await Product.findByIdAndUpdate(productId, {
      rating: 0,
      reviews: 0,
    });
  }
}

async function createReview(userId, productId, rating, comment) {
  const license = await License.findOne({ user: userId, product: productId, isActive: true });
  if (!license) {
    throw ApiError.forbidden('You must purchase this product to review it');
  }

  const existingReview = await Review.findOne({ userId, productId });
  if (existingReview) {
    throw ApiError.badRequest('You have already reviewed this product');
  }

  const review = await Review.create({
    userId,
    productId,
    rating,
    comment,
  });

  await updateProductStats(productId);

  return review;
}

async function getProductReviews(productId, query) {
  const { page = 1, limit = CONSTANTS.DEFAULTS.PAGE_LIMIT } = query;
  
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(CONSTANTS.LIMITS.MAX_PAGE_SIZE, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const [reviews, total] = await Promise.all([
    Review.find({ productId })
      .populate('userId', 'name avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Review.countDocuments({ productId }),
  ]);

  return { reviews, page: pageNum, limit: limitNum, total };
}

async function deleteReview(userId, reviewId) {
  const review = await Review.findById(reviewId);
  if (!review) {
    throw ApiError.notFound('Review not found');
  }

  if (review.userId.toString() !== userId.toString()) {
    throw ApiError.forbidden('You can only delete your own reviews');
  }

  const productId = review.productId;
  await Review.findByIdAndDelete(reviewId);

  await updateProductStats(productId);
}

module.exports = {
  createReview,
  getProductReviews,
  deleteReview,
};
