/**
 * Static Page Routes
 */

const express = require('express');
const router = express.Router();
const staticPageController = require('../controllers/staticPage.controller');
const authenticate = require('../middleware/auth.middleware');
const { requireUserType } = require('../middleware/role.middleware');
const { validateBody } = require('../middleware/validation.middleware');
const { z } = require('zod');

// Public routes (for viewing)
router.get('/', staticPageController.getStaticPages);
router.get('/slug/:slug', staticPageController.getStaticPageBySlug);

// Protected routes (Admin only)
router.use(authenticate);
router.use(requireUserType('ADMIN'));

router.get('/:id', staticPageController.getStaticPageById);
router.post('/', validateBody(z.object({
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/),
  title: z.string().min(2).max(200),
  content: z.string().min(10),
})), staticPageController.createStaticPage);

router.put('/:id', validateBody(z.object({
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/).optional(),
  title: z.string().min(2).max(200).optional(),
  content: z.string().min(10).optional(),
})), staticPageController.updateStaticPage);

router.delete('/:id', staticPageController.deleteStaticPage);

module.exports = router;


