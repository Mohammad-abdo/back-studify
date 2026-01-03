/**
 * Delivery Routes
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

// Profile routes
router.get('/profile', deliveryController.getProfile);
router.put('/profile', validateBody(z.object({
  name: z.string().min(2).max(100).optional(),
  vehicleType: z.string().optional(),
  vehiclePlateNumber: z.string().optional(),
})), deliveryController.updateProfile);

router.put('/status', validateBody(z.object({
  status: z.enum(['AVAILABLE', 'ON_DELIVERY', 'OFFLINE']),
})), deliveryController.updateStatus);

// Assignments
router.get('/assignments', validateQuery(paginationSchema), deliveryController.getAssignments);
router.post('/orders/:orderId/pickup', deliveryController.markPickedUp);
router.post('/orders/:orderId/deliver', deliveryController.markDelivered);

// Location tracking
router.post('/location', validateBody(z.object({
  latitude: z.number(),
  longitude: z.number(),
  address: z.string().optional(),
})), deliveryController.updateLocation);

// Wallet
router.get('/wallet', deliveryController.getWallet);

module.exports = router;
