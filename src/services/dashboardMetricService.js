const dashboardMetricRepository = require('../repositories/dashboardMetricRepository');
const { NotFoundError } = require('../utils/errors');

const getDashboardMetrics = async () =>
  dashboardMetricRepository.findDashboardMetrics();

const getDashboardMetricByKey = async ({ key }) => {
  const metric = await dashboardMetricRepository.findDashboardMetricByKey(key);

  if (!metric) {
    throw new NotFoundError('Dashboard metric not found');
  }

  return metric;
};

const upsertDashboardMetric = async ({ key, value, metadata }) =>
  dashboardMetricRepository.upsertDashboardMetric({ key, value, metadata });

const deleteDashboardMetric = async ({ key }) => {
  const existingMetric = await dashboardMetricRepository.findDashboardMetricByKey(key);

  if (!existingMetric) {
    throw new NotFoundError('Dashboard metric not found');
  }

  await dashboardMetricRepository.deleteDashboardMetric(key);
};

module.exports = {
  getDashboardMetrics,
  getDashboardMetricByKey,
  upsertDashboardMetric,
  deleteDashboardMetric,
};
