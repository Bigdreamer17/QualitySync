const logger = require('../utils/logger');
const config = require('../config');

/**
 * Custom API Error class
 */
class ApiError extends Error {
  constructor(statusCode, message, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Not found handler for undefined routes
 */
const notFound = (req, res, next) => {
  const error = new ApiError(404, `Route ${req.originalUrl} not found`);
  next(error);
};

/**
 * Global error handler
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.stack = err.stack;

  // Log error
  logger.error('Error occurred', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    body: req.body,
    user: req.user?.id,
  });

  // Supabase errors
  if (err.code && err.message) {
    // Unique constraint violation
    if (err.code === '23505') {
      error = new ApiError(409, 'A record with this value already exists');
    }
    // Foreign key violation
    if (err.code === '23503') {
      error = new ApiError(400, 'Referenced record does not exist');
    }
    // Check constraint violation
    if (err.code === '23514') {
      error = new ApiError(400, 'Invalid data provided');
    }
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = new ApiError(401, 'Invalid token');
  }
  if (err.name === 'TokenExpiredError') {
    error = new ApiError(401, 'Token has expired');
  }

  // Validation errors from express-validator
  if (err.array && typeof err.array === 'function') {
    const messages = err.array().map((e) => e.msg).join(', ');
    error = new ApiError(400, messages);
  }

  // Default error response
  const statusCode = error.statusCode || err.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message,
    ...(config.nodeEnv === 'development' && {
      stack: error.stack,
      error: err,
    }),
  });
};

/**
 * Async handler wrapper to catch errors
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  ApiError,
  notFound,
  errorHandler,
  asyncHandler,
};
