const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const {
  authenticate,
  authLimiter,
  passwordResetLimiter,
  verificationLimiter,
  loginValidation,
  registerValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  verifyEmailValidation,
} = require('../middleware');
const { body } = require('express-validator');
const { handleValidation } = require('../middleware/validate');

// Public routes with rate limiting
router.post('/register', authLimiter, registerValidation, authController.register);
router.post('/login', authLimiter, loginValidation, authController.login);
router.post('/verify-email', verifyEmailValidation, authController.verifyEmail);
router.post(
  '/resend-verification',
  verificationLimiter,
  forgotPasswordValidation,
  authController.resendVerification
);
router.post(
  '/forgot-password',
  passwordResetLimiter,
  forgotPasswordValidation,
  authController.forgotPassword
);
router.post('/reset-password', resetPasswordValidation, authController.resetPassword);

// Protected routes
router.get('/me', authenticate, authController.getMe);
router.put(
  '/change-password',
  authenticate,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters')
      .matches(/[A-Z]/)
      .withMessage('Password must contain at least one uppercase letter')
      .matches(/[a-z]/)
      .withMessage('Password must contain at least one lowercase letter')
      .matches(/[0-9]/)
      .withMessage('Password must contain at least one number'),
    handleValidation,
  ],
  authController.changePassword
);

module.exports = router;
