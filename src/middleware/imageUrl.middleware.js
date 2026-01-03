/**
 * Image URL Middleware
 * Transforms relative image URLs to full URLs for mobile responses
 */

const { transformImageUrls } = require('../utils/imageUrlTransformer');

/**
 * Middleware to transform image URLs in response data
 */
const transformImageUrlsMiddleware = (req, res, next) => {
  // Store original json method
  const originalJson = res.json;

  // Override json method to transform data before sending
  res.json = function (data) {
    if (!data) {
      return originalJson.call(this, data);
    }

    // Transform image URLs in the response data
    // Handle standard response format: { success, message, data, ... }
    if (data.data !== undefined) {
      data.data = transformImageUrls(data.data);
    }
    
    // Also transform the entire response object (for edge cases)
    // This handles nested objects like pagination data arrays
    const transformed = transformImageUrls(data);

    // Call original json method with transformed data
    return originalJson.call(this, transformed);
  };

  next();
};

module.exports = {
  transformImageUrlsMiddleware,
};

