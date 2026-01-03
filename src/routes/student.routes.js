/**
 * Student Routes
 */

const express = require('express');
const router = express.Router();
const studentController = require('../controllers/student.controller');
const authenticate = require('../middleware/auth.middleware');
const { requireUserType } = require('../middleware/role.middleware');
const { validateBody, validateQuery } = require('../middleware/validation.middleware');
const { paginationSchema, uuidSchema } = require('../utils/validators');
const { z } = require('zod');

// All routes require authentication and admin access
router.use(authenticate);
router.use(requireUserType('ADMIN'));

router.get('/', validateQuery(paginationSchema), studentController.getStudents);
router.get('/:id', studentController.getStudentById);
router.put('/:id', validateBody(z.object({
  name: z.string().min(2).max(200).optional(),
  collegeId: uuidSchema.optional().nullable(),
  departmentId: uuidSchema.optional().nullable(),
})), studentController.updateStudent);
router.delete('/:id', studentController.deleteStudent);

module.exports = router;


