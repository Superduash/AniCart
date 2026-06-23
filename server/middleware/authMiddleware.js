/**
 * Authentication Middleware
 * 
 * Verifies JWT tokens from Authorization header and attaches user info to request.
 * Also provides role-based access control for admin routes.
 */

const { verifyAccessToken } = require('../utils/generateToken');
const ApiError = require('../utils/apiError');
const User = require('../models/User');
const CONSTANTS = require('../utils/constants');
const { isBlacklisted } = require('../services/tokenBlacklistService');

/**
 * Middleware to verify JWT access token
 * Attaches req.user with { id, email, role } if token is valid
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      // Extract token from "Bearer <token>"
      token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
      return next(ApiError.unauthorized('Access denied. No token provided.'));
    }

    try {
      // Verify token
      const decoded = verifyAccessToken(token);

      if (!decoded.jti) {
        return next(ApiError.unauthorized('Invalid token payload. Missing jti.'));
      }

      const blacklisted = await isBlacklisted(decoded.jti);
      if (blacklisted) {
        return next(ApiError.unauthorized('Token has been revoked. Please login again.'));
      }

      // Verify user still exists
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return next(ApiError.unauthorized('User not found. Token is invalid.'));
      }

      if (user.passwordChangedAt && decoded.iat) {
        const tokenIssuedAtMs = decoded.iat * 1000;
        if (new Date(user.passwordChangedAt).getTime() > tokenIssuedAtMs) {
          return next(ApiError.unauthorized('Password changed recently. Please login again.'));
        }
      }

      // Attach user info to request object
      req.user = {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        jti: decoded.jti,
      };

      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return next(ApiError.unauthorized('Token has expired. Please login again.'));
      }
      if (error.name === 'JsonWebTokenError') {
        return next(ApiError.unauthorized('Invalid token.'));
      }
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to restrict access to admin users only
 * Must be used after protect middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const adminOnly = (req, res, next) => {
  // Check if user exists (protect middleware should run first)
  if (!req.user) {
    return next(ApiError.unauthorized('Authentication required'));
  }

  // Check if user has admin role
  if (req.user.role !== CONSTANTS.ROLES.ADMIN) {
    return next(ApiError.forbidden('Admin access required'));
  }

  next();
};

/**
 * Middleware to restrict access to admin and creator users
 * Must be used after protect middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const adminOrCreator = (req, res, next) => {
  if (!req.user) {
    return next(ApiError.unauthorized('Authentication required'));
  }

  if (
    req.user.role !== CONSTANTS.ROLES.ADMIN &&
    req.user.role !== CONSTANTS.ROLES.CREATOR
  ) {
    return next(ApiError.forbidden('Admin or creator access required'));
  }

  next();
};

/**
 * Middleware to allow access to either the user themselves or an admin
 * For routes where users can access their own resources
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const ownerOrAdmin = (req, res, next) => {
  // Check if user exists (protect middleware should run first)
  if (!req.user) {
    return next(ApiError.unauthorized('Authentication required'));
  }

  // Allow if admin or if user is accessing their own resource
  const resourceUserId = req.params.userId || req.body.userId;
  
  if (req.user.role === CONSTANTS.ROLES.ADMIN || req.user.id === resourceUserId) {
    return next();
  }

  next(ApiError.forbidden('You can only access your own resources'));
};

module.exports = {
  protect,
  adminOnly,
  adminOrCreator,
  ownerOrAdmin,
};
