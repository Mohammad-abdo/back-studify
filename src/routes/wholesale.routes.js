/**
 * Wholesale Order Routes
 * Accessible by CUSTOMER, INSTITUTE, and ADMIN user types.
 */

const express = require('express');
const router = express.Router();
const wholesaleController = require('../controllers/wholesale.controller');
const authenticate = require('../middleware/auth.middleware');
const { requireUserType } = require('../middleware/role.middleware');
const { validateBody, validateQuery } = require('../middleware/validation.middleware');
const { updateOrderStatusSchema, paginationSchema, uuidSchema } = require('../utils/validators');
const { z } = require('zod');

// All routes require authentication
router.use(authenticate);

// Customer, institute & admin routes
router.get('/', requireUserType('CUSTOMER', 'INSTITUTE', 'ADMIN'), validateQuery(paginationSchema.extend({
  status: z.enum(['CREATED', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']).optional(),
  customerId: uuidSchema.optional(),
  instituteOnly: z.enum(['true', 'false']).optional(),
})), wholesaleController.getMyWholesaleOrders);
router.get('/:id', requireUserType('CUSTOMER', 'INSTITUTE', 'ADMIN'), wholesaleController.getWholesaleOrderById);
router.post('/', requireUserType('CUSTOMER', 'INSTITUTE'), validateBody(z.object({
  items: z.array(z.object({
    productId: uuidSchema,
    quantity: z.number().int().positive(),
    price: z.number().nonnegative().optional(),
  })).min(1),
  address: z.string().max(2000).optional(),
})), wholesaleController.createWholesaleOrder);

// Admin routes (update order status)
router.put('/:id/status', requireUserType('ADMIN'), validateBody(updateOrderStatusSchema), wholesaleController.updateWholesaleOrderStatus);

module.exports = router;
