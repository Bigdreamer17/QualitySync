const argon2 = require('argon2');
const { v4: uuidv4 } = require('uuid');
const { supabaseAdmin } = require('../config/supabase');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');
const emailService = require('../services/emailService');
const logger = require('../utils/logger');

/**
 * @desc    Get all users (with pagination)
 * @route   GET /api/users
 * @access  Private (PM only)
 */
const getUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  const role = req.query.role;
  const search = req.query.search;

  let query = supabaseAdmin
    .from('users')
    .select('id, email, name, role, is_verified, created_at', { count: 'exact' });

  // Filter by role
  if (role && ['PM', 'QA', 'ENG'].includes(role)) {
    query = query.eq('role', role);
  }

  // Search by name or email
  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
  }

  // Pagination
  query = query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  const { data: users, error, count } = await query;

  if (error) {
    logger.error('Failed to fetch users', { error });
    throw new ApiError(500, 'Failed to fetch users');
  }

  res.json({
    success: true,
    data: {
      users,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    },
  });
});

/**
 * @desc    Get QA testers (for assignment dropdowns)
 * @route   GET /api/users/qa-testers
 * @access  Private (PM only)
 */
const getQATesters = asyncHandler(async (req, res) => {
  const { data: testers, error } = await supabaseAdmin
    .from('users')
    .select('id, email, name')
    .eq('role', 'QA')
    .eq('is_verified', true)
    .order('name', { ascending: true });

  if (error) {
    logger.error('Failed to fetch QA testers', { error });
    throw new ApiError(500, 'Failed to fetch QA testers');
  }

  res.json({
    success: true,
    data: { testers },
  });
});

/**
 * @desc    Get single user
 * @route   GET /api/users/:id
 * @access  Private (PM only)
 */
const getUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('id, email, name, role, is_verified, created_at, updated_at')
    .eq('id', id)
    .single();

  if (error || !user) {
    throw new ApiError(404, 'User not found');
  }

  res.json({
    success: true,
    data: { user },
  });
});

/**
 * @desc    Create new user (PM only)
 * @route   POST /api/users
 * @access  Private (PM only)
 */
const createUser = asyncHandler(async (req, res) => {
  const { email, name, role, password } = req.body;

  logger.info('Attempting to create user', { email, name, role });

  // Check if user exists
  const { data: existingUser, error: checkError } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('email', email)
    .single();

  if (checkError && checkError.code !== 'PGRST116') {
    // PGRST116 = no rows returned, which is expected for new users
    logger.error('Error checking for existing user', { error: checkError });
  }

  if (existingUser) {
    throw new ApiError(409, 'User with this email already exists');
  }

  // Generate temporary password if not provided
  const userPassword = password || uuidv4().slice(0, 12);
  const passwordHash = await argon2.hash(userPassword);

  logger.info('Inserting new user into database', { email, role });

  // Create user - users created by PM are automatically verified
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .insert({
      email,
      password_hash: passwordHash,
      name,
      role,
      is_verified: true, // Auto-verify users created by PM
    })
    .select('id, email, name, role, is_verified, created_at')
    .single();

  if (error) {
    logger.error('Failed to create user', {
      error,
      errorMessage: error.message,
      errorCode: error.code,
      errorDetails: error.details,
      errorHint: error.hint
    });
    throw new ApiError(500, `Failed to create user: ${error.message || 'Unknown error'}`);
  }

  if (!user) {
    logger.error('User creation returned no data and no error');
    throw new ApiError(500, 'Failed to create user: No data returned');
  }

  logger.info('User created successfully', { userId: user.id, email: user.email });

  // Send welcome email instead of verification email
  try {
    await emailService.sendWelcomeEmail(email, name, role);
  } catch (emailError) {
    logger.error('Failed to send welcome email', { email, error: emailError });
  }

  logger.info('User created by PM', { createdBy: req.user.id, userId: user.id });

  res.status(201).json({
    success: true,
    message: 'User created successfully. They can now log in.',
    data: { user },
  });
});

/**
 * @desc    Update user
 * @route   PUT /api/users/:id
 * @access  Private (PM only)
 */
const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, role } = req.body;

  // Check if user exists
  const { data: existingUser, error: findError } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('id', id)
    .single();

  if (findError || !existingUser) {
    throw new ApiError(404, 'User not found');
  }

  // Update user
  const updateData = {};
  if (name) updateData.name = name;
  if (role && ['PM', 'QA', 'ENG'].includes(role)) updateData.role = role;

  const { data: user, error } = await supabaseAdmin
    .from('users')
    .update(updateData)
    .eq('id', id)
    .select('id, email, name, role, is_verified, created_at, updated_at')
    .single();

  if (error) {
    logger.error('Failed to update user', { error });
    throw new ApiError(500, 'Failed to update user');
  }

  logger.info('User updated', { updatedBy: req.user.id, userId: id });

  res.json({
    success: true,
    message: 'User updated successfully',
    data: { user },
  });
});

/**
 * @desc    Delete user
 * @route   DELETE /api/users/:id
 * @access  Private (PM only)
 */
const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Prevent self-deletion
  if (id === req.user.id) {
    throw new ApiError(400, 'You cannot delete your own account');
  }

  // Check if user exists
  const { data: existingUser, error: findError } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('id', id)
    .single();

  if (findError || !existingUser) {
    throw new ApiError(404, 'User not found');
  }

  // Check if user has assigned tests or bugs
  const { data: assignedTests } = await supabaseAdmin
    .from('test_cases')
    .select('id')
    .eq('assigned_to', id)
    .limit(1);

  if (assignedTests && assignedTests.length > 0) {
    throw new ApiError(400, 'Cannot delete user with assigned test cases. Reassign tests first.');
  }

  // Delete user
  const { error } = await supabaseAdmin
    .from('users')
    .delete()
    .eq('id', id);

  if (error) {
    logger.error('Failed to delete user', { error });
    throw new ApiError(500, 'Failed to delete user');
  }

  logger.info('User deleted', { deletedBy: req.user.id, userId: id });

  res.json({
    success: true,
    message: 'User deleted successfully',
  });
});

module.exports = {
  getUsers,
  getQATesters,
  getUser,
  createUser,
  updateUser,
  deleteUser,
};
