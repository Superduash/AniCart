const { successResponse, paginatedResponse } = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');
const reviewService = require('../services/reviewService');

const createReview = catchAsync(async (req, res) => {
  const { rating, comment } = req.body;
  const review = await reviewService.createReview(req.user.id, req.params.productId, rating, comment);

  res.status(201).json(
    successResponse({
      message: 'Review created successfully',
      data: { review },
    })
  );
});

const getProductReviews = catchAsync(async (req, res) => {
  const { reviews, page, limit, total } = await reviewService.getProductReviews(req.params.productId, req.query);

  res.status(200).json(
    paginatedResponse({
      message: 'Reviews retrieved successfully',
      data: reviews,
      page,
      limit,
      total,
    })
  );
});

const deleteReview = catchAsync(async (req, res) => {
  await reviewService.deleteReview(req.user.id, req.params.id);

  res.status(200).json(
    successResponse({
      message: 'Review deleted successfully',
    })
  );
});

module.exports = {
  createReview,
  getProductReviews,
  deleteReview,
};
