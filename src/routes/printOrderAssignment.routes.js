/**
 * Print Order Assignment Routes
 * Admin: list all assignments. Print center: list my assignments, update status.
 */

const express = require('express');
const router = express.Router();
const printOrderAssignmentController = require('../controllers/printOrderAssignment.controller');
const authenticate = require('../middleware/auth.middleware');
const { requireUserType } = require('../middleware/role.middleware');
const { validateBody } = require('../middleware/validation.middleware');
const { z } = require('zod');

/**
 * GET /track/:orderId - Public order tracking endpoint
 */
router.get('/track/:orderId', printOrderAssignmentController.trackOrder);

router.use(authenticate);

/**
 * GET / - Admin: all assignments. Print center: my assignments only
 */
router.get(
  '/',
  requireUserType('ADMIN', 'PRINT_CENTER'),
  (req, res, next) => {
    if (req.userType === 'ADMIN') {
      return printOrderAssignmentController.getAllAssignments(req, res, next);
    }
    return printOrderAssignmentController.getMyAssignments(req, res, next);
  }
);

/**
 * GET /order/:orderId - Get assignment by order ID (tracking - order owner, admin, or assigned print center)
 */
router.get('/order/:orderId', printOrderAssignmentController.getAssignmentByOrderId);

/**
 * GET /:id/delivery-tracking - Get delivery tracking for this print assignment (Print center or Admin)
 */
router.get(
  '/:id/delivery-tracking',
  requireUserType('ADMIN', 'PRINT_CENTER'),
  printOrderAssignmentController.getDeliveryTracking
);

/**
 * GET /:id - Get assignment by ID
 */
router.get('/:id', printOrderAssignmentController.getAssignmentById);

/**
 * PATCH /:id/status - Update assignment status (Print center or Admin)
 */
router.patch(
  '/:id/status',
  requireUserType('ADMIN', 'PRINT_CENTER'),
  validateBody(z.object({
    status: z.enum(['PENDING', 'ACCEPTED', 'PRINTING', 'READY_FOR_PICKUP', 'COMPLETED', 'CANCELLED']),
    notes: z.string().max(500).optional().nullable(),
  })),
  printOrderAssignmentController.updateAssignmentStatus
);

module.exports = router;
