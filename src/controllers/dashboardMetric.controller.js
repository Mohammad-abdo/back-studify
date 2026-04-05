/**
 * Dashboard Metric Controller
 * Handles dashboard metric-related HTTP requests (Admin only)
 */

const dashboardMetricService = require('../services/dashboardMetricService');
const { sendSuccess } = require('../utils/response');

const getDashboardMetrics = async (req, res, next) => {
  try {
    const metrics = await dashboardMetricService.getDashboardMetrics();
    sendSuccess(res, metrics, 'Dashboard metrics retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getDashboardMetricByKey = async (req, res, next) => {
  try {
    const metric = await dashboardMetricService.getDashboardMetricByKey({
      key: req.params.key,
    });

    sendSuccess(res, metric, 'Dashboard metric retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const upsertDashboardMetric = async (req, res, next) => {
  try {
    const metric = await dashboardMetricService.upsertDashboardMetric(req.body);
    sendSuccess(res, metric, 'Dashboard metric updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteDashboardMetric = async (req, res, next) => {
  try {
    await dashboardMetricService.deleteDashboardMetric({
      key: req.params.key,
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
