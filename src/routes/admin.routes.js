/**
 * Admin Routes
 */

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const authenticate = require('../middleware/auth.middleware');
const { requireUserType } = require('../middleware/role.middleware');
const { validateQuery, validateBody } = require('../middleware/validation.middleware');
const { paginationSchema } = require('../utils/validators');
const { z } = require('zod');

// All routes require admin authentication
router.use(authenticate);
router.use(requireUserType('ADMIN'));

// Approval routes
router.post('/doctors/:id/approve', adminController.approveDoctor);
router.post('/doctors/:id/reject', adminController.rejectDoctor);
router.post('/books/:id/approve', adminController.approveBook);
router.post('/books/:id/reject', adminController.rejectBook);

// Pending approvals
router.get('/approvals', validateQuery(z.object({
  type: z.enum(['DOCTOR', 'BOOK']),
})), adminController.getPendingApprovals);

// Operation logs
router.get('/logs', validateQuery(paginationSchema), adminController.getOperationLogs);

// Dashboard
router.get('/dashboard/stats', adminController.getDashboardStats);

// Users management
router.get('/users', validateQuery(paginationSchema.extend({
  type: z.enum(['STUDENT', 'DOCTOR', 'DELIVERY', 'CUSTOMER', 'ADMIN']).optional(),
  isActive: z.enum(['true', 'false']).optional(),
  search: z.string().optional(),
})), adminController.getUsers);
router.get('/users/:id', adminController.getUserById);
router.put('/users/:id', validateBody(z.object({
  phone: z.string().optional(),
  email: z.string().email().optional().nullable(),
  isActive: z.boolean().optional(),
})), adminController.updateUser);

// Reviews management
router.get('/reviews', validateQuery(paginationSchema.extend({
  targetType: z.enum(['BOOK', 'PRODUCT']).optional(),
})), adminController.getReviews);

module.exports = router;
