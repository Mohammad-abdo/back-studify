/**
 * Report Routes
 */

const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const authenticate = require('../middleware/auth.middleware');
const { requireUserType } = require('../middleware/role.middleware');
const { validateBody, validateQuery } = require('../middleware/validation.middleware');
const { paginationSchema } = require('../utils/validators');
const { z } = require('zod');

// All routes require authentication and admin access
router.use(authenticate);
router.use(requireUserType('ADMIN'));

router.get('/', validateQuery(paginationSchema), reportController.getReports);
router.get('/:id', reportController.getReportById);
router.post('/', validateBody(z.object({
  name: z.string().min(2).max(200),
  fileUrl: z.string().url(),
})), reportController.createReport);
router.put('/:id', validateBody(z.object({
  name: z.string().min(2).max(200).optional(),
  fileUrl: z.string().url().optional(),
})), reportController.updateReport);
router.delete('/:id', reportController.deleteReport);

module.exports = router;


