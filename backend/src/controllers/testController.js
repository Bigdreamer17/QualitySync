const { supabaseAdmin } = require('../config/supabase');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');
const emailService = require('../services/emailService');
const logger = require('../utils/logger');

/**
 * @desc    Get all test cases (with pagination)
 * @route   GET /api/tests
 * @access  Private (PM can see all, QA sees assigned, ENG sees failed/escalated)
 */
const getTests = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  const { status, module_platform, search, sort = 'created_at', order = 'desc' } = req.query;

  logger.info('Fetching tests', { page, limit, status, module_platform, search, userRole: req.user.role });

  let query = supabaseAdmin
    .from('test_cases')
    .select(`
      id,
      module_platform,
      test_case,
      expected_result,
      status,
      evidence_url,
      notes,
      created_at,
      updated_at,
      source_bug_id,
      assigned_to,
      created_by,
      assignee:users!assigned_to(id, name, email),
      creator:users!created_by(id, name, email),
      source_bug:unlisted_bugs!source_bug_id(id, module_platform, created_by)
    `, { count: 'exact' });

  // Role-based filtering
  if (req.user.role === 'QA') {
    // QA only sees tests assigned to them
    query = query.eq('assigned_to', req.user.id);
  } else if (req.user.role === 'ENG') {
    // Engineering only sees failed or escalated tests
    query = query.in('status', ['fail', 'escalated']);
  }
  // PM sees all tests

  // Filter by status
  if (status && ['pending', 'pass', 'fail', 'escalated'].includes(status)) {
    query = query.eq('status', status);
  }

  // Filter by module/platform
  if (module_platform) {
    query = query.ilike('module_platform', `%${module_platform}%`);
  }

  // Search in test_case or expected_result
  if (search) {
    query = query.or(`test_case.ilike.%${search}%,expected_result.ilike.%${search}%`);
  }

  // Sorting
  const validSortFields = ['created_at', 'updated_at', 'status', 'module_platform'];
  const sortField = validSortFields.includes(sort) ? sort : 'created_at';
  query = query.order(sortField, { ascending: order === 'asc' });

  // Pagination
  query = query.range(offset, offset + limit - 1);

  const { data: tests, error, count } = await query;

  if (error) {
    logger.error('Failed to fetch tests', {
      error,
      errorMessage: error.message,
      errorCode: error.code,
      errorDetails: error.details,
      errorHint: error.hint
    });
    throw new ApiError(500, `Failed to fetch test cases: ${error.message || 'Unknown error'}`);
  }

  logger.info('Tests fetched successfully', { count, page });

  res.json({
    success: true,
    data: {
      tests,
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
 * @desc    Get single test case
 * @route   GET /api/tests/:id
 * @access  Private
 */
const getTest = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { data: test, error } = await supabaseAdmin
    .from('test_cases')
    .select(`
      id,
      module_platform,
      test_case,
      expected_result,
      status,
      evidence_url,
      notes,
      created_at,
      updated_at,
      source_bug_id,
      assigned_to,
      created_by,
      assignee:users!assigned_to(id, name, email),
      creator:users!created_by(id, name, email),
      source_bug:unlisted_bugs!source_bug_id(
        id,
        module_platform,
        jam_link,
        description,
        created_by,
        bug_creator:users!created_by(id, name, email)
      )
    `)
    .eq('id', id)
    .single();

  if (error || !test) {
    throw new ApiError(404, 'Test case not found');
  }

  // Role-based access check
  if (req.user.role === 'QA' && test.assigned_to !== req.user.id) {
    throw new ApiError(403, 'You do not have access to this test case');
  }

  if (req.user.role === 'ENG' && !['fail', 'escalated'].includes(test.status)) {
    throw new ApiError(403, 'You can only view failed or escalated test cases');
  }

  res.json({
    success: true,
    data: { test },
  });
});

/**
 * @desc    Create test case
 * @route   POST /api/tests
 * @access  Private (PM only)
 */
const createTest = asyncHandler(async (req, res) => {
  const { module_platform, test_case, expected_result, evidence_url, assigned_to } = req.body;

  // Verify assignee exists and is QA
  const { data: assignee, error: assigneeError } = await supabaseAdmin
    .from('users')
    .select('id, name, email, role')
    .eq('id', assigned_to)
    .single();

  if (assigneeError || !assignee) {
    throw new ApiError(400, 'Assigned user not found');
  }

  if (assignee.role !== 'QA') {
    throw new ApiError(400, 'Tests can only be assigned to QA testers');
  }

  // Create test case
  const { data: test, error } = await supabaseAdmin
    .from('test_cases')
    .insert({
      module_platform,
      test_case,
      expected_result,
      evidence_url: evidence_url || null,
      assigned_to,
      created_by: req.user.id,
    })
    .select(`
      id,
      module_platform,
      test_case,
      expected_result,
      status,
      evidence_url,
      created_at,
      assigned_to,
      created_by,
      assignee:users!assigned_to(id, name, email),
      creator:users!created_by(id, name, email)
    `)
    .single();

  if (error) {
    logger.error('Failed to create test case', { error });
    throw new ApiError(500, 'Failed to create test case');
  }

  // Send notification email to assignee
  try {
    await emailService.sendTestAssignmentEmail(assignee.email, assignee.name, {
      module_platform,
      test_case,
      expected_result,
    });
  } catch (emailError) {
    logger.error('Failed to send test assignment email', { error: emailError });
  }

  logger.info('Test case created', { testId: test.id, createdBy: req.user.id });

  res.status(201).json({
    success: true,
    message: 'Test case created successfully',
    data: { test },
  });
});

/**
 * @desc    Update test result (QA resolves test)
 * @route   PUT /api/tests/:id/result
 * @access  Private (QA only - assigned tester)
 */
const updateTestResult = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, evidence_url, notes } = req.body;

  // Get existing test
  const { data: existingTest, error: findError } = await supabaseAdmin
    .from('test_cases')
    .select('id, assigned_to, status')
    .eq('id', id)
    .single();

  if (findError || !existingTest) {
    throw new ApiError(404, 'Test case not found');
  }

  // Verify user is the assignee
  if (existingTest.assigned_to !== req.user.id) {
    throw new ApiError(403, 'You can only update tests assigned to you');
  }

  // Update test
  const { data: test, error } = await supabaseAdmin
    .from('test_cases')
    .update({
      status,
      evidence_url: evidence_url || null,
      notes: notes || null,
    })
    .eq('id', id)
    .select(`
      id,
      module_platform,
      test_case,
      expected_result,
      status,
      evidence_url,
      notes,
      updated_at
    `)
    .single();

  if (error) {
    logger.error('Failed to update test result', { error });
    throw new ApiError(500, 'Failed to update test result');
  }

  logger.info('Test result updated', { testId: id, status, updatedBy: req.user.id });

  res.json({
    success: true,
    message: 'Test result updated successfully',
    data: { test },
  });
});

