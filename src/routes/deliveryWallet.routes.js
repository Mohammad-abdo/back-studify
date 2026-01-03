/**
 * Delivery Wallet Routes (Admin only)
 */

const express = require('express');
const router = express.Router();
const deliveryWalletController = require('../controllers/deliveryWallet.controller');
const authenticate = require('../middleware/auth.middleware');
const { requireUserType } = require('../middleware/role.middleware');
const { validateBody, validateQuery } = require('../middleware/validation.middleware');
const { paginationSchema } = require('../utils/validators');
const { z } = require('zod');

// All routes require authentication and admin access
router.use(authenticate);
router.use(requireUserType('ADMIN'));

router.get('/', validateQuery(paginationSchema), deliveryWalletController.getDeliveryWallets);
router.get('/:id', deliveryWalletController.getDeliveryWalletById);
router.put('/:id', validateBody(z.object({
  balance: z.number().nonnegative(),
})), deliveryWalletController.updateDeliveryWallet);

module.exports = router;


