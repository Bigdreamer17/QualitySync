const { supabaseAdmin } = require('../config/supabase');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');
const emailService = require('../services/emailService');
const logger = require('../utils/logger');

/**
 * @desc    Get all unlisted bugs (with pagination)
 * @route   GET /api/bugs
 * @access  Private (PM sees all, QA sees own, ENG sees all)
 */
const getBugs = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  const { status, severity, module_platform, search, sort = 'created_at', order = 'desc' } = req.query;

  let query = supabaseAdmin
    .from('unlisted_bugs')
    .select(`
      id,
      module_platform,
      jam_link,
      description,
      note,
      severity,
      status,
      created_at,
      updated_at,
      converted_to_test_id,
      converted_at,
      created_by,
      creator:users!created_by(id, name, email)
    `, { count: 'exact' });

  // Role-based filtering
  if (req.user.role === 'QA') {
    // QA only sees bugs they created
    query = query.eq('created_by', req.user.id);
  }
  // PM and ENG see all bugs

  // Filter by status
  if (status && ['open', 'in_progress', 'resolved', 'closed', 'converted_to_test'].includes(status)) {
    query = query.eq('status', status);
  }

  // Filter by severity
  if (severity && ['low', 'medium', 'high', 'critical'].includes(severity)) {
    query = query.eq('severity', severity);
  }

  // Filter by module/platform
  if (module_platform) {
    query = query.ilike('module_platform', `%${module_platform}%`);
  }

  // Search in description or note
  if (search) {
    query = query.or(`description.ilike.%${search}%,note.ilike.%${search}%`);
  }

  // Sorting
  const validSortFields = ['created_at', 'updated_at', 'status', 'severity', 'module_platform'];
  const sortField = validSortFields.includes(sort) ? sort : 'created_at';
  query = query.order(sortField, { ascending: order === 'asc' });

  // Pagination
  query = query.range(offset, offset + limit - 1);

  const { data: bugs, error, count } = await query;

  if (error) {
    logger.error('Failed to fetch bugs', { error });
    throw new ApiError(500, 'Failed to fetch unlisted bugs');
  }

  res.json({
    success: true,
    data: {
      bugs,
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
 * @desc    Get single bug
 * @route   GET /api/bugs/:id
 * @access  Private
 */
const getBug = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { data: bug, error } = await supabaseAdmin
    .from('unlisted_bugs')
    .select(`
      id,
      module_platform,
      jam_link,
      description,
      note,
      severity,
      status,
      created_at,
      updated_at,
      converted_to_test_id,
      converted_at,
      created_by,
      creator:users!created_by(id, name, email),
      converted_test:test_cases!converted_to_test_id(
        id,
        module_platform,
        test_case,
        status,
        assigned_to,
        assignee:users!assigned_to(id, name, email)
      )
    `)
    .eq('id', id)
    .single();

  if (error || !bug) {
    throw new ApiError(404, 'Bug not found');
  }

  // QA can only view their own bugs
  if (req.user.role === 'QA' && bug.created_by !== req.user.id) {
    throw new ApiError(403, 'You do not have access to this bug');
  }

  res.json({
    success: true,
    data: { bug },
  });
});

/**
 * @desc    Create unlisted bug
 * @route   POST /api/bugs
 * @access  Private (QA only)
 */
const createBug = asyncHandler(async (req, res) => {
  const { module_platform, jam_link, description, note, severity } = req.body;

  // Create bug
  const { data: bug, error } = await supabaseAdmin
    .from('unlisted_bugs')
    .insert({
      module_platform,
      jam_link,
      description,
      note: note || null,
      severity: severity || 'medium',
      created_by: req.user.id,
    })
    .select(`
      id,
      module_platform,
      jam_link,
      description,
      note,
      severity,
      status,
      created_at,
      created_by,
      creator:users!created_by(id, name, email)
    `)
    .single();

  if (error) {
    logger.error('Failed to create bug', { error });
    throw new ApiError(500, 'Failed to create unlisted bug');
  }

  logger.info('Unlisted bug created', { bugId: bug.id, createdBy: req.user.id });

  res.status(201).json({
    success: true,
    message: 'Bug reported successfully',
    data: { bug },
  });
});

/**
 * @desc    Update bug
 * @route   PUT /api/bugs/:id
 * @access  Private (PM or creator)
 */
const updateBug = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { module_platform, jam_link, description, note, severity, status } = req.body;

  // Get existing bug
  const { data: existingBug, error: findError } = await supabaseAdmin
    .from('unlisted_bugs')
    .select('id, created_by, status')
    .eq('id', id)
    .single();

  if (findError || !existingBug) {
    throw new ApiError(404, 'Bug not found');
  }

  // Check permissions - PM can update any, QA can update their own (not converted)
  if (req.user.role === 'QA') {
    if (existingBug.created_by !== req.user.id) {
      throw new ApiError(403, 'You can only update bugs you created');
    }
    if (existingBug.status === 'converted_to_test') {
      throw new ApiError(400, 'Cannot update a bug that has been converted to a test');
    }
  }

  // Prepare update data
  const updateData = {};
  if (module_platform) updateData.module_platform = module_platform;
  if (jam_link) updateData.jam_link = jam_link;
  if (description) updateData.description = description;
  if (note !== undefined) updateData.note = note || null;
  if (severity) updateData.severity = severity;
  if (status && req.user.role === 'PM') updateData.status = status;

  // Update bug
  const { data: bug, error } = await supabaseAdmin
    .from('unlisted_bugs')
    .update(updateData)
    .eq('id', id)
    .select(`
      id,
      module_platform,
      jam_link,
      description,
      note,
      severity,
      status,
      updated_at,
      creator:users!created_by(id, name, email)
    `)
    .single();

  if (error) {
    logger.error('Failed to update bug', { error });
    throw new ApiError(500, 'Failed to update bug');
  }

  logger.info('Bug updated', { bugId: id, updatedBy: req.user.id });

  res.json({
    success: true,
    message: 'Bug updated successfully',
    data: { bug },
  });
});

