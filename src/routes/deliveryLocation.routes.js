/**
 * Delivery Location Routes (Admin only for viewing)
 */

const express = require('express');
const router = express.Router();
const deliveryLocationController = require('../controllers/deliveryLocation.controller');
const authenticate = require('../middleware/auth.middleware');
const { requireUserType } = require('../middleware/role.middleware');
const { validateQuery } = require('../middleware/validation.middleware');
const { paginationSchema } = require('../utils/validators');

// All routes require authentication and admin access
router.use(authenticate);
router.use(requireUserType('ADMIN'));

router.get('/', validateQuery(paginationSchema), deliveryLocationController.getDeliveryLocations);
router.get('/:id', deliveryLocationController.getDeliveryLocationById);
router.delete('/:id', deliveryLocationController.deleteDeliveryLocation);

module.exports = router;


