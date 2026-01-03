/**
 * Print Option Routes
 */

const express = require('express');
const router = express.Router();
const printOptionController = require('../controllers/printOption.controller');
const authenticate = require('../middleware/auth.middleware');
const { requireUserType } = require('../middleware/role.middleware');
const { validateBody, validateQuery } = require('../middleware/validation.middleware');
const { paginationSchema, uuidSchema } = require('../utils/validators');
const { z } = require('zod');

// All routes require authentication
router.use(authenticate);

router.get('/', validateQuery(paginationSchema), printOptionController.getPrintOptions);
router.get('/:id', printOptionController.getPrintOptionById);
router.post('/', requireUserType('DOCTOR'), validateBody(z.object({
  bookId: uuidSchema,
  colorType: z.string().min(1).max(50),
  paperSize: z.string().min(1).max(50),
  pricePerPage: z.number().nonnegative(),
})), printOptionController.createPrintOption);
router.put('/:id', requireUserType('DOCTOR'), validateBody(z.object({
  colorType: z.string().min(1).max(50).optional(),
  paperSize: z.string().min(1).max(50).optional(),
  pricePerPage: z.number().nonnegative().optional(),
})), printOptionController.updatePrintOption);
router.delete('/:id', requireUserType('DOCTOR'), printOptionController.deletePrintOption);

module.exports = router;

