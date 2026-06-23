/**
 * User Model
 * 
 * Defines the schema for user accounts including authentication,
 * profile information, gamification features (points, streaks),
 * and library of purchased wallpapers.
 */

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const creatorRequestSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['none', 'pending', 'approved', 'rejected'],
      default: 'none',
    },
    displayName: {
      type: String,
      trim: true,
    },
    portfolioLink: {
      type: String,
      trim: true,
    },
    paymentEmail: {
      type: String,
      trim: true,
    },
    requestedAt: Date,
    reviewedAt: Date,
  },
  { _id: false }
);

const creatorStatsSchema = new mongoose.Schema(
  {
    uploadsThisMonth: {
      type: Number,
      default: 0,
    },
    salesCount: {
      type: Number,
      default: 0,
    },
    creatorLevel: {
      type: String,
      enum: ['new', 'growing', 'pro'],
      default: 'new',
    },
    uploadLimit: {
      type: Number,
      default: 5,
    },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please enter a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false, // Never return password in queries by default
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      select: false,
    },
    emailVerificationExpires: {
      type: Date,
      select: false,
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
    passwordChangedAt: {
      type: Date,
      default: null,
    },
    loginAttempts: {
      type: Number,
      default: 0,
      min: 0,
    },
    lockUntil: {
      type: Date,
      default: null,
    },
    avatar: {
      type: String,
      default: function () {
        // Default avatar is the first letter of name in uppercase
        return this.name ? this.name.charAt(0).toUpperCase() : 'U';
      },
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'creator'],
      default: 'user',
    },
    creatorRequest: {
      type: creatorRequestSchema,
      default: () => ({}),
    },
    creatorStats: {
      type: creatorStatsSchema,
      default: () => ({}),
    },
    points: {
      type: Number,
      default: 150,
      min: 0,
    },
    streakDays: {
      type: Number,
      default: 1,
      min: 0,
    },
    purchasesCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    library: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
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
        delete ret.password; // Ensure password is never returned
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.password;
        return ret;
      },
    },
  }
);

/**
 * Pre-save middleware to hash password before saving
 */
userSchema.pre('save', async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    // Hash password with bcrypt
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Instance method to compare password
 * @param {string} candidatePassword - The password to compare
 * @returns {Promise<boolean>} - True if passwords match
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

/**
 * Instance method to update avatar based on name
 */
userSchema.methods.updateAvatar = function () {
  this.avatar = this.name ? this.name.charAt(0).toUpperCase() : 'U';
};

const User = mongoose.model('User', userSchema);

module.exports = User;
