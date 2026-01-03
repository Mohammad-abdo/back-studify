/**
 * Helper Functions
 */

const bcrypt = require('bcrypt');
const crypto = require('crypto');
const config = require('../config/env');

/**
 * Hash password using bcrypt
 */
const hashPassword = async (password) => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

/**
 * Compare password with hash
 */
const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

/**
 * Generate OTP code
 */
const generateOTP = (length = config.otpLength) => {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)];
  }
  return otp;
};

/**
 * Generate random token
 */
const generateToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Format phone number (remove spaces, dashes, etc.)
 */
const formatPhoneNumber = (phone) => {
  return phone.replace(/\s+/g, '').replace(/-/g, '');
};

/**
 * Validate phone number format (basic validation)
 */
const isValidPhoneNumber = (phone) => {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(formatPhoneNumber(phone));
};

/**
 * Validate email format
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Sanitize string (remove special characters, trim)
 */
const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  return str.trim().replace(/[<>]/g, '');
};

/**
 * Calculate total pages
 */
const calculateTotalPages = (total, limit) => {
  return Math.ceil(total / limit);
};

/**
 * Generate file name with timestamp
 */
const generateFileName = (originalName) => {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString('hex');
  const extension = originalName.split('.').pop();
  const nameWithoutExtension = originalName.substring(0, originalName.lastIndexOf('.'));
  const sanitizedName = nameWithoutExtension.replace(/[^a-zA-Z0-9]/g, '_');
  return `${sanitizedName}_${timestamp}_${randomString}.${extension}`;
};

/**
 * Get file extension from filename
 */
const getFileExtension = (filename) => {
  return filename.split('.').pop().toLowerCase();
};

/**
 * Check if file type is allowed
 */
const isAllowedFileType = (mimetype) => {
  return config.allowedFileTypes.includes(mimetype);
};

/**
 * Format date to ISO string
 */
const formatDate = (date) => {
  if (!date) return null;
  return new Date(date).toISOString();
};

/**
 * Calculate order total from items
 */
const calculateOrderTotal = (items) => {
  return items.reduce((total, item) => {
    return total + item.price * item.quantity;
  }, 0);
};

/**
 * Sleep/delay function
 */
const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

module.exports = {
  hashPassword,
  comparePassword,
  generateOTP,
  generateToken,
  formatPhoneNumber,
  isValidPhoneNumber,
  isValidEmail,
  sanitizeString,
  calculateTotalPages,
  generateFileName,
  getFileExtension,
  isAllowedFileType,
  formatDate,
  calculateOrderTotal,
  sleep,
};

