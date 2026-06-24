/**
 * Product Model
 * 
 * Defines the schema for anime wallpaper products including
 * metadata like series, pricing, badges, ratings, and tags.
 */

const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [100, 'Product name cannot exceed 100 characters'],
    },
    series: {
      type: String,
      required: [true, 'Series is required'],
      trim: true,
      index: true,
    },
    anime: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    badge: {
      type: String,
      trim: true,
      enum: ['HOT', 'NEW', 'BESTSELLER', 'CLASSIC', 'PREMIUM', ''],
      default: '',
    },
    badgeType: {
      type: String,
      enum: ['neon', 'pink', ''],
      default: '',
    },
    rating: {
      type: Number,
      default: 0,
      min: [0, 'Rating cannot be less than 0'],
      max: [5, 'Rating cannot exceed 5'],
    },
    reviews: {
      type: Number,
      default: 0,
      min: [0, 'Reviews count cannot be negative'],
    },
    img: {
      type: String,
      required: [true, 'Product image URL is required'],
      trim: true,
    },
    resolution: {
      type: String,
      trim: true,
      default: '4K Ultra HD',
    },
    availableResolutions: [
      {
        type: String,
        enum: ['4k', '2k', '1080p'],
      },
    ],
    assets: {
      original: {
        key: {
          type: String,
          trim: true,
        },
        contentType: {
          type: String,
          trim: true,
        },
        size: {
          type: Number,
          min: 0,
        },
      },
      '4k': {
        key: {
          type: String,
          trim: true,
        },
        contentType: {
          type: String,
          trim: true,
        },
        size: {
          type: Number,
          min: 0,
        },
      },
      '2k': {
        key: {
          type: String,
          trim: true,
        },
        contentType: {
          type: String,
          trim: true,
        },
        size: {
          type: Number,
          min: 0,
        },
      },
      '1080p': {
        key: {
          type: String,
          trim: true,
        },
        contentType: {
          type: String,
          trim: true,
        },
        size: {
          type: Number,
          min: 0,
        },
      },
      preview: {
        key: {
          type: String,
          trim: true,
        },
        url: {
          type: String,
          trim: true,
        },
        contentType: {
          type: String,
          trim: true,
        },
        size: {
          type: Number,
          min: 0,
        },
      },
      thumbnail: {
        key: {
          type: String,
          trim: true,
        },
        url: {
          type: String,
          trim: true,
        },
        contentType: {
          type: String,
          trim: true,
        },
        size: {
          type: Number,
          min: 0,
        },
      },
      status: {
        type: String,
        enum: ['pending', 'processing', 'ready', 'failed'],
        default: 'pending',
      },
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    status: {
      type: String,
      trim: true,
      enum: ['pending', 'active', 'rejected', 'removed'],
      default: 'active',
    },
    rightsConfirmed: {
      type: Boolean,
      required: true,
    },
    termsAcceptedAt: {
      type: Date,
      required: true,
    },
    licenseType: {
      type: String,
      enum: ['original', 'ai_generated', 'licensed', 'fan_art_with_permission'],
      required: true,
    },
    authorName: {
      type: String,
      trim: true,
    },
    sourceLink: {
      type: String,
      trim: true,
    },
    copyrightOwner: {
      type: String,
      trim: true,
    },
    fileHash: {
      type: String,
      trim: true,
      index: true,
      unique: true,
      sparse: true,
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

// Index frequently queried fields
productSchema.index({ status: 1 });
productSchema.index({ anime: 1 });
productSchema.index({ tags: 1 });
productSchema.index({ price: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ creatorId: 1, status: 1, createdAt: -1 });
productSchema.index({ status: 1, series: 1, price: 1 });

/**
 * Static method to get distinct series for filtering
 * @returns {Promise<Array>} - Array of unique series names
 */
productSchema.statics.getDistinctSeries = async function () {
  return await this.distinct('series', { status: 'active' });
};

/**
 * Instance method to soft delete product
 */
productSchema.methods.softDelete = async function () {
  this.status = 'removed';
  return await this.save();
};

/**
 * Instance method to restore soft deleted product
 */
productSchema.methods.restore = async function () {
  this.status = 'active';
  return await this.save();
};

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
