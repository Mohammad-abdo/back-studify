/**
 * Doctor Routes
 */

const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctor.controller');
const authenticate = require('../middleware/auth.middleware');
const { requireUserType } = require('../middleware/role.middleware');
const { validateBody, validateQuery } = require('../middleware/validation.middleware');
const { paginationSchema } = require('../utils/validators');
const { z } = require('zod');

// All routes require authentication and admin access
router.use(authenticate);
router.use(requireUserType('ADMIN'));

router.get('/', validateQuery(paginationSchema), doctorController.getDoctors);
router.get('/:id', doctorController.getDoctorById);
router.put('/:id', validateBody(z.object({
  name: z.string().min(2).max(200).optional(),
  specialization: z.string().min(2).max(200).optional(),
})), doctorController.updateDoctor);
router.delete('/:id', doctorController.deleteDoctor);

module.exports = router;


