/**
 * Import Log Routes
 */

const express = require('express');
const router = express.Router();
const importLogController = require('../controllers/importLog.controller');
const authenticate = require('../middleware/auth.middleware');
const { requireUserType } = require('../middleware/role.middleware');
const { validateBody, validateQuery } = require('../middleware/validation.middleware');
const { paginationSchema } = require('../utils/validators');
const { z } = require('zod');

// All routes require authentication and admin access
router.use(authenticate);
router.use(requireUserType('ADMIN'));

router.get('/', validateQuery(paginationSchema), importLogController.getImportLogs);
router.get('/:id', importLogController.getImportLogById);
router.post('/', validateBody(z.object({
  type: z.enum(['PRODUCT', 'BOOK']),
  fileUrl: z.string().url(),
  success: z.number().int().nonnegative().optional(),
  failed: z.number().int().nonnegative().optional(),
})), importLogController.createImportLog);
router.delete('/:id', importLogController.deleteImportLog);

module.exports = router;


