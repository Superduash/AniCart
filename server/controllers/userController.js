/**
 * User Controller
 *
 * HTTP handlers for user profile. Business logic lives in userService.
 */

const { successResponse } = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');
const userService = require('../services/userService');
const License = require('../models/License'); // H8 Fix: needed for ownership check

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

const getWishlist = catchAsync(async (req, res) => {
  const wishlist = await userService.getWishlist(req.user.id);
  res.status(200).json(
    successResponse({
      message: 'Wishlist retrieved successfully',
      data: { wishlist },
    })
  );
});

const addToWishlist = catchAsync(async (req, res) => {
  const wishlist = await userService.addToWishlist(req.user.id, req.params.productId);
  res.status(200).json(
    successResponse({
      message: 'Added to wishlist',
      data: { wishlist },
    })
  );
});

const removeFromWishlist = catchAsync(async (req, res) => {
  const wishlist = await userService.removeFromWishlist(req.user.id, req.params.productId);
  res.status(200).json(
    successResponse({
      message: 'Removed from wishlist',
      data: { wishlist },
    })
  );
});

/**
 * @desc    H8 Fix: Check if user owns a specific product (single License.exists() query, not full library)
 * @route   GET /api/users/library/:productId
 * @access  Private
 */
const checkProductOwnership = catchAsync(async (req, res) => {
  const owned = await License.exists({
    user: req.user.id,
    product: req.params.productId,
    isActive: true,
  });
  res.status(200).json(successResponse({ data: { owned: !!owned } }));
});

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  getLibrary,
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  checkProductOwnership,
};
