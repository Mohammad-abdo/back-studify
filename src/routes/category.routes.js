/**
 * Category Routes
 */

const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');
const authenticate = require('../middleware/auth.middleware');
const { requireUserType } = require('../middleware/role.middleware');
const { optionalAuthenticate } = require('../middleware/institute.middleware');
const { validateBody, validateQuery } = require('../middleware/validation.middleware');
const { z } = require('zod');
const { uuidSchema } = require('../utils/validators');

// Public routes (with optional auth for institute filtering)
router.get('/books', categoryController.getBookCategories);
router.get('/products', optionalAuthenticate, validateQuery(z.object({
  collegeId: uuidSchema.optional().nullable(),
  isInstituteCategory: z.enum(['true', 'false']).optional(),
})), categoryController.getProductCategories);
router.get('/materials', optionalAuthenticate, categoryController.getMaterialCategories);

// Protected routes (Admin only)
router.use(authenticate);
router.use(requireUserType('ADMIN'));

// Book categories
router.post('/books', validateBody(z.object({
  name: z.string().min(2).max(200),
})), categoryController.createBookCategory);

router.put('/books/:id', validateBody(z.object({
  name: z.string().min(2).max(200),
})), categoryController.updateBookCategory);

router.delete('/books/:id', categoryController.deleteBookCategory);

// Product categories (supports isInstituteCategory)
router.post('/products', validateBody(z.object({
  name: z.string().min(2).max(200),
  isInstituteCategory: z.boolean().optional().default(false),
  collegeId: uuidSchema.optional().nullable(),
})), categoryController.createProductCategory);

router.put('/products/:id', validateBody(z.object({
  name: z.string().min(2).max(200).optional(),
  isInstituteCategory: z.boolean().optional(),
  collegeId: uuidSchema.optional().nullable(),
})), categoryController.updateProductCategory);

router.delete('/products/:id', categoryController.deleteProductCategory);

module.exports = router;
