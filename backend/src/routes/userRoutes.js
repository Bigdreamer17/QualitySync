const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const {
  authenticate,
  authorize,
  createUserValidation,
  uuidParamValidation,
  paginationValidation,
} = require('../middleware');
const { body, query } = require('express-validator');
const { handleValidation } = require('../middleware/validate');

// All routes require PM role
router.use(authenticate);
router.use(authorize('PM'));

// Get all users with pagination
router.get(
  '/',
  [
    ...paginationValidation,
    query('role')
      .optional()
      .isIn(['PM', 'QA', 'ENG'])
      .withMessage('Role must be PM, QA, or ENG'),
    query('search')
      .optional()
      .isLength({ max: 100 })
      .withMessage('Search term must be less than 100 characters'),
    handleValidation,
  ],
  userController.getUsers
);

// Get QA testers for dropdowns
router.get('/qa-testers', userController.getQATesters);

// Get single user
router.get('/:id', uuidParamValidation, userController.getUser);

// Create user
router.post('/', createUserValidation, userController.createUser);

// Update user
router.put(
  '/:id',
  [
    ...uuidParamValidation,
    body('name')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters')
      .trim(),
    body('role')
      .optional()
      .isIn(['PM', 'QA', 'ENG'])
      .withMessage('Role must be PM, QA, or ENG'),
    handleValidation,
  ],
  userController.updateUser
);

// Delete user
router.delete('/:id', uuidParamValidation, userController.deleteUser);

module.exports = router;
