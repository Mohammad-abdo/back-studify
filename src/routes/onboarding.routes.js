/**
 * Onboarding Routes
 */

const express = require('express');
const router = express.Router();
const onboardingController = require('../controllers/onboarding.controller');
const authenticate = require('../middleware/auth.middleware');
const { requireUserType } = require('../middleware/role.middleware');
const { validateBody } = require('../middleware/validation.middleware');
const { z } = require('zod');

// Public routes (for viewing)
router.get('/', onboardingController.getOnboardingItems);
router.get('/:id', onboardingController.getOnboardingItemById);

// Protected routes (Admin only)
router.use(authenticate);
router.use(requireUserType('ADMIN'));

router.post('/', validateBody(z.object({
  imageUrl: z.string().url(),
  title: z.string().min(2).max(200),
  description: z.string().min(10),
  order: z.number().int().nonnegative().optional(),
})), onboardingController.createOnboardingItem);

router.put('/:id', validateBody(z.object({
  imageUrl: z.string().url().optional(),
  title: z.string().min(2).max(200).optional(),
  description: z.string().min(10).optional(),
  order: z.number().int().nonnegative().optional(),
})), onboardingController.updateOnboardingItem);

router.delete('/:id', onboardingController.deleteOnboardingItem);

module.exports = router;


