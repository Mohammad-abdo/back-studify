/**
 * Delivery Assignment Routes (Admin only)
 */

const express = require('express');
const router = express.Router();
const deliveryAssignmentController = require('../controllers/deliveryAssignment.controller');
const authenticate = require('../middleware/auth.middleware');
const { requireUserType } = require('../middleware/role.middleware');
const { validateBody, validateQuery } = require('../middleware/validation.middleware');
const { paginationSchema, uuidSchema } = require('../utils/validators');
const { z } = require('zod');

// All routes require authentication and admin access
router.use(authenticate);
router.use(requireUserType('ADMIN'));

router.get('/', validateQuery(paginationSchema), deliveryAssignmentController.getDeliveryAssignments);
router.get('/:id', deliveryAssignmentController.getDeliveryAssignmentById);
router.post('/', validateBody(z.object({
  orderId: uuidSchema,
  deliveryId: uuidSchema,
  status: z.enum(['CREATED', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']).optional(),
})), deliveryAssignmentController.createDeliveryAssignment);
router.put('/:id', validateBody(z.object({
  status: z.enum(['CREATED', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']).optional(),
  pickedUpAt: z.string().datetime().optional().nullable(),
  deliveredAt: z.string().datetime().optional().nullable(),
})), deliveryAssignmentController.updateDeliveryAssignment);
router.delete('/:id', deliveryAssignmentController.deleteDeliveryAssignment);

module.exports = router;


