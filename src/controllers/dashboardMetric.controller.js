/**
 * Dashboard Metric Controller
 * Handles dashboard metric-related HTTP requests (Admin only)
 */

const prisma = require('../config/database');
const { sendSuccess, sendPaginated, getPaginationParams, buildPagination } = require('../utils/response');
const { NotFoundError } = require('../utils/errors');

/**
 * Get all dashboard metrics
 */
const getDashboardMetrics = async (req, res, next) => {
  try {
    const metrics = await prisma.dashboardMetric.findMany({
      orderBy: { key: 'asc' },
    });

    sendSuccess(res, metrics, 'Dashboard metrics retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get dashboard metric by key
 */
const getDashboardMetricByKey = async (req, res, next) => {
  try {
    const { key } = req.params;

    const metric = await prisma.dashboardMetric.findUnique({
      where: { key },
    });

    if (!metric) {
      throw new NotFoundError('Dashboard metric not found');
    }

    sendSuccess(res, metric, 'Dashboard metric retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Create or update dashboard metric (Admin only)
 */
const upsertDashboardMetric = async (req, res, next) => {
  try {
    const { key, value, metadata } = req.body;

    const metric = await prisma.dashboardMetric.upsert({
      where: { key },
      update: {
        value,
        metadata: metadata || null,
      },
      create: {
        key,
        value,
        metadata: metadata || null,
      },
    });

    sendSuccess(res, metric, 'Dashboard metric updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete dashboard metric (Admin only)
 */
const deleteDashboardMetric = async (req, res, next) => {
  try {
    const { key } = req.params;

    const existingMetric = await prisma.dashboardMetric.findUnique({
      where: { key },
    });

    if (!existingMetric) {
      throw new NotFoundError('Dashboard metric not found');
    }

    await prisma.dashboardMetric.delete({
      where: { key },
    });

    sendSuccess(res, null, 'Dashboard metric deleted successfully', 204);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardMetrics,
  getDashboardMetricByKey,
  upsertDashboardMetric,
  deleteDashboardMetric,
};


