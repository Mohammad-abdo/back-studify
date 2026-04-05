const prisma = require('../config/database');

const findDashboardMetrics = () =>
  prisma.dashboardMetric.findMany({
    orderBy: { key: 'asc' },
  });

const findDashboardMetricByKey = (key) =>
  prisma.dashboardMetric.findUnique({
    where: { key },
  });

const upsertDashboardMetric = ({ key, value, metadata }) =>
  prisma.dashboardMetric.upsert({
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

const deleteDashboardMetric = (key) =>
  prisma.dashboardMetric.delete({
    where: { key },
  });

module.exports = {
  findDashboardMetrics,
  findDashboardMetricByKey,
  upsertDashboardMetric,
  deleteDashboardMetric,
};
