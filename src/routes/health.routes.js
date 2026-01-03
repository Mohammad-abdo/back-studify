/**
 * Health Check Routes
 */

const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response');
const { HTTP_STATUS } = require('../utils/constants');

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Server health check
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Server is running
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
router.get('/', (req, res) => {
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

/**
 * @swagger
 * /health/database:
 *   get:
 *     summary: Database health check
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Database is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Database connection is healthy
 *                 database:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: connected
 *                     responseTime:
 *                       type: number
 *                       example: 15.5
 *       503:
 *         description: Database connection failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

