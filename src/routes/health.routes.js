/**
 * Health Check Routes
 */

const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response');
const { HTTP_STATUS } = require('../utils/constants');

router.get('/', (req, res) => {
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

router.get('/database', async (req, res) => {
  try {
    const startTime = Date.now();

    // Test database connection
    await prisma.$queryRaw`SELECT 1`;

    const responseTime = Date.now() - startTime;

    sendSuccess(res, {
      status: 'connected',
      responseTime: `${responseTime}ms`,
    }, 'Database connection is healthy');
  } catch (error) {
    console.error('Database health check failed:', error);
    sendError(
      res,
      'Database connection failed',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'DATABASE_ERROR',
      { error: error.message }
    );
  }
});

module.exports = router;
