/**
 * Permission Routes
 */

const express = require('express');
const router = express.Router();
const permissionController = require('../controllers/permission.controller');
const authenticate = require('../middleware/auth.middleware');
const { requireUserType } = require('../middleware/role.middleware');
const { validateBody, validateQuery } = require('../middleware/validation.middleware');
const { paginationSchema } = require('../utils/validators');
const { z } = require('zod');

// All routes require authentication and admin access
router.use(authenticate);
router.use(requireUserType('ADMIN'));

router.get('/', validateQuery(paginationSchema), permissionController.getPermissions);
router.get('/:id', permissionController.getPermissionById);
router.post('/', validateBody(z.object({
  key: z.string().min(2).max(100),
})), permissionController.createPermission);
router.put('/:id', validateBody(z.object({
  key: z.string().min(2).max(100),
})), permissionController.updatePermission);
router.delete('/:id', permissionController.deletePermission);

module.exports = router;


