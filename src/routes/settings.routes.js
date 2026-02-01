/**
 * Settings Routes (Admin only)
 */

const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settings.controller');
const authenticate = require('../middleware/auth.middleware');
const { requireUserType } = require('../middleware/role.middleware');
const { validateBody } = require('../middleware/validation.middleware');
const { z } = require('zod');

const financialSettingsSchema = z.object({
  taxRate: z.number().min(0).max(100).optional(),
  commissionRate: z.number().min(0).max(100).optional(),
  shippingValue: z.number().min(0).optional(),
  deliveryCommissionRate: z.number().min(0).max(100).optional(),
  printCenterCommissionRate: z.number().min(0).max(100).optional(),
});

router.use(authenticate);
router.use(requireUserType('ADMIN'));

router.get('/financial', settingsController.getFinancialSettings);
router.put('/financial', validateBody(financialSettingsSchema), settingsController.updateFinancialSettings);

module.exports = router;
