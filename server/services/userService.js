/**
 * User service — profile, password, library.
 */

const User = require('../models/User');
const License = require('../models/License');
const ApiError = require('../utils/apiError');

/**
 * @param {string} userId
 */
async function getProfile(userId) {
  const user = await User.findById(userId);
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  const library = await License.find({ user: userId, isActive: true }).populate('product');
  const profile = user.toObject();
  profile.library = library;

  return profile;
}

/**
 * @param {string} userId
 * @param {{ name?: string }} input
 */
async function updateProfile(userId, { name }) {
  const user = await User.findById(userId);
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  if (name) {
    user.name = name.trim();
    user.avatar = user.name.charAt(0).toUpperCase();
  }

  await user.save();
  return user;
}

/**
 * @param {string} userId
 * @param {{ currentPassword: string, newPassword: string }} input
 */
async function changePassword(userId, { currentPassword, newPassword }) {
  const user = await User.findById(userId).select('+password');
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  const isPasswordValid = await user.comparePassword(currentPassword);
  if (!isPasswordValid) {
    throw ApiError.badRequest('Current password is incorrect');
  }

  user.password = newPassword;
  user.passwordChangedAt = new Date();
  await user.save();
}

/**
 * @param {string} userId
 * @returns {Promise<Array>}
 */
async function getLibrary(userId) {
  const user = await User.findById(userId).select('_id');

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  return await License.find({ user: userId, isActive: true }).populate('product');
}

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  getLibrary,
};
