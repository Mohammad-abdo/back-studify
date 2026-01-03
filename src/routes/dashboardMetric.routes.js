/**
 * Dashboard Metric Routes (Admin only)
 */

const express = require('express');
const router = express.Router();
const dashboardMetricController = require('../controllers/dashboardMetric.controller');
const authenticate = require('../middleware/auth.middleware');
const { requireUserType } = require('../middleware/role.middleware');
const { validateBody } = require('../middleware/validation.middleware');
const { z } = require('zod');

// All routes require authentication and admin access
router.use(authenticate);
router.use(requireUserType('ADMIN'));

router.get('/', dashboardMetricController.getDashboardMetrics);
router.get('/:key', dashboardMetricController.getDashboardMetricByKey);
router.post('/', validateBody(z.object({
  key: z.string().min(1).max(100),
  value: z.string(),
  metadata: z.any().optional(),
})), dashboardMetricController.upsertDashboardMetric);
router.put('/:key', validateBody(z.object({
  value: z.string().optional(),
  metadata: z.any().optional(),
})), dashboardMetricController.upsertDashboardMetric);
router.delete('/:key', dashboardMetricController.deleteDashboardMetric);

module.exports = router;


