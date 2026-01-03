/**
 * Role Routes
 */

const express = require('express');
const router = express.Router();
const roleController = require('../controllers/role.controller');
const authenticate = require('../middleware/auth.middleware');
const { requireUserType } = require('../middleware/role.middleware');
const { validateBody, validateQuery } = require('../middleware/validation.middleware');
const { paginationSchema, uuidSchema } = require('../utils/validators');
const { z } = require('zod');

// All routes require authentication and admin access
router.use(authenticate);
router.use(requireUserType('ADMIN'));

router.get('/', validateQuery(paginationSchema), roleController.getRoles);
router.get('/:id', roleController.getRoleById);
router.post('/', validateBody(z.object({
  name: z.string().min(2).max(100),
  permissionIds: z.array(uuidSchema).optional(),
})), roleController.createRole);
router.put('/:id', validateBody(z.object({
  name: z.string().min(2).max(100).optional(),
  permissionIds: z.array(uuidSchema).optional(),
})), roleController.updateRole);
router.delete('/:id', roleController.deleteRole);

module.exports = router;


