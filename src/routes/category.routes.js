/**
 * Category Routes
 */

const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');
const authenticate = require('../middleware/auth.middleware');
const { requireUserType } = require('../middleware/role.middleware');
const { validateBody } = require('../middleware/validation.middleware');
const { z } = require('zod');

// Public routes (for viewing)
router.get('/books', categoryController.getBookCategories);
router.get('/products', categoryController.getProductCategories);

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

// Product categories
router.post('/products', validateBody(z.object({
  name: z.string().min(2).max(200),
})), categoryController.createProductCategory);

router.put('/products/:id', validateBody(z.object({
  name: z.string().min(2).max(200),
})), categoryController.updateProductCategory);

router.delete('/products/:id', categoryController.deleteProductCategory);

module.exports = router;
