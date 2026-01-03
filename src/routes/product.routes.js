/**
 * Product Routes
 */

const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const authenticate = require('../middleware/auth.middleware');
const { requireUserType } = require('../middleware/role.middleware');
const { validateBody, validateQuery } = require('../middleware/validation.middleware');
const { paginationSchema, uuidSchema } = require('../utils/validators');
const { z } = require('zod');

// Public routes (no auth required for viewing)
router.get('/', validateQuery(paginationSchema), productController.getProducts);
router.get('/:id', productController.getProductById);

// Protected routes (Admin only)
router.use(authenticate);
router.use(requireUserType('ADMIN'));

router.post('/', validateBody(z.object({
  name: z.string().min(2).max(200),
  description: z.string().min(10),
  imageUrls: z.array(z.string().url()).optional(),
  categoryId: uuidSchema,
})), productController.createProduct);

router.put('/:id', validateBody(z.object({
  name: z.string().min(2).max(200).optional(),
  description: z.string().min(10).optional(),
  imageUrls: z.array(z.string().url()).optional(),
  categoryId: uuidSchema.optional(),
})), productController.updateProduct);

router.delete('/:id', productController.deleteProduct);

router.post('/:id/pricing', validateBody(z.object({
  minQuantity: z.number().int().positive(),
  price: z.number().nonnegative(),
})), productController.addProductPricing);

module.exports = router;
