/**
 * Creator upload limit middleware.
 * Blocks creator uploads when monthly quota is reached.
 */

const User = require('../models/User');
const ApiError = require('../utils/apiError');
const CONSTANTS = require('../utils/constants');

const resolveCreatorLevel = (salesCount = 0) => {
  if (salesCount >= 50) {
    return { creatorLevel: 'pro', uploadLimit: 1000 };
  }

  if (salesCount >= 10) {
    return { creatorLevel: 'growing', uploadLimit: 20 };
  }

  return { creatorLevel: 'new', uploadLimit: 5 };
};

const checkUploadLimit = async (req, res, next) => {
  try {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    if (req.user.role === CONSTANTS.ROLES.ADMIN) {
      return next();
    }

    if (req.user.role !== CONSTANTS.ROLES.CREATOR) {
      return next();
    }

    const user = await User.findById(req.user.id).select('creatorStats role');
    if (!user) {
      return next(ApiError.notFound('User not found'));
    }

    if (!user.creatorStats) {
      user.creatorStats = {};
    }

    const stats = user.creatorStats || {};
    const salesCount = Number(stats.salesCount || 0);
    const uploadsThisMonth = Number(stats.uploadsThisMonth || 0);

    const { creatorLevel, uploadLimit } = resolveCreatorLevel(salesCount);

    let changed = false;
    if (user.creatorStats.creatorLevel !== creatorLevel) {
      user.creatorStats.creatorLevel = creatorLevel;
      changed = true;
    }
    if (user.creatorStats.uploadLimit !== uploadLimit) {
      user.creatorStats.uploadLimit = uploadLimit;
      changed = true;
    }

    if (changed) {
      await user.save();
    }

    if (uploadsThisMonth >= uploadLimit) {
      return next(ApiError.badRequest('Monthly upload limit reached.'));
    }

    return next();
  } catch (error) {
    return next(error);
  }
};

module.exports = checkUploadLimit;
