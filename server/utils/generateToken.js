/**
 * Token Generation Utility
 * 
 * Handles JWT access and refresh token generation using jsonwebtoken.
 * Uses configuration from environment variables for secrets and expiry.
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../config');

/**
 * Generate JWT access token
 * @param {Object} payload - Token payload containing user info
 * @param {string} payload.id - User ID
 * @param {string} payload.email - User email
 * @param {string} payload.role - User role
 * @param {string} payload.jti - Unique JWT ID
 * @returns {string} - Signed JWT access token
 */
const generateAccessToken = (payload) => {
  return jwt.sign(
    {
      id: payload.id,
      email: payload.email,
      role: payload.role,
      jti: payload.jti,
    },
    config.JWT_ACCESS_SECRET,
    {
      expiresIn: config.JWT_ACCESS_EXPIRY,
    }
  );
};

/**
 * Generate JWT refresh token
 * @param {Object} payload - Token payload containing user info
 * @param {string} payload.id - User ID
 * @returns {string} - Signed JWT refresh token
 */
const generateRefreshToken = (payload) => {
  return jwt.sign(
    {
      id: payload.id,
    },
    config.JWT_REFRESH_SECRET,
    {
      expiresIn: config.JWT_REFRESH_EXPIRY,
    }
  );
};

/**
 * Verify JWT access token
 * @param {string} token - The token to verify
 * @returns {Object} - Decoded token payload
 * @throws {Error} - If token is invalid or expired
 */
const verifyAccessToken = (token) => {
  return jwt.verify(token, config.JWT_ACCESS_SECRET);
};

/**
 * Verify JWT refresh token
 * @param {string} token - The token to verify
 * @returns {Object} - Decoded token payload
 * @throws {Error} - If token is invalid or expired
 */
const verifyRefreshToken = (token) => {
  return jwt.verify(token, config.JWT_REFRESH_SECRET);
};

/**
 * Generate both access and refresh tokens
 * @param {Object} user - User object
 * @param {string} user._id - User ID
 * @param {string} user.email - User email
 * @param {string} user.role - User role
 * @returns {Object} - Object containing both tokens
 */
const generateTokens = (user) => {
  const generatedTokenId = crypto.randomUUID();

  const payload = {
    id: user._id.toString(),
    email: user.email,
    role: user.role,
    jti: generatedTokenId,
  };

  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken({ id: payload.id }),
  };
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateTokens,
};
