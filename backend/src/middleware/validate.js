const { validationResult, body, param, query } = require('express-validator');

/**
 * Handle validation errors
 */
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formattedErrors,
    });
  }

  next();
};

// Auth validations
const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  handleValidation,
];

const registerValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number'),
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
    .trim(),
  body('role')
    .isIn(['PM', 'QA', 'ENG'])
    .withMessage('Role must be PM, QA, or ENG'),
  handleValidation,
];

const forgotPasswordValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  handleValidation,
];

const resetPasswordValidation = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number'),
  handleValidation,
];

const verifyEmailValidation = [
  body('token')
    .notEmpty()
    .withMessage('Verification token is required'),
  handleValidation,
];

// Test case validations
const createTestValidation = [
  body('module_platform')
    .notEmpty()
    .withMessage('Module/Platform is required')
    .isLength({ max: 255 })
    .withMessage('Module/Platform must be less than 255 characters')
    .trim(),
  body('test_case')
    .notEmpty()
    .withMessage('Test case description is required')
    .isLength({ min: 5, max: 2000 })
    .withMessage('Test case must be between 5 and 2000 characters')
    .trim(),
  body('expected_result')
    .notEmpty()
    .withMessage('Expected result is required')
    .isLength({ min: 5, max: 2000 })
    .withMessage('Expected result must be between 5 and 2000 characters')
    .trim(),
  body('evidence_url')
    .optional()
    .isURL()
    .withMessage('Evidence URL must be a valid URL')
    .custom((value) => {
      if (value && !value.includes('jam.dev')) {
        throw new Error('Evidence URL must be a Jam.dev link');
      }
      return true;
    }),
  body('assigned_to')
    .notEmpty()
    .withMessage('Assigned tester is required')
    .isUUID()
    .withMessage('Assigned tester must be a valid user ID'),
  handleValidation,
];

const updateTestResultValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid test case ID'),
  body('status')
    .isIn(['pass', 'fail', 'escalated'])
    .withMessage('Status must be pass, fail, or escalated'),
  body('evidence_url')
    .optional()
    .isURL()
    .withMessage('Evidence URL must be a valid URL')
    .custom((value) => {
      if (value && !value.includes('jam.dev')) {
        throw new Error('Evidence URL must be a Jam.dev link');
      }
      return true;
    }),
  body('notes')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Notes must be less than 2000 characters')
    .trim(),
  handleValidation,
];

// Bug validations
const createBugValidation = [
  body('module_platform')
    .notEmpty()
    .withMessage('Module/Platform is required')
    .isLength({ max: 255 })
    .withMessage('Module/Platform must be less than 255 characters')
    .trim(),
  body('jam_link')
    .notEmpty()
    .withMessage('Jam link is required')
    .isURL()
    .withMessage('Jam link must be a valid URL')
    .custom((value) => {
      if (!value.includes('jam.dev')) {
        throw new Error('Must be a valid Jam.dev link');
      }
      return true;
    }),
  body('description')
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters')
    .trim(),
  body('note')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Note must be less than 2000 characters')
    .trim(),
  body('severity')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Severity must be low, medium, high, or critical'),
  handleValidation,
];

const convertBugToTestValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid bug ID'),
  body('assigned_to')
    .notEmpty()
    .withMessage('Assigned tester is required')
    .isUUID()
    .withMessage('Assigned tester must be a valid user ID'),
  body('test_case')
    .notEmpty()
    .withMessage('Test case description is required')
    .isLength({ min: 5, max: 2000 })
    .withMessage('Test case must be between 5 and 2000 characters')
    .trim(),
  body('expected_result')
    .notEmpty()
    .withMessage('Expected result is required')
    .isLength({ min: 5, max: 2000 })
    .withMessage('Expected result must be between 5 and 2000 characters')
    .trim(),
  handleValidation,
];

// User validations
const createUserValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
    .trim(),
  body('role')
    .isIn(['PM', 'QA', 'ENG'])
    .withMessage('Role must be PM, QA, or ENG'),
  body('password')
    .optional()
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  handleValidation,
];

// Pagination validation
const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),
  query('sort')
    .optional()
    .isIn(['created_at', 'updated_at', 'status', 'module_platform'])
    .withMessage('Invalid sort field'),
  query('order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Order must be asc or desc'),
  handleValidation,
];

// UUID param validation
const uuidParamValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid ID format'),
  handleValidation,
];

module.exports = {
  handleValidation,
  loginValidation,
  registerValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  verifyEmailValidation,
  createTestValidation,
  updateTestResultValidation,
  createBugValidation,
  convertBugToTestValidation,
  createUserValidation,
  paginationValidation,
  uuidParamValidation,
};
