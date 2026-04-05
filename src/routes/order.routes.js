/**
 * Order Routes
 */

const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const authenticate = require('../middleware/auth.middleware');
const { requireUserType } = require('../middleware/role.middleware');
const { validateBody, validateQuery } = require('../middleware/validation.middleware');
const { createOrderSchema, updateOrderStatusSchema, paginationSchema } = require('../utils/validators');
const { z } = require('zod');

// All routes require authentication
router.use(authenticate);

router.get('/', validateQuery(paginationSchema), orderController.getMyOrders);
router.get('/active', validateQuery(paginationSchema), orderController.getActiveOrders);
router.get('/:id', orderController.getOrderById);
router.post('/', validateBody(createOrderSchema), orderController.createOrder);

/**
 * Confirm payment for an order (CASH | CREDIT; later PAYMENT_LINK for web/gateway).
 * POST /api/orders/:id/confirm-payment
 * Body: { "paymentMethod": "CASH" | "CREDIT" }
 */
router.post(
  '/:id/confirm-payment',
  validateBody(z.object({
    paymentMethod: z.enum(['CASH', 'CREDIT', 'PAYMENT_LINK']),
  })),
  orderController.confirmPayment
);

router.post('/:id/cancel', orderController.cancelOrder);

router.put('/:id/status', requireUserType('ADMIN'), validateBody(updateOrderStatusSchema), orderController.updateOrderStatus);

module.exports = router;
