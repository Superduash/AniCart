/**
 * User Controller
 *
 * HTTP handlers for user profile. Business logic lives in userService.
 */

const { successResponse } = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');
const userService = require('../services/userService');

/**
 * @desc    Get user profile
 * @route   GET /api/users/profile
 * @access  Private
 */
const getProfile = catchAsync(async (req, res) => {
  const user = await userService.getProfile(req.user.id);

  res.status(200).json(
    successResponse({
      message: 'Profile retrieved successfully',
      data: { user },
    })
  );
});

/**
 * @desc    Update user profile
 * @route   PUT /api/users/profile
 * @access  Private
 */
const updateProfile = catchAsync(async (req, res) => {
  const { name } = req.body;

  const user = await userService.updateProfile(req.user.id, { name });

  res.status(200).json(
    successResponse({
      message: 'Profile updated successfully',
      data: { user },
    })
  );
});

/**
 * @desc    Change user password
 * @route   PUT /api/users/password
 * @access  Private
 */
const changePassword = catchAsync(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  await userService.changePassword(req.user.id, {
    currentPassword,
    newPassword,
  });

  res.status(200).json(
    successResponse({
      message: 'Password changed successfully',
    })
  );
});

/**
 * @desc    Get user's library (purchased wallpapers)
 * @route   GET /api/users/library
 * @access  Private
 */
const getLibrary = catchAsync(async (req, res) => {
  const library = await userService.getLibrary(req.user.id);

  res.status(200).json(
    successResponse({
      message: 'Library retrieved successfully',
      data: { library },
    })
  );
});

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  getLibrary,
};
