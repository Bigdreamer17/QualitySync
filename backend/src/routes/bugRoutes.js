const express = require('express');
const router = express.Router();
const bugController = require('../controllers/bugController');
const {
  authenticate,
  authorize,
  createBugValidation,
  convertBugToTestValidation,
  uuidParamValidation,
  paginationValidation,
} = require('../middleware');
const { query, body } = require('express-validator');
const { handleValidation } = require('../middleware/validate');

// All routes require authentication
router.use(authenticate);

// Get all bugs with pagination and filters
router.get(
  '/',
  [
    ...paginationValidation,
    query('status')
      .optional()
      .isIn(['open', 'in_progress', 'resolved', 'closed', 'converted_to_test'])
      .withMessage('Invalid status value'),
    query('severity')
      .optional()
      .isIn(['low', 'medium', 'high', 'critical'])
      .withMessage('Severity must be low, medium, high, or critical'),
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
  bugController.getBugs
);

// Get single bug
router.get('/:id', uuidParamValidation, bugController.getBug);

// Create bug (QA only)
router.post('/', authorize('QA'), createBugValidation, bugController.createBug);

// Update bug (PM or QA creator)
router.put(
  '/:id',
  [
    ...uuidParamValidation,
    body('module_platform')
      .optional()
      .isLength({ max: 255 })
      .withMessage('Module/Platform must be less than 255 characters')
      .trim(),
    body('jam_link')
      .optional()
      .isURL()
      .withMessage('Jam link must be a valid URL')
      .custom((value) => {
        if (value && !value.includes('jam.dev')) {
          throw new Error('Must be a valid Jam.dev link');
        }
        return true;
      }),
    body('description')
      .optional()
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
    body('status')
      .optional()
      .isIn(['open', 'in_progress', 'resolved', 'closed'])
      .withMessage('Invalid status value'),
    handleValidation,
  ],
  bugController.updateBug
);

// Convert bug to test case (PM only)
router.post(
  '/:id/convert',
  authorize('PM'),
  convertBugToTestValidation,
  bugController.convertToTest
);

// Delete bug (PM only)
router.delete('/:id', authorize('PM'), uuidParamValidation, bugController.deleteBug);

module.exports = router;
