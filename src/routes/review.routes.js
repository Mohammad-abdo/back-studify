/**
 * Review Routes
 */

const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');
const authenticate = require('../middleware/auth.middleware');
const { requireUserType } = require('../middleware/role.middleware');
const { validateBody, validateQuery } = require('../middleware/validation.middleware');
const { createReviewSchema, paginationSchema } = require('../utils/validators');
const { z } = require('zod');

// Public routes (viewing reviews)
router.get('/', validateQuery(paginationSchema.extend({
  targetId: z.string().uuid(),
  targetType: z.enum(['BOOK', 'PRODUCT']),
})), reviewController.getReviews);

// Protected routes
router.use(authenticate);

// Student routes (create, update, delete reviews)
router.post('/', requireUserType('STUDENT'), validateBody(createReviewSchema), reviewController.createReview);
router.put('/:id', requireUserType('STUDENT'), validateBody(createReviewSchema.partial()), reviewController.updateReview);
router.delete('/:id', reviewController.deleteReview);

module.exports = router;
