/**
 * Cart Controller
 *
 * HTTP handlers for cart operations. Business logic lives in cartService.
 */

const { successResponse } = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');
const cartService = require('../services/cartService');

/**
 * @desc    Get user's cart with populated product details
 * @route   GET /api/cart
 * @access  Private
 */
const getCart = catchAsync(async (req, res) => {
  const { cart, summary } = await cartService.getCart(req.user.id);

  res.status(200).json(
    successResponse({
      message: 'Cart retrieved successfully',
      data: {
        cart,
        summary,
      },
    })
  );
});

/**
 * @desc    Add product to cart
 * @route   POST /api/cart/add
 * @access  Private
 */
const addToCart = catchAsync(async (req, res) => {
  const { productId } = req.body;

  const { cart, summary } = await cartService.addToCart(req.user.id, productId);

  res.status(200).json(
    successResponse({
      message: 'Item added to cart',
      data: {
        cart,
        summary,
      },
    })
  );
});

/**
 * @desc    Update item quantity in cart
 * @route   PUT /api/cart/update
 * @access  Private
 */
const updateCartItem = catchAsync(async (req, res) => {
  const { productId } = req.body;

  const { cart, summary } = await cartService.updateCartItem(
    req.user.id,
    productId
  );

  res.status(200).json(
    successResponse({
      message: 'Cart updated successfully',
      data: {
        cart,
        summary,
      },
    })
  );
});

/**
 * @desc    Remove item from cart
 * @route   DELETE /api/cart/remove/:productId
 * @access  Private
 */
const removeFromCart = catchAsync(async (req, res) => {
  const { productId } = req.params;

  const { cart, summary } = await cartService.removeFromCart(
    req.user.id,
    productId
  );

  res.status(200).json(
    successResponse({
      message: 'Item removed from cart',
      data: {
        cart,
        summary,
      },
    })
  );
});

/**
 * @desc    Clear entire cart
 * @route   DELETE /api/cart/clear
 * @access  Private
 */
const clearCart = catchAsync(async (req, res) => {
  const { cart } = await cartService.clearCart(req.user.id);

  res.status(200).json(
    successResponse({
      message: 'Cart cleared successfully',
      data: {
        cart,
      },
    })
  );
});

/**
 * @desc    Sync cart with client-side cart (for initial load)
 * @route   POST /api/cart/sync
 * @access  Private
 */
const syncCart = catchAsync(async (req, res) => {
  const { items } = req.body;

  const { cart, summary } = await cartService.syncCart(req.user.id, items);

  res.status(200).json(
    successResponse({
      message: 'Cart synced successfully',
      data: {
        cart,
        summary,
      },
    })
  );
});

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  syncCart,
};
