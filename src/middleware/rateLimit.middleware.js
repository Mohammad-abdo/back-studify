/**
 * Rate Limiting Middleware
 */

const rateLimit = require('express-rate-limit');
const config = require('../config/env');
const { RateLimitError } = require('../utils/errors');
const { HTTP_STATUS } = require('../utils/constants');

/**
 * General API rate limiter
 */
const apiLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMax,
  message: {
    success: false,
    error: {
      message: 'Too many requests from this IP, please try again later',
      code: 'RATE_LIMIT_EXCEEDED',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Strict rate limiter for authentication endpoints
 * Disabled for testing - set max to very high number (10000 requests per 15 minutes)
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10000, // Very high limit - effectively disabled for testing
  message: {
    success: false,
    error: {
      message: 'Too many login attempts, please try again after 15 minutes',
      code: 'RATE_LIMIT_EXCEEDED',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * OTP rate limiter
 */
const otpLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1, // 1 request per minute
  message: {
    success: false,
    error: {
      message: 'Please wait before requesting another OTP',
      code: 'RATE_LIMIT_EXCEEDED',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * File upload rate limiter
 */
const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 uploads per minute
  message: {
    success: false,
    error: {
      message: 'Too many file uploads, please try again later',
      code: 'RATE_LIMIT_EXCEEDED',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  apiLimiter,
  authLimiter,
  otpLimiter,
  uploadLimiter,
};

