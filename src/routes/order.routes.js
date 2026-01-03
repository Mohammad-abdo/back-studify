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

// All routes require authentication
router.use(authenticate);

// User routes
router.get('/', validateQuery(paginationSchema), orderController.getMyOrders);
router.get('/:id', orderController.getOrderById);
router.post('/', validateBody(createOrderSchema), orderController.createOrder);
router.post('/:id/cancel', orderController.cancelOrder);

// Admin routes (update order status)
router.put('/:id/status', requireUserType('ADMIN'), validateBody(updateOrderStatusSchema), orderController.updateOrderStatus);

module.exports = router;
