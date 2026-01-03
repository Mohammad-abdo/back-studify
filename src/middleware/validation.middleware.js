/**
 * Validation Middleware
 * Validates request data using Zod schemas
 */

const { ValidationError } = require('../utils/errors');

/**
 * Validate request data with Zod schema
 */
const validate = (schema) => {
  return (req, res, next) => {
    try {
      // Validate based on schema structure
      let dataToValidate = {};

      if (schema.shape?.body) {
        dataToValidate.body = req.body;
      }
      if (schema.shape?.query) {
        dataToValidate.query = req.query;
      }
      if (schema.shape?.params) {
        dataToValidate.params = req.params;
      }

      // If schema doesn't have shape, validate body directly
      if (!schema.shape) {
        dataToValidate = req.body;
      }

      const result = schema.parse(dataToValidate);

      // Attach validated data to request
      if (schema.shape) {
        if (result.body) req.body = result.body;
        if (result.query) req.query = result.query;
        if (result.params) req.params = result.params;
      } else {
        req.body = result;
      }

      next();
    } catch (error) {
      if (error.name === 'ZodError') {
        next(error); // Pass to error handler
      } else {
        next(new ValidationError(error.message));
      }
    }
  };
};

/**
 * Simple validation for body only
 */
const validateBody = (schema) => {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error.name === 'ZodError') {
        next(error);
      } else {
        next(new ValidationError(error.message));
      }
    }
  };
};

/**
 * Simple validation for query only
 */
const validateQuery = (schema) => {
  return (req, res, next) => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (error) {
      if (error.name === 'ZodError') {
        next(error);
      } else {
        next(new ValidationError(error.message));
      }
    }
  };
};

/**
 * Simple validation for params only
 */
const validateParams = (schema) => {
  return (req, res, next) => {
    try {
      req.params = schema.parse(req.params);
      next();
    } catch (error) {
      if (error.name === 'ZodError') {
        next(error);
      } else {
        next(new ValidationError(error.message));
      }
    }
  };
};

module.exports = {
  validate,
  validateBody,
  validateQuery,
  validateParams,
};

