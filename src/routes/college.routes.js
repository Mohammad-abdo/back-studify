/**
 * College Routes
 */

const express = require('express');
const router = express.Router();
const collegeController = require('../controllers/college.controller');
const authenticate = require('../middleware/auth.middleware');
const { requireUserType } = require('../middleware/role.middleware');
const { validateBody } = require('../middleware/validation.middleware');
const { z } = require('zod');

// Public routes (for viewing)
router.get('/', collegeController.getColleges);
router.get('/:id', collegeController.getCollegeById);

// Protected routes (Admin only)
router.use(authenticate);
router.use(requireUserType('ADMIN'));

router.post('/', validateBody(z.object({
  name: z.string().min(2).max(200),
})), collegeController.createCollege);

router.put('/:id', validateBody(z.object({
  name: z.string().min(2).max(200),
})), collegeController.updateCollege);

router.delete('/:id', collegeController.deleteCollege);

module.exports = router;
