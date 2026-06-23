/**
 * License Model
 *
 * Represents ownership/access rights for a user to a purchased product.
 */

const mongoose = require('mongoose');

const licenseSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product reference is required'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    downloadCount: {
      type: Number,
      default: 0,
      min: [0, 'Download count cannot be negative'],
    },
    maxDownloads: {
      type: Number,
      default: 10,
      min: [1, 'Max downloads must be at least 1'],
    },
  },
  {
    timestamps: true,
  }
);

// Enforce one license per (user, product) pair.
licenseSchema.index({ user: 1, product: 1 }, { unique: true });

const License = mongoose.model('License', licenseSchema);

module.exports = License;
