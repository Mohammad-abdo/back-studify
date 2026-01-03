/**
 * Response Helpers
 * Standardized API response formatting
 */

const { HTTP_STATUS } = require('./constants');

/**
 * Send success response
 */
const sendSuccess = (res, data = null, message = 'Success', statusCode = HTTP_STATUS.OK) => {
  const response = {
    success: true,
    message,
    ...(data !== null && { data }),
  };

  return res.status(statusCode).json(response);
};

/**
 * Send error response
 */
const sendError = (res, message = 'Internal server error', statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR, code = null, details = null) => {
  const response = {
    success: false,
    error: {
      message,
      ...(code && { code }),
      ...(details && { details }),
    },
  };

  return res.status(statusCode).json(response);
};

/**
 * Send paginated response
 */
const sendPaginated = (res, data, pagination, message = 'Success', statusCode = HTTP_STATUS.OK) => {
  const response = {
    success: true,
    message,
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages: Math.ceil(pagination.total / pagination.limit),
      hasNext: pagination.page * pagination.limit < pagination.total,
      hasPrev: pagination.page > 1,
    },
  };

  return res.status(statusCode).json(response);
};

/**
 * Calculate pagination parameters
 */
const getPaginationParams = (page, limit, defaultLimit = 10, maxLimit = 100) => {
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.min(maxLimit, Math.max(1, parseInt(limit, 10) || defaultLimit));
  const skip = (parsedPage - 1) * parsedLimit;

  return {
    page: parsedPage,
    limit: parsedLimit,
    skip,
  };
};

/**
 * Build pagination object for response
 */
const buildPagination = (page, limit, total) => {
  return {
    page,
    limit,
    total,
  };
};

module.exports = {
  sendSuccess,
  sendError,
  sendPaginated,
  getPaginationParams,
  buildPagination,
};

