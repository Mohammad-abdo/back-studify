/**
 * Slider Routes
 */

const express = require('express');
const router = express.Router();
const sliderController = require('../controllers/slider.controller');
const authenticate = require('../middleware/auth.middleware');
const { requireUserType } = require('../middleware/role.middleware');
const { validateBody, validateQuery } = require('../middleware/validation.middleware');
const { paginationSchema, uuidSchema } = require('../utils/validators');
const { z } = require('zod');

// Public routes (for viewing active sliders)
router.get('/active', sliderController.getSliders);

// Protected routes (Admin only)
router.use(authenticate);
router.use(requireUserType('ADMIN'));

router.get('/', validateQuery(paginationSchema), sliderController.getAllSliders);
router.get('/:id', sliderController.getSliderById);
router.post('/', validateBody(z.object({
  imageUrl: z.string().url(),
  title: z.string().optional(),
  description: z.string().optional(),
  linkUrl: z.string().url().optional(),
  order: z.number().int().nonnegative().optional(),
  isActive: z.boolean().optional(),
})), sliderController.createSlider);
router.put('/:id', validateBody(z.object({
  imageUrl: z.string().url().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  linkUrl: z.string().url().optional(),
  order: z.number().int().nonnegative().optional(),
  isActive: z.boolean().optional(),
})), sliderController.updateSlider);
router.delete('/:id', sliderController.deleteSlider);

module.exports = router;


