/**
 * Order Routes
 * 
 * @swagger
 * tags:
 *   name: Orders
 *   description: Order processing, history and status management
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

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Get orders for the authenticated user
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: List of user orders
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Paginated'
 *                 - properties:
 *                     data: { type: array, items: { $ref: '#/components/schemas/Order' } }
 */
router.get('/', validateQuery(paginationSchema), orderController.getMyOrders);

/**
 * @swagger
 * /orders/active:
 *   get:
 *     summary: Get currently active orders (PROCESSING, SHIPPED)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of active orders
 */
router.get('/active', validateQuery(paginationSchema), orderController.getActiveOrders);

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     summary: Get details of a specific order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Order details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/Order' }
 */
router.get('/:id', orderController.getOrderById);

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Create a new order from cart or specific items
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderType]
 *             properties:
 *               orderType: { type: string, enum: [PRODUCT, CONTENT, PRINT] }
 *               address: { type: string }
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [referenceType, referenceId, quantity]
 *                   properties:
 *                     referenceType: { type: string, enum: [BOOK, PRODUCT, MATERIAL, PRINT_OPTION] }
 *                     referenceId: { type: string, format: uuid }
 *                     quantity: { type: integer, minimum: 1 }
 *     responses:
 *       201:
 *         description: Order created
 */
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

/**
 * @swagger
 * /orders/{id}/cancel:
 *   post:
 *     summary: Cancel an order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Order cancelled
 */
router.post('/:id/cancel', orderController.cancelOrder);

/**
 * @swagger
 * /orders/{id}/status:
 *   put:
 *     summary: Update order status (Admin only)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [PAID, PROCESSING, SHIPPED, DELIVERED, CANCELLED] }
 *     responses:
 *       200:
 *         description: Status updated
 */
router.put('/:id/status', requireUserType('ADMIN'), validateBody(updateOrderStatusSchema), orderController.updateOrderStatus);

module.exports = router;