/**
 * @desc    Convert bug to test case
 * @route   POST /api/bugs/:id/convert
 * @access  Private (PM only)
 */
const convertToTest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { assigned_to, test_case, expected_result } = req.body;

  // Get bug
  const { data: bug, error: findError } = await supabaseAdmin
    .from('unlisted_bugs')
    .select('id, module_platform, jam_link, description, status, created_by')
    .eq('id', id)
    .single();

  if (findError || !bug) {
    throw new ApiError(404, 'Bug not found');
  }

  if (bug.status === 'converted_to_test') {
    throw new ApiError(400, 'This bug has already been converted to a test case');
  }

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

  // Create test case from bug
  const { data: testCaseData, error: testError } = await supabaseAdmin
    .from('test_cases')
    .insert({
      module_platform: bug.module_platform,
      test_case,
      expected_result,
      evidence_url: bug.jam_link,
      assigned_to,
      created_by: req.user.id,
      source_bug_id: bug.id,
    })
    .select(`
      id,
      module_platform,
      test_case,
      expected_result,
      status,
      evidence_url,
      source_bug_id,
      created_at,
      assignee:users!assigned_to(id, name, email),
      creator:users!created_by(id, name, email)
    `)
    .single();

  if (testError) {
    logger.error('Failed to create test from bug', { error: testError });
    throw new ApiError(500, 'Failed to convert bug to test case');
  }

  // Update bug status
  await supabaseAdmin
    .from('unlisted_bugs')
    .update({
      status: 'converted_to_test',
      converted_to_test_id: testCaseData.id,
      converted_at: new Date().toISOString(),
    })
    .eq('id', id);

  // Send notification email to assignee
  try {
    await emailService.sendTestAssignmentEmail(assignee.email, assignee.name, {
      module_platform: bug.module_platform,
      test_case,
      expected_result,
    });
  } catch (emailError) {
    logger.error('Failed to send test assignment email', { error: emailError });
  }

  logger.info('Bug converted to test', { bugId: id, testId: testCaseData.id, convertedBy: req.user.id });

  res.status(201).json({
    success: true,
    message: 'Bug converted to test case successfully',
    data: { test: testCaseData },
  });
});

/**
 * @desc    Delete bug
 * @route   DELETE /api/bugs/:id
 * @access  Private (PM only)
 */
const deleteBug = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if bug exists
  const { data: existingBug, error: findError } = await supabaseAdmin
    .from('unlisted_bugs')
    .select('id, status, converted_to_test_id')
    .eq('id', id)
    .single();

  if (findError || !existingBug) {
    throw new ApiError(404, 'Bug not found');
  }

  // If bug was converted, clear the reference in the test case
  if (existingBug.converted_to_test_id) {
    await supabaseAdmin
      .from('test_cases')
      .update({ source_bug_id: null })
      .eq('id', existingBug.converted_to_test_id);
  }

  // Delete bug
  const { error } = await supabaseAdmin
    .from('unlisted_bugs')
    .delete()
    .eq('id', id);

  if (error) {
    logger.error('Failed to delete bug', { error });
    throw new ApiError(500, 'Failed to delete bug');
  }

  logger.info('Bug deleted', { bugId: id, deletedBy: req.user.id });

  res.json({
    success: true,
    message: 'Bug deleted successfully',
  });
});

module.exports = {
  getBugs,
  getBug,
  createBug,
  updateBug,
  convertToTest,
  deleteBug,
};
