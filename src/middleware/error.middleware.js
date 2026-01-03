/**
 * Global Error Handling Middleware
 */

const { AppError, ValidationError } = require('../utils/errors');
const { HTTP_STATUS } = require('../utils/constants');
const { sendError } = require('../utils/response');
const config = require('../config/env');

const errorHandler = (err, req, res, next) => {
  // Default error
  let statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  let message = err.message || 'Internal server error';
  let code = err.code || null;
  let details = err.details || null;

  // Handle known operational errors
  if (err.isOperational) {
    return sendError(res, message, statusCode, code, details);
  }

  // Handle Prisma errors
  if (err.code === 'P2002') {
    // Unique constraint violation
    const field = err.meta?.target?.[0] || 'field';
    message = `${field} already exists`;
    statusCode = HTTP_STATUS.CONFLICT;
    code = 'ALREADY_EXISTS';
    return sendError(res, message, statusCode, code);
  }

  if (err.code === 'P2025') {
    // Record not found
    message = 'Resource not found';
    statusCode = HTTP_STATUS.NOT_FOUND;
    code = 'NOT_FOUND';
    return sendError(res, message, statusCode, code);
  }

  // Handle Zod validation errors
  if (err.name === 'ZodError') {
    const zodErrors = err.errors.map((error) => ({
      field: error.path.join('.'),
      message: error.message,
    }));
    message = 'Validation failed';
    statusCode = HTTP_STATUS.VALIDATION_ERROR;
    code = 'VALIDATION_ERROR';
    details = zodErrors;
    return sendError(res, message, statusCode, code, details);
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    message = 'Invalid token';
    statusCode = HTTP_STATUS.UNAUTHORIZED;
    code = 'TOKEN_INVALID';
    return sendError(res, message, statusCode, code);
  }

  if (err.name === 'TokenExpiredError') {
    message = 'Token has expired';
    statusCode = HTTP_STATUS.UNAUTHORIZED;
    code = 'TOKEN_EXPIRED';
    return sendError(res, message, statusCode, code);
  }

  // Log error in development
  if (config.nodeEnv === 'development') {
    console.error('Error:', err);
  }

  // Don't leak error details in production
  if (config.nodeEnv === 'production') {
    message = 'Something went wrong';
    details = null;
  }

  // Send error response
  return sendError(res, message, statusCode, code, details);
};

module.exports = errorHandler;

