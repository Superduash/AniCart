/**
 * Cart Model
 *
 * Defines the schema for user shopping carts stored in the database.
 * Each user has one cart with multiple items referencing products (unique per product).
 */

const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product reference is required'],
    },
  },
  {
    _id: false,
  }
);

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      unique: true,
      index: true,
    },
    items: [cartItemSchema],
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

cartSchema.pre('save', function (next) {
  const seen = new Set();
  this.items = this.items.filter((item) => {
    const id = item.product.toString();
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
  next();
});

/**
 * Virtual: number of distinct line items (one per product)
 */
cartSchema.virtual('itemCount').get(function () {
  return this.items.length;
});

/**
 * Virtual: sum of product prices (requires populated product data)
 */
cartSchema.virtual('totalPrice').get(function () {
  return this.items.reduce((total, item) => {
    const price = item.product?.price || 0;
    return total + price;
  }, 0);
});

/**
 * Static method to find or create cart for a user
 * @param {string} userId - The user ID
 * @returns {Promise<Document>} - The cart document
 */
cartSchema.statics.findOrCreate = async function (userId) {
  let cart = await this.findOne({ user: userId });
  if (!cart) {
    cart = await this.create({ user: userId, items: [] });
  }
  return cart;
};

/**
 * Instance method to add item to cart (only if product not already present)
 * @param {string} productId - The product ID to add
 * @returns {Promise<Document>} - The updated cart
 */
cartSchema.methods.addItem = async function (productId) {
  const exists = this.items.some(
    (item) => item.product.toString() === productId.toString()
  );
  if (!exists) {
    this.items.push({ product: productId });
  }
  return await this.save();
};

/**
 * Instance method to remove item from cart
 * @param {string} productId - The product ID to remove
 * @returns {Promise<Document>} - The updated cart
 */
cartSchema.methods.removeItem = async function (productId) {
  this.items = this.items.filter(
    (item) => item.product.toString() !== productId.toString()
  );
  return await this.save();
};

/**
 * Instance method to clear cart
 * @returns {Promise<Document>} - The cleared cart
 */
cartSchema.methods.clearCart = async function () {
  this.items = [];
  return await this.save();
};

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;
