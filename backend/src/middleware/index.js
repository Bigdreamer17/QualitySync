const { authenticate, authorize, optionalAuth } = require('./auth');
const { ApiError, notFound, errorHandler, asyncHandler } = require('./errorHandler');
const {
  apiLimiter,
  authLimiter,
  passwordResetLimiter,
  verificationLimiter,
} = require('./rateLimiter');
const {
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
} = require('./validate');

module.exports = {
  // Auth
  authenticate,
  authorize,
  optionalAuth,

  // Error handling
  ApiError,
  notFound,
  errorHandler,
  asyncHandler,

  // Rate limiting
  apiLimiter,
  authLimiter,
  passwordResetLimiter,
  verificationLimiter,

  // Validations
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
