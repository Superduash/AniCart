/**
 * Creator controller
 * Handles creator application flow and admin review actions.
 */

const User = require('../models/User');
const ApiError = require('../utils/apiError');
const CONSTANTS = require('../utils/constants');
const { successResponse } = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const resolveCreatorLevel = (salesCount = 0) => {
  if (salesCount >= 50) {
    return { creatorLevel: 'pro', uploadLimit: 1000 };
  }

  if (salesCount >= 10) {
    return { creatorLevel: 'growing', uploadLimit: 20 };
  }

  return { creatorLevel: 'new', uploadLimit: 5 };
};

const applyCreator = catchAsync(async (req, res) => {
  const { displayName, portfolioLink, paymentEmail, rightsAgreement } = req.body;

  const user = await User.findById(req.user.id);
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  if (user.role === CONSTANTS.ROLES.CREATOR) {
    throw ApiError.badRequest('You are already a creator.');
  }

  if (user.role !== CONSTANTS.ROLES.USER) {
    throw ApiError.badRequest('Only users can apply to become creators.');
  }

  if (user.creatorRequest?.status === 'pending') {
    throw ApiError.badRequest('Creator application is already pending.');
  }

  const now = new Date();
  const accountAgeMs = now.getTime() - new Date(user.createdAt).getTime();
  const isLocked = user.lockUntil && new Date(user.lockUntil) > now;
  const canAutoApprove =
    user.isVerified === true &&
    accountAgeMs > ONE_DAY_MS &&
    (rightsAgreement === true || rightsAgreement === 'true') &&
    !isLocked;

  user.creatorRequest = {
    status: canAutoApprove ? 'approved' : 'pending',
    displayName: String(displayName).trim(),
    portfolioLink: portfolioLink ? String(portfolioLink).trim() : undefined,
    paymentEmail: String(paymentEmail).trim().toLowerCase(),
    requestedAt: now,
    reviewedAt: canAutoApprove ? now : undefined,
  };

  if (canAutoApprove) {
    user.role = CONSTANTS.ROLES.CREATOR;
    if (!user.creatorStats) {
      user.creatorStats = {};
    }
    const { creatorLevel, uploadLimit } = resolveCreatorLevel(user.creatorStats?.salesCount || 0);
    user.creatorStats.uploadsThisMonth = user.creatorStats?.uploadsThisMonth || 0;
    user.creatorStats.salesCount = user.creatorStats?.salesCount || 0;
    user.creatorStats.creatorLevel = creatorLevel;
    user.creatorStats.uploadLimit = uploadLimit;
  }

  await user.save();

  const message = canAutoApprove
    ? 'You are now a creator.'
    : 'Application submitted and under review.';

  return res.status(200).json(
    successResponse({
      message,
      data: {
        creatorRequest: user.creatorRequest,
        role: user.role,
      },
    })
  );
});

const getPendingCreatorRequests = catchAsync(async (req, res) => {
  const users = await User.find({ 'creatorRequest.status': 'pending' })
    .select('name email role creatorRequest createdAt')
    .sort({ 'creatorRequest.requestedAt': -1 });

  return res.status(200).json(
    successResponse({
      message: 'Pending creator requests fetched successfully',
      data: { users },
    })
  );
});

const approveCreator = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const user = await User.findById(userId);

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  const { creatorLevel, uploadLimit } = resolveCreatorLevel(user.creatorStats?.salesCount || 0);

  user.role = CONSTANTS.ROLES.CREATOR;
  if (!user.creatorRequest) {
    user.creatorRequest = {};
  }
  if (!user.creatorStats) {
    user.creatorStats = {};
  }
  user.creatorRequest.status = 'approved';
  user.creatorRequest.reviewedAt = new Date();
  user.creatorStats.uploadsThisMonth = user.creatorStats?.uploadsThisMonth || 0;
  user.creatorStats.salesCount = user.creatorStats?.salesCount || 0;
  user.creatorStats.creatorLevel = creatorLevel;
  user.creatorStats.uploadLimit = uploadLimit;

  await user.save();

  return res.status(200).json(
    successResponse({
      message: 'Creator approved',
      data: {
        userId: user._id,
        role: user.role,
        creatorRequest: user.creatorRequest,
      },
    })
  );
});

const rejectCreator = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const user = await User.findById(userId);

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  user.role = CONSTANTS.ROLES.USER;
  if (!user.creatorRequest) {
    user.creatorRequest = {};
  }
  user.creatorRequest.status = 'rejected';
  user.creatorRequest.reviewedAt = new Date();

  await user.save();

  return res.status(200).json(
    successResponse({
      message: 'Creator rejected',
      data: {
        userId: user._id,
        role: user.role,
        creatorRequest: user.creatorRequest,
      },
    })
  );
});

const getCreatorProducts = catchAsync(async (req, res) => {
  const { products, page, limit, total } = await require('../services/productService').getProducts({
    ...req.query,
    creatorId: req.user.id,
    status: req.query.status || { $in: ['active', 'pending', 'rejected'] }, // Show all their products unless filtered
  });

  res.status(200).json(
    successResponse({
      message: 'Creator products retrieved successfully',
      data: { products, page, limit, total },
    })
  );
});

const getCreatorStats = catchAsync(async (req, res) => {
  const user = await User.findById(req.user.id).select('creatorStats role');
  if (!user || user.role !== CONSTANTS.ROLES.CREATOR) {
    throw ApiError.forbidden('Only creators can access this');
  }

  res.status(200).json(
    successResponse({
      message: 'Creator stats retrieved successfully',
      data: { stats: user.creatorStats },
    })
  );
});

const createCreatorProduct = catchAsync(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user || user.role !== CONSTANTS.ROLES.CREATOR) {
    throw ApiError.forbidden('Only creators can create products');
  }

  const { name, series, price, description } = req.body;

  const product = await require('../models/Product').create({
    name,
    series,
    price,
    description,
    creator: req.user.id,
    status: 'draft', // Or pending as per blueprint
    assets: { status: 'pending' },
  });

  res.status(201).json(
    successResponse({
      message: 'Product draft created',
      data: { product },
    })
  );
});

module.exports = {
  applyCreator,
  getPendingCreatorRequests,
  approveCreator,
  rejectCreator,
  getCreatorProducts,
  getCreatorStats,
  createCreatorProduct,
};
