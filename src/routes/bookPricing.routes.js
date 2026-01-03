/**
 * Book Pricing Routes
 */

const express = require('express');
const router = express.Router();
const bookPricingController = require('../controllers/bookPricing.controller');
const authenticate = require('../middleware/auth.middleware');
const { requireUserType } = require('../middleware/role.middleware');
const { validateBody, validateQuery } = require('../middleware/validation.middleware');
const { paginationSchema, uuidSchema } = require('../utils/validators');
const { z } = require('zod');

// All routes require authentication
router.use(authenticate);

router.get('/', validateQuery(paginationSchema), bookPricingController.getBookPricings);
router.get('/:id', bookPricingController.getBookPricingById);
router.post('/', requireUserType('DOCTOR'), validateBody(z.object({
  bookId: uuidSchema,
  accessType: z.enum(['READ', 'BUY', 'PRINT']),
  price: z.number().nonnegative(),
})), bookPricingController.createBookPricing);
router.put('/:id', requireUserType('DOCTOR'), validateBody(z.object({
  price: z.number().nonnegative().optional(),
  approvalStatus: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
})), bookPricingController.updateBookPricing);
router.delete('/:id', requireUserType('DOCTOR'), bookPricingController.deleteBookPricing);

module.exports = router;

