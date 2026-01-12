const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const { supabaseAdmin } = require('../config/supabase');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');
const emailService = require('../services/emailService');
const logger = require('../utils/logger');

/**
 * Generate JWT token
 */
const generateToken = (userId) => {
  return jwt.sign({ userId }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
};

/**
 * Generate random token for verification/reset
 */
const generateRandomToken = () => {
  return uuidv4() + '-' + Date.now().toString(36);
};

/**
 * @desc    Register new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
  const { email, password, name, role } = req.body;

  // Check if user exists
  const { data: existingUser } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('email', email)
    .single();

  if (existingUser) {
    throw new ApiError(409, 'User with this email already exists');
  }

  // Hash password
  const passwordHash = await argon2.hash(password);

  // Generate verification token
  const verificationToken = generateRandomToken();
  const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  // Create user
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .insert({
      email,
      password_hash: passwordHash,
      name,
      role,
      verification_token: verificationToken,
      verification_token_expires: verificationExpires.toISOString(),
    })
    .select('id, email, name, role, is_verified')
    .single();

  if (error) {
    logger.error('Failed to create user', { error });
    throw new ApiError(500, 'Failed to create user');
  }

  // Send verification email
  try {
    await emailService.sendVerificationEmail(email, name, verificationToken);
  } catch (emailError) {
    logger.error('Failed to send verification email', { email, error: emailError });
    // Continue - user is created, just email failed
  }

  logger.info('User registered', { userId: user.id, email });

  res.status(201).json({
    success: true,
    message: 'Registration successful. Please check your email to verify your account.',
    data: { user },
  });
});

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Get user with password
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('id, email, name, role, password_hash, is_verified')
    .eq('email', email)
    .single();

  if (error || !user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  // Verify password
  const isValidPassword = await argon2.verify(user.password_hash, password);
  if (!isValidPassword) {
    throw new ApiError(401, 'Invalid email or password');
  }

  // Check if verified
  if (!user.is_verified) {
    throw new ApiError(403, 'Please verify your email before logging in');
  }

  // Generate token
  const token = generateToken(user.id);

  logger.info('User logged in', { userId: user.id, email });

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        is_verified: user.is_verified,
      },
      token,
    },
  });
});

/**
 * @desc    Verify email
 * @route   POST /api/auth/verify-email
 * @access  Public
 */
const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.body;

  // Find user with valid token
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('id, email, name, role, verification_token_expires')
    .eq('verification_token', token)
    .single();

  if (error || !user) {
    throw new ApiError(400, 'Invalid or expired verification token');
  }

  // Check if token expired
  if (new Date(user.verification_token_expires) < new Date()) {
    throw new ApiError(400, 'Verification token has expired');
  }

  // Update user as verified
  const { error: updateError } = await supabaseAdmin
    .from('users')
    .update({
      is_verified: true,
      verification_token: null,
      verification_token_expires: null,
    })
    .eq('id', user.id);

  if (updateError) {
    throw new ApiError(500, 'Failed to verify email');
  }

  // Send welcome email
  try {
    await emailService.sendWelcomeEmail(user.email, user.name, user.role);
  } catch (emailError) {
    logger.error('Failed to send welcome email', { email: user.email });
  }

  logger.info('Email verified', { userId: user.id, email: user.email });

  res.json({
    success: true,
    message: 'Email verified successfully. You can now log in.',
  });
});

/**
 * @desc    Resend verification email
 * @route   POST /api/auth/resend-verification
 * @access  Public
 */
const resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;

  // Find user
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('id, email, name, is_verified')
    .eq('email', email)
    .single();

  if (error || !user) {
    // Don't reveal if user exists
    return res.json({
      success: true,
      message: 'If an account exists, a verification email has been sent.',
    });
  }

  if (user.is_verified) {
    throw new ApiError(400, 'Email is already verified');
  }

  // Generate new token
  const verificationToken = generateRandomToken();
  const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await supabaseAdmin
    .from('users')
    .update({
      verification_token: verificationToken,
      verification_token_expires: verificationExpires.toISOString(),
    })
    .eq('id', user.id);

  // Send email
  try {
    await emailService.sendVerificationEmail(user.email, user.name, verificationToken);
  } catch (emailError) {
    logger.error('Failed to resend verification email', { email });
    throw new ApiError(500, 'Failed to send verification email');
  }

  res.json({
    success: true,
    message: 'If an account exists, a verification email has been sent.',
  });
});

/**
 * @desc    Forgot password
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  // Find user
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('id, email, name')
    .eq('email', email)
    .single();

  if (error || !user) {
    // Don't reveal if user exists
    return res.json({
      success: true,
      message: 'If an account exists, a password reset email has been sent.',
    });
  }

  // Generate reset token
  const resetToken = generateRandomToken();
  const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await supabaseAdmin
    .from('users')
    .update({
      reset_password_token: resetToken,
      reset_password_expires: resetExpires.toISOString(),
    })
    .eq('id', user.id);

  // Send email
  try {
    await emailService.sendPasswordResetEmail(user.email, user.name, resetToken);
  } catch (emailError) {
    logger.error('Failed to send password reset email', { email });
    throw new ApiError(500, 'Failed to send password reset email');
  }

  logger.info('Password reset requested', { email });

  res.json({
    success: true,
    message: 'If an account exists, a password reset email has been sent.',
  });
});

/**
 * @desc    Reset password
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  // Find user with valid token
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('id, reset_password_expires')
    .eq('reset_password_token', token)
    .single();

  if (error || !user) {
    throw new ApiError(400, 'Invalid or expired reset token');
  }

  // Check if token expired
  if (new Date(user.reset_password_expires) < new Date()) {
    throw new ApiError(400, 'Reset token has expired');
  }

  // Hash new password
  const passwordHash = await argon2.hash(password);

  // Update password
  const { error: updateError } = await supabaseAdmin
    .from('users')
    .update({
      password_hash: passwordHash,
      reset_password_token: null,
      reset_password_expires: null,
    })
    .eq('id', user.id);

  if (updateError) {
    throw new ApiError(500, 'Failed to reset password');
  }

  logger.info('Password reset successful', { userId: user.id });

  res.json({
    success: true,
    message: 'Password reset successful. You can now log in with your new password.',
  });
});

/**
 * @desc    Get current user
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: { user: req.user },
  });
});

/**
 * @desc    Change password
 * @route   PUT /api/auth/change-password
 * @access  Private
 */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  // Get user with password
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('id, password_hash')
    .eq('id', req.user.id)
    .single();

  if (error || !user) {
    throw new ApiError(404, 'User not found');
  }

  // Verify current password
  const isValidPassword = await argon2.verify(user.password_hash, currentPassword);
  if (!isValidPassword) {
    throw new ApiError(401, 'Current password is incorrect');
  }

  // Hash new password
  const passwordHash = await argon2.hash(newPassword);

  // Update password
  await supabaseAdmin
    .from('users')
    .update({ password_hash: passwordHash })
    .eq('id', req.user.id);

  logger.info('Password changed', { userId: req.user.id });

  res.json({
    success: true,
    message: 'Password changed successfully',
  });
});

module.exports = {
  register,
  login,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  getMe,
  changePassword,
};
