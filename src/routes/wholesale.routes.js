/**
 * Wholesale Order Routes
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

// Customer routes
router.get('/', requireUserType('CUSTOMER'), validateQuery(paginationSchema), wholesaleController.getMyWholesaleOrders);
router.get('/:id', requireUserType('CUSTOMER'), wholesaleController.getWholesaleOrderById);
router.post('/', requireUserType('CUSTOMER'), validateBody(z.object({
  items: z.array(z.object({
    productId: uuidSchema,
    quantity: z.number().int().positive(),
    price: z.number().nonnegative(),
  })).min(1),
})), wholesaleController.createWholesaleOrder);

// Admin routes (update order status)
router.put('/:id/status', requireUserType('ADMIN'), validateBody(updateOrderStatusSchema), wholesaleController.updateWholesaleOrderStatus);

module.exports = router;
