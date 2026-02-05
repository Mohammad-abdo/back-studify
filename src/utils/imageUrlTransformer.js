/**
 * Image URL Transformer
 * Transforms relative image URLs to full URLs for mobile responses
 */

const { getFullImageUrl, getFullImageUrls } = require('./helpers');

/**
 * Transform image URLs in an object/array recursively
 * Handles: avatarUrl, imageUrl, imageUrls fields
 */
const transformImageUrls = (data) => {
  if (!data) return data;

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => transformImageUrls(item));
  }

  // Handle objects
  if (typeof data === 'object' && data !== null) {
    const transformed = { ...data };

    // Transform avatarUrl (single URL)
    if (transformed.avatarUrl) {
      transformed.avatarUrl = getFullImageUrl(transformed.avatarUrl);
    }

    // Transform imageUrl (single URL)
    if (transformed.imageUrl) {
      transformed.imageUrl = getFullImageUrl(transformed.imageUrl);
    }

    // Transform imageUrls (array of URLs)
    if (transformed.imageUrls) {
      transformed.imageUrls = getFullImageUrls(transformed.imageUrls);
    }

    // Transform file URLs (normalize localhost to backend URL)
    if (transformed.uploadedFileUrl) {
      transformed.uploadedFileUrl = getFullImageUrl(transformed.uploadedFileUrl);
    }
    if (transformed.fileUrl) {
      transformed.fileUrl = getFullImageUrl(transformed.fileUrl);
    }

    // Recursively transform nested objects
    for (const key in transformed) {
      if (transformed[key] && typeof transformed[key] === 'object') {
        // Skip if it's a Date object
        if (transformed[key] instanceof Date) {
          continue;
        }
        transformed[key] = transformImageUrls(transformed[key]);
      }
    }

    return transformed;
  }

  return data;
};

module.exports = {
  transformImageUrls,
};

