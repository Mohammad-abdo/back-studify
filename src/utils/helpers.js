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
  // Return fixed OTP for now as requested
  return '123456';
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
  const phoneRegex = /^\+?[0-9]\d{1,14}$/;
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
 * Haversine distance in km between two lat/lng points
 */
const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Sleep/delay function
 */
const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Convert relative image URL to full URL and normalize localhost to backend URL.
 * Handles:
 * - Relative paths like "/uploads/file.jpg" or "uploads/file.jpg"
 * - Full URLs: if host is localhost/127.0.0.1, replace origin with config.backendUrl (for server deployment)
 * - Null/undefined values (returns null)
 */
const getFullImageUrl = (imageUrl) => {
  if (!imageUrl) return null;

  if (typeof imageUrl === 'string' && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))) {
    try {
      const u = new URL(imageUrl);
      if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') {
        const base = new URL(config.backendUrl);
        u.protocol = base.protocol;
        u.hostname = base.hostname;
        u.port = base.port;
        return u.toString();
      }
      return imageUrl;
    } catch {
      return imageUrl;
    }
  }

  // Relative path: convert to full URL
  if (typeof imageUrl === 'string') {
    const cleanPath = imageUrl.startsWith('/') ? imageUrl.substring(1) : imageUrl;
    return `${config.backendUrl}/${cleanPath}`;
  }

  return imageUrl;
};

/**
 * Convert array of image URLs to full URLs
 */
const getFullImageUrls = (imageUrls) => {
  if (!imageUrls) return null;
  if (!Array.isArray(imageUrls)) return imageUrls;

  return imageUrls.map(url => getFullImageUrl(url));
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
  calculateDistanceKm,
  sleep,
  getFullImageUrl,
  getFullImageUrls,
};

