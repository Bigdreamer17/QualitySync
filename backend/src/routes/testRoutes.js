const express = require('express');
const router = express.Router();
const testController = require('../controllers/testController');
const {
  authenticate,
  authorize,
  createTestValidation,
  updateTestResultValidation,
  uuidParamValidation,
  paginationValidation,
} = require('../middleware');
const { query, body } = require('express-validator');
const { handleValidation } = require('../middleware/validate');

// All routes require authentication
router.use(authenticate);

// Get dashboard stats (PM only)
router.get('/stats', authorize('PM'), testController.getStats);

// Get all tests with pagination and filters
router.get(
  '/',
  [
    ...paginationValidation,
    query('status')
      .optional()
      .isIn(['pending', 'pass', 'fail', 'escalated'])
      .withMessage('Status must be pending, pass, fail, or escalated'),
    query('module_platform')
      .optional()
      .isLength({ max: 255 })
      .withMessage('Module/Platform must be less than 255 characters'),
    query('search')
      .optional()
      .isLength({ max: 255 })
      .withMessage('Search term must be less than 255 characters'),
    handleValidation,
  ],
  testController.getTests
);

// Get single test
router.get('/:id', uuidParamValidation, testController.getTest);

// Create test (PM only)
router.post('/', authorize('PM'), createTestValidation, testController.createTest);

// Update test result (QA only)
router.put(
  '/:id/result',
  authorize('QA'),
  updateTestResultValidation,
  testController.updateTestResult
);

// Update test (PM only)
router.put(
  '/:id',
  authorize('PM'),
  [
    ...uuidParamValidation,
    body('module_platform')
      .optional()
      .isLength({ max: 255 })
      .withMessage('Module/Platform must be less than 255 characters')
      .trim(),
    body('test_case')
      .optional()
      .isLength({ min: 5, max: 2000 })
      .withMessage('Test case must be between 5 and 2000 characters')
      .trim(),
    body('expected_result')
      .optional()
      .isLength({ min: 5, max: 2000 })
      .withMessage('Expected result must be between 5 and 2000 characters')
      .trim(),
    body('evidence_url')
      .optional()
      .custom((value) => {
        if (value && !value.includes('jam.dev')) {
          throw new Error('Evidence URL must be a Jam.dev link');
        }
        return true;
      }),
    body('assigned_to')
      .optional()
      .isUUID()
      .withMessage('Assigned tester must be a valid user ID'),
    handleValidation,
  ],
  testController.updateTest
);

// Delete test (PM only)
router.delete('/:id', authorize('PM'), uuidParamValidation, testController.deleteTest);

module.exports = router;
