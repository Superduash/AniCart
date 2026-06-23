/**
 * Order Model
 * 
 * Defines the schema for user orders including order items,
 * pricing breakdown (subtotal, tax, total), and order status.
 */

const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product reference is required'],
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],
    },
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [0, 'Price cannot be negative'],
    },
    qty: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    img: {
      type: String,
      required: [true, 'Product image URL is required'],
    },
  },
  {
    _id: false, // Don't create separate _id for subdocuments
  }
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },
    items: [orderItemSchema],
    subtotal: {
      type: Number,
      required: [true, 'Subtotal is required'],
      min: [0, 'Subtotal cannot be negative'],
    },
    tax: {
      type: Number,
      required: [true, 'Tax is required'],
      min: [0, 'Tax cannot be negative'],
      default: 0,
    },
    total: {
      type: Number,
      required: [true, 'Total is required'],
      min: [0, 'Total cannot be negative'],
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'cancelled'],
      default: 'pending',
    },
    stripePaymentIntentId: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    // Transform output to map _id to id and remove __v
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

// Index for faster user order lookups
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ user: 1 });
orderSchema.index({ stripePaymentIntentId: 1 }, { sparse: true });
orderSchema.index({ status: 1 });

/**
 * Static method to calculate tax rate
 * @returns {number} - Tax rate as decimal (e.g., 0.08 for 8%)
 */
orderSchema.statics.getTaxRate = function () {
  // Default tax rate of 8%
  return 0.08;
};

/**
 * Static method to create order from cart
 * @param {string} userId - The user ID
 * @param {Array} cartItems - Array of cart items with populated products
 * @returns {Promise<Document>} - The created order
 */
orderSchema.statics.createFromCart = async function (userId, cartItems) {
  const taxRate = this.getTaxRate();
  
  // Map cart items to order items
  const orderItems = cartItems.map((item) => ({
    product: item.product._id,
    name: item.product.name,
    price: item.product.price,
    qty: item.qty ?? 1,
    img: item.product.img,
  }));

  // Calculate totals
  const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.qty, 0);
  const tax = parseFloat((subtotal * taxRate).toFixed(2));
  const total = parseFloat((subtotal + tax).toFixed(2));

  // Create order
  const order = await this.create({
    user: userId,
    items: orderItems,
    subtotal,
    tax,
    total,
    status: 'completed', // Auto-complete for digital products
  });

  return order;
};

/**
 * Instance method to update order status
 * @param {string} newStatus - The new status
 * @returns {Promise<Document>} - The updated order
 */
orderSchema.methods.updateStatus = async function (newStatus) {
  this.status = newStatus;
  return await this.save();
};

/**
 * Instance method to cancel order
 * @returns {Promise<Document>} - The cancelled order
 */
orderSchema.methods.cancel = async function () {
  if (this.status === 'completed') {
    throw new Error('Cannot cancel a completed order');
  }
  this.status = 'cancelled';
  return await this.save();
};

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
