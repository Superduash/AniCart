/**
 * Auth Controller
 *
 * HTTP handlers for authentication. Business logic lives in authService.
 */

const { successResponse } = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');
const config = require('../config');
const CONSTANTS = require('../utils/constants');
const authService = require('../services/authService');
const { verifyAccessToken } = require('../utils/generateToken');
const { blacklistToken } = require('../services/tokenBlacklistService');

const refreshCookieOptions = {
  httpOnly: true,
  secure: config.isProduction,
  sameSite: 'strict',
  maxAge: CONSTANTS.COOKIE.MAX_AGE_MS,
};

const clearCookieOptions = {
  httpOnly: true,
  secure: config.isProduction,
  sameSite: 'strict',
  expires: new Date(0),
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = catchAsync(async (req, res) => {
  const { name, email, password } = req.body;

  const { user } = await authService.register({
    name,
    email,
    password,
  });

  res.status(201).json(
    successResponse({
      message: 'Registration successful. Please check your email to verify your account.',
      data: { user },
    })
  );
});

/**
 * @desc    Verify email via token
 * @route   GET /api/auth/verify-email/:token
 * @access  Public
 */
const verifyEmail = catchAsync(async (req, res) => {
  await authService.verifyEmail(req.params.token);

  res.status(200).json(
    successResponse({
      message: 'Email verified successfully. You can now login.',
    })
  );
});

/**
 * @desc    Resend account verification email
 * @route   POST /api/auth/resend-verification
 * @access  Public
 */
const resendVerification = catchAsync(async (req, res) => {
  const { email } = req.body;
  const result = await authService.resendVerification(email);

  if (result.reason === 'already_verified') {
    return res.status(200).json(
      successResponse({
        message: 'Email is already verified. You can login.',
      })
    );
  }

  // Keep response generic when account is missing.
  return res.status(200).json(
    successResponse({
      message: 'If an account with that email exists, a verification link has been sent.',
    })
  );
});

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  const { user, accessToken, refreshToken } = await authService.login({
    email,
    password,
  });

  res.cookie(CONSTANTS.COOKIE.REFRESH_TOKEN_NAME, refreshToken, refreshCookieOptions);

  res.status(200).json(
    successResponse({
      message: 'Login successful',
      data: {
        user,
        accessToken,
      },
    })
  );
});

/**
 * @desc    Logout user / clear refresh token cookie
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = catchAsync(async (req, res) => {
  const authorizationHeader = req.headers.authorization || '';
  const token = authorizationHeader.startsWith('Bearer ')
    ? authorizationHeader.split(' ')[1]
    : null;

  if (token) {
    const decoded = verifyAccessToken(token);

    if (decoded.jti && decoded.exp) {
      const nowInSeconds = Math.floor(Date.now() / 1000);
      const remainingTtl = decoded.exp - nowInSeconds;

      if (remainingTtl > 0) {
        await blacklistToken(decoded.jti, remainingTtl);
      }
    }
  }

  res.cookie(CONSTANTS.COOKIE.REFRESH_TOKEN_NAME, '', clearCookieOptions);

  res.status(200).json(
    successResponse({
      message: 'Logout successful',
    })
  );
});

/**
 * @desc    Get current logged-in user
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = catchAsync(async (req, res) => {
  const user = await authService.getMe(req.user.id);

  res.status(200).json(
    successResponse({
      message: 'User retrieved successfully',
      data: { user },
    })
  );
});

/**
 * @desc    Refresh access token using refresh token
 * @route   POST /api/auth/refresh
 * @access  Public (requires valid refresh token cookie)
 */
const refreshToken = catchAsync(async (req, res) => {
  const token = req.cookies[CONSTANTS.COOKIE.REFRESH_TOKEN_NAME];

  try {
    const tokens = await authService.refreshToken(token);

    res.cookie(CONSTANTS.COOKIE.REFRESH_TOKEN_NAME, tokens.refreshToken, refreshCookieOptions);

    res.status(200).json(
      successResponse({
        message: 'Token refreshed successfully',
        data: {
          accessToken: tokens.accessToken,
        },
      })
    );
  } catch (err) {
    if (token) {
      res.cookie(CONSTANTS.COOKIE.REFRESH_TOKEN_NAME, '', clearCookieOptions);
    }
    throw err;
  }
});

/**
 * @desc    Request password reset link
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
const forgotPassword = catchAsync(async (req, res) => {
  const { email } = req.body;
  await authService.forgotPassword(email);

  res.status(200).json(
    successResponse({
      message: 'If an account with that email exists, a reset link has been sent.',
    })
  );
});

/**
 * @desc    Reset password with token
 * @route   POST /api/auth/reset-password/:token
 * @access  Public
 */
const resetPassword = catchAsync(async (req, res) => {
  await authService.resetPassword(req.params.token, req.body.password);

  res.status(200).json(
    successResponse({
      message: 'Password reset successful.',
    })
  );
});

module.exports = {
  register,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  login,
  logout,
  getMe,
  refreshToken,
};
