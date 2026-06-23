/**
 * Cart service — business logic for shopping carts.
 */

const Cart = require('../models/Cart');
const Product = require('../models/Product');
const ApiError = require('../utils/apiError');

const POPULATE_PRODUCT = {
  path: 'items.product',
  select: '-__v',
};

function buildSummary(cart) {
  const itemCount = cart.items.length;
  const totalPrice = cart.items.reduce((total, item) => {
    const price = item.product?.price || 0;
    return total + price;
  }, 0);
  return {
    itemCount,
    totalPrice: parseFloat(totalPrice.toFixed(2)),
  };
}

async function getPopulatedCartById(cartId) {
  return Cart.findById(cartId).populate(POPULATE_PRODUCT);
}

async function getCart(userId) {
  let cart = await Cart.findOne({ user: userId }).populate(POPULATE_PRODUCT);
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
    cart = await getPopulatedCartById(cart._id);
  }
  return { cart, summary: buildSummary(cart) };
}

async function addToCart(userId, productId) {
  const product = await Product.findOne({ _id: productId, status: 'active' });
  if (!product) {
    throw ApiError.notFound('Product not found');
  }

  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }

  await cart.addItem(productId);

  const updatedCart = await getPopulatedCartById(cart._id);
  return { cart: updatedCart, summary: buildSummary(updatedCart) };
}

/** PUT /api/cart/update — ensures product is in cart (unique items; quantity not stored). */
async function updateCartItem(userId, productId) {
  return addToCart(userId, productId);
}

async function removeFromCart(userId, productId) {
  const cart = await Cart.findOne({ user: userId });
  if (!cart) {
    throw ApiError.notFound('Cart not found');
  }

  await cart.removeItem(productId);

  const updatedCart = await getPopulatedCartById(cart._id);
  return { cart: updatedCart, summary: buildSummary(updatedCart) };
}

async function clearCart(userId) {
  const cart = await Cart.findOne({ user: userId });
  if (cart) {
    await cart.clearCart();
  }
  return {
    cart: {
      items: [],
      itemCount: 0,
      totalPrice: 0,
    },
  };
}

async function syncCart(userId, items) {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }

  if (items && Array.isArray(items) && items.length > 0) {
    const uniqueIds = [
      ...new Set(
        items.map((item) => item.productId).filter(Boolean)
      ),
    ];

    const validProducts = await Product.find({
      _id: { $in: uniqueIds },
      status: 'active',
    }).select('_id');

    const validSet = new Set(validProducts.map((p) => p._id.toString()));

    cart.items = [];
    for (const id of uniqueIds) {
      if (validSet.has(id.toString())) {
        cart.items.push({ product: id });
      }
    }

    await cart.save();
  }

  const updatedCart = await getPopulatedCartById(cart._id);
  return { cart: updatedCart, summary: buildSummary(updatedCart) };
}

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  syncCart,
};