/**
 * @desc    Update test case (PM only)
 * @route   PUT /api/tests/:id
 * @access  Private (PM only)
 */
const updateTest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { module_platform, test_case, expected_result, evidence_url, assigned_to } = req.body;

  // Check if test exists
  const { data: existingTest, error: findError } = await supabaseAdmin
    .from('test_cases')
    .select('id, assigned_to')
    .eq('id', id)
    .single();

  if (findError || !existingTest) {
    throw new ApiError(404, 'Test case not found');
  }

  // Prepare update data
  const updateData = {};
  if (module_platform) updateData.module_platform = module_platform;
  if (test_case) updateData.test_case = test_case;
  if (expected_result) updateData.expected_result = expected_result;
  if (evidence_url !== undefined) updateData.evidence_url = evidence_url || null;

  // If reassigning, verify new assignee
  if (assigned_to && assigned_to !== existingTest.assigned_to) {
    const { data: assignee, error: assigneeError } = await supabaseAdmin
      .from('users')
      .select('id, name, email, role')
      .eq('id', assigned_to)
      .single();

    if (assigneeError || !assignee) {
      throw new ApiError(400, 'Assigned user not found');
    }

    if (assignee.role !== 'QA') {
      throw new ApiError(400, 'Tests can only be assigned to QA testers');
    }

    updateData.assigned_to = assigned_to;

    // Send notification to new assignee
    const testDetails = {
      module_platform: module_platform || existingTest.module_platform,
      test_case: test_case || existingTest.test_case,
      expected_result: expected_result || existingTest.expected_result,
    };

    try {
      await emailService.sendTestAssignmentEmail(assignee.email, assignee.name, testDetails);
    } catch (emailError) {
      logger.error('Failed to send reassignment email', { error: emailError });
    }
  }

  // Update test
  const { data: test, error } = await supabaseAdmin
    .from('test_cases')
    .update(updateData)
    .eq('id', id)
    .select(`
      id,
      module_platform,
      test_case,
      expected_result,
      status,
      evidence_url,
      notes,
      updated_at,
      assignee:users!assigned_to(id, name, email)
    `)
    .single();

  if (error) {
    logger.error('Failed to update test case', { error });
    throw new ApiError(500, 'Failed to update test case');
  }

  logger.info('Test case updated', { testId: id, updatedBy: req.user.id });

  res.json({
    success: true,
    message: 'Test case updated successfully',
    data: { test },
  });
});

/**
 * @desc    Delete test case
 * @route   DELETE /api/tests/:id
 * @access  Private (PM only)
 */
const deleteTest = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if test exists
  const { data: existingTest, error: findError } = await supabaseAdmin
    .from('test_cases')
    .select('id')
    .eq('id', id)
    .single();

  if (findError || !existingTest) {
    throw new ApiError(404, 'Test case not found');
  }

  // Delete test
  const { error } = await supabaseAdmin
    .from('test_cases')
    .delete()
    .eq('id', id);

  if (error) {
    logger.error('Failed to delete test case', { error });
    throw new ApiError(500, 'Failed to delete test case');
  }

  logger.info('Test case deleted', { testId: id, deletedBy: req.user.id });

  res.json({
    success: true,
    message: 'Test case deleted successfully',
  });
});

/**
 * @desc    Get dashboard statistics
 * @route   GET /api/tests/stats
 * @access  Private (PM only)
 */
const getStats = asyncHandler(async (req, res) => {
  const { data: stats, error } = await supabaseAdmin
    .from('dashboard_stats')
    .select('*')
    .single();

  if (error) {
    logger.error('Failed to fetch stats', { error });
    throw new ApiError(500, 'Failed to fetch statistics');
  }

  res.json({
    success: true,
    data: { stats },
  });
});

module.exports = {
  getTests,
  getTest,
  createTest,
  updateTestResult,
  updateTest,
  deleteTest,
  getStats,
};
