/**
 * Cart Routes
 * Handles cart-related routes
 */

const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart.controller');
const authenticate = require('../middleware/auth.middleware');
const { validateBody } = require('../middleware/validation.middleware');
const { z } = require('zod');

// All routes require authentication
router.use(authenticate);

// Get cart
router.get('/', cartController.getCart);

// Add item to cart
router.post('/items', validateBody(z.object({
  referenceType: z.enum(['BOOK', 'PRODUCT', 'MATERIAL', 'PRINT_OPTION']),
  referenceId: z.string().uuid(),
  quantity: z.number().int().positive().optional().default(1),
})), cartController.addToCart);

// Update cart item
router.put('/items/:id', validateBody(z.object({
  quantity: z.number().int().positive(),
})), cartController.updateCartItem);

// Remove item from cart
router.delete('/items/:id', cartController.removeFromCart);

// Clear cart
router.delete('/', cartController.clearCart);

module.exports = router;


