/**
 * Delivery Routes
 * 
 * @swagger
 * tags:
 *   name: Delivery
 *   description: Delivery personnel operations, tracking and status management
 */

const express = require('express');
const router = express.Router();
const deliveryController = require('../controllers/delivery.controller');
const authenticate = require('../middleware/auth.middleware');
const { requireUserType } = require('../middleware/role.middleware');
const { validateBody, validateQuery } = require('../middleware/validation.middleware');
const { paginationSchema } = require('../utils/validators');
const { z } = require('zod');

// All routes require delivery authentication
router.use(authenticate);
router.use(requireUserType('DELIVERY'));

/**
 * @swagger
 * /delivery/profile:
 *   get:
 *     summary: Get delivery profile data
 *     tags: [Delivery]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/Delivery' }
 */
router.get('/profile', deliveryController.getProfile);

/**
 * @swagger
 * /delivery/profile:
 *   put:
 *     summary: Update delivery profile details
 *     tags: [Delivery]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               vehicleType: { type: string }
 *               vehiclePlateNumber: { type: string }
 *     responses:
 *       200:
 *         description: Profile updated
 */
router.put('/profile', validateBody(z.object({
  name: z.string().min(2).max(100).optional(),
  vehicleType: z.string().optional(),
  vehiclePlateNumber: z.string().optional(),
})), deliveryController.updateProfile);

/**
 * @swagger
 * /delivery/status:
 *   put:
 *     summary: Update availability status
 *     tags: [Delivery]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [AVAILABLE, ON_DELIVERY, OFFLINE] }
 *     responses:
 *       200:
 *         description: Status updated
 */
router.put('/status', validateBody(z.object({
  status: z.enum(['AVAILABLE', 'ON_DELIVERY', 'OFFLINE']),
})), deliveryController.updateStatus);

/**
 * @swagger
 * /delivery/assignments:
 *   get:
 *     summary: Get active and past delivery assignments
 *     tags: [Delivery]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of assignments
 */
router.get('/assignments', validateQuery(paginationSchema), deliveryController.getAssignments);

/**
 * @swagger
 * /delivery/orders/{orderId}/pickup:
 *   post:
 *     summary: Mark an order as picked up
 *     tags: [Delivery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Order marked as picked up
 */
router.post('/orders/:orderId/pickup', deliveryController.markPickedUp);

/**
 * @swagger
 * /delivery/orders/{orderId}/deliver:
 *   post:
 *     summary: Mark an order as delivered
 *     tags: [Delivery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Order marked as delivered
 */
router.post('/orders/:orderId/deliver', deliveryController.markDelivered);

/**
 * @swagger
 * /delivery/location:
 *   post:
 *     summary: Update real-time GPS location
 *     tags: [Delivery]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [latitude, longitude]
 *             properties:
 *               latitude: { type: number }
 *               longitude: { type: number }
 *               address: { type: string }
 *     responses:
 *       200:
 *         description: Location updated
 */
router.post('/location', validateBody(z.object({
  latitude: z.number(),
  longitude: z.number(),
  address: z.string().optional(),
})), deliveryController.updateLocation);

/**
 * @swagger
 * /delivery/wallet:
 *   get:
 *     summary: Get delivery agent wallet balance
 *     tags: [Delivery]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wallet data
 */
router.get('/wallet', deliveryController.getWallet);

module.exports = router;
