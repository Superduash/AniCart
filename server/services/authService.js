/**
 * Auth service — registration, login, token refresh, verification, and password reset.
 */

const User = require('../models/User');
const ApiError = require('../utils/apiError');
const { generateTokens, verifyRefreshToken } = require('../utils/generateToken');
const { createSecureToken, hashToken } = require('../utils/secureToken');
const {
  sendVerificationEmail,
  sendPasswordResetEmail,
} = require('../services/emailService');
const {
  isLoginLocked,
  recordFailedLogin,
  clearLoginProtection,
} = require('../services/loginProtectionService');

const EMAIL_VERIFICATION_EXPIRES_MS = 24 * 60 * 60 * 1000;
const PASSWORD_RESET_EXPIRES_MS = 15 * 60 * 1000;

const normalizeEmail = (email) => String(email).trim().toLowerCase();

async function register({ name, email, password }) {
  const normalizedEmail = normalizeEmail(email);
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw ApiError.conflict('Email already registered');
  }

  const user = await User.create({
    name: String(name).trim(),
    email: normalizedEmail,
    password,
  });

  const verificationTokenData = createSecureToken(EMAIL_VERIFICATION_EXPIRES_MS);
  user.emailVerificationToken = verificationTokenData.hashedToken;
  user.emailVerificationExpires = verificationTokenData.expiresAt;
  await user.save({ validateBeforeSave: false });

  await sendVerificationEmail(user, verificationTokenData.rawToken);

  const userResponse = await User.findById(user._id);
  return { user: userResponse };
}

async function verifyEmail(token) {
  const hashedToken = hashToken(token);

  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: new Date() },
  }).select('+emailVerificationToken +emailVerificationExpires');

  if (!user) {
    throw ApiError.badRequest(
      'Verification link is invalid or expired. Please request a new verification email.'
    );
  }

  user.isVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save({ validateBeforeSave: false });

  return user;
}

async function resendVerification(email) {
  const normalizedEmail = normalizeEmail(email);
  const user = await User.findOne({ email: normalizedEmail }).select(
    '+emailVerificationToken +emailVerificationExpires'
  );

  if (!user) {
    return { sent: false, reason: 'not_found' };
  }

  if (user.isVerified) {
    return { sent: false, reason: 'already_verified' };
  }

  const verificationTokenData = createSecureToken(EMAIL_VERIFICATION_EXPIRES_MS);
  user.emailVerificationToken = verificationTokenData.hashedToken;
  user.emailVerificationExpires = verificationTokenData.expiresAt;
  await user.save({ validateBeforeSave: false });

  await sendVerificationEmail(user, verificationTokenData.rawToken);
  return { sent: true };
}

async function forgotPassword(email) {
  const normalizedEmail = normalizeEmail(email);
  const user = await User.findOne({ email: normalizedEmail }).select(
    '+passwordResetToken +passwordResetExpires'
  );

  if (!user) {
    // Do not leak account existence.
    return;
  }

  const resetTokenData = createSecureToken(PASSWORD_RESET_EXPIRES_MS);
  user.passwordResetToken = resetTokenData.hashedToken;
  user.passwordResetExpires = resetTokenData.expiresAt;
  await user.save({ validateBeforeSave: false });

  await sendPasswordResetEmail(user, resetTokenData.rawToken);
}

async function resetPassword(token, newPassword) {
  const hashedToken = hashToken(token);

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: new Date() },
  }).select('+passwordResetToken +passwordResetExpires +password');

  if (!user) {
    throw ApiError.badRequest(
      'Reset link is invalid or expired. Please request a new password reset link.'
    );
  }

  user.password = newPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  await clearLoginProtection(user.email);

  return user;
}

async function login({ email, password }) {
  const normalizedEmail = normalizeEmail(email);
  const user = await User.findOne({ email: normalizedEmail }).select('+password');

  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  if (await isLoginLocked(normalizedEmail)) {
    throw new ApiError(429, 'Too many login attempts. Try again in 10 minutes.');
  }

  if (!user.isVerified) {
    throw ApiError.forbidden('Please verify your email before logging in.');
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    const { locked } = await recordFailedLogin(normalizedEmail);
    if (locked) {
      throw new ApiError(429, 'Too many login attempts. Try again in 10 minutes.');
    }

    throw ApiError.unauthorized('Invalid email or password');
  }

  await clearLoginProtection(normalizedEmail);

  const { accessToken, refreshToken } = generateTokens(user);
  const userResponse = await User.findById(user._id);

  return { user: userResponse, accessToken, refreshToken };
}

async function refreshToken(refreshTokenString) {
  if (!refreshTokenString) {
    throw ApiError.unauthorized('Refresh token not found');
  }

  try {
    const decoded = verifyRefreshToken(refreshTokenString);
    const user = await User.findById(decoded.id);
    if (!user) {
      throw new Error('User not found');
    }
    const tokens = generateTokens(user);
    return { user, ...tokens };
  } catch {
    throw ApiError.unauthorized('Invalid refresh token');
  }
}

async function getMe(userId) {
  const user = await User.findById(userId);
  if (!user) {
    throw ApiError.notFound('User not found');
  }
  return user;
}

module.exports = {
  register,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  login,
  refreshToken,
  getMe,
};
