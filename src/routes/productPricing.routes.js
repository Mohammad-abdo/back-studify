/**
 * Product Pricing Routes
 */

const express = require('express');
const router = express.Router();
const productPricingController = require('../controllers/productPricing.controller');
const authenticate = require('../middleware/auth.middleware');
const { requireUserType } = require('../middleware/role.middleware');
const { validateBody, validateQuery } = require('../middleware/validation.middleware');
const { paginationSchema, uuidSchema } = require('../utils/validators');
const { z } = require('zod');

// All routes require authentication and admin access
router.use(authenticate);
router.use(requireUserType('ADMIN'));

router.get('/', validateQuery(paginationSchema), productPricingController.getProductPricings);
router.get('/:id', productPricingController.getProductPricingById);
router.post('/', validateBody(z.object({
  productId: uuidSchema,
  minQuantity: z.number().int().positive(),
  price: z.number().nonnegative(),
})), productPricingController.createProductPricing);
router.put('/:id', validateBody(z.object({
  minQuantity: z.number().int().positive().optional(),
  price: z.number().nonnegative().optional(),
})), productPricingController.updateProductPricing);
router.delete('/:id', productPricingController.deleteProductPricing);

module.exports = router;


