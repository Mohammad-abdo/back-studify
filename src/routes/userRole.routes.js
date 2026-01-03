/**
 * User Role Routes
 */

const express = require('express');
const router = express.Router();
const userRoleController = require('../controllers/userRole.controller');
const authenticate = require('../middleware/auth.middleware');
const { requireUserType } = require('../middleware/role.middleware');
const { validateBody, validateQuery } = require('../middleware/validation.middleware');
const { paginationSchema, uuidSchema } = require('../utils/validators');
const { z } = require('zod');

// All routes require authentication and admin access
router.use(authenticate);
router.use(requireUserType('ADMIN'));

router.get('/', validateQuery(paginationSchema), userRoleController.getUserRoles);
router.get('/user/:userId', userRoleController.getUserRolesByUserId);
router.post('/', validateBody(z.object({
  userId: uuidSchema,
  roleId: uuidSchema,
})), userRoleController.assignRole);
router.delete('/:userId/:roleId', userRoleController.removeRole);

module.exports = router;


