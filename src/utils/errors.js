/**
 * Custom Error Classes
 */

const { HTTP_STATUS, ERROR_CODES } = require('./constants');

class AppError extends Error {
  constructor(message, statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR, code = ERROR_CODES.INTERNAL_ERROR, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, HTTP_STATUS.VALIDATION_ERROR, ERROR_CODES.VALIDATION_ERROR, details);
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.AUTHENTICATION_ERROR);
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'You do not have permission to perform this action') {
    super(message, HTTP_STATUS.FORBIDDEN, ERROR_CODES.AUTHORIZATION_ERROR);
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(message, HTTP_STATUS.CONFLICT, ERROR_CODES.ALREADY_EXISTS);
  }
}

class InvalidCredentialsError extends AppError {
  constructor(message = 'Invalid credentials') {
    super(message, HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.INVALID_CREDENTIALS);
  }
}

class TokenExpiredError extends AppError {
  constructor(message = 'Token has expired') {
    super(message, HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.TOKEN_EXPIRED);
  }
}

class TokenInvalidError extends AppError {
  constructor(message = 'Invalid token') {
    super(message, HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.TOKEN_INVALID);
  }
}

class OTPExpiredError extends AppError {
  constructor(message = 'OTP has expired') {
    super(message, HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.OTP_EXPIRED);
  }
}

class OTPInvalidError extends AppError {
  constructor(message = 'Invalid OTP code') {
    super(message, HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.OTP_INVALID);
  }
}

class RateLimitError extends AppError {
  constructor(message = 'Too many requests, please try again later') {
    super(message, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.RATE_LIMIT_EXCEEDED);
  }
}

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  InvalidCredentialsError,
  TokenExpiredError,
  TokenInvalidError,
  OTPExpiredError,
  OTPInvalidError,
  RateLimitError,
};

