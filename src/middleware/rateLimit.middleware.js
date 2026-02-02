/**
 * Rate Limiting Middleware
 */

const rateLimit = require('express-rate-limit');
const config = require('../config/env');
const { RateLimitError } = require('../utils/errors');
const { HTTP_STATUS } = require('../utils/constants');

/**
 * General API rate limiter
 * Skip /auth so login & profile don't consume the global limit (they use authLimiter)
 */
const apiLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMax,
  skip: (req) => req.path.startsWith('/auth'),
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
 * Rate limiter for authentication endpoints (login, profile, register)
 * Generous limit so 429 does not happen for normal use (tabs, Strict Mode, retries)
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '500', 10), // 500 auth requests per 15 min per IP
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

