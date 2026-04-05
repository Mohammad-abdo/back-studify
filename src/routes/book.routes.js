/**
 * Book Routes
 */

const express = require('express');
const router = express.Router();
const bookController = require('../controllers/book.controller');
const authenticate = require('../middleware/auth.middleware');
const { requireUserType } = require('../middleware/role.middleware');
const { validateBody, validateQuery } = require('../middleware/validation.middleware');
const { paginationSchema, uuidSchema } = require('../utils/validators');
const { z } = require('zod');

router.get('/', validateQuery(paginationSchema), bookController.getBooks);
router.get('/:id', bookController.getBookById);

// Protected routes
router.use(authenticate);

router.post('/', requireUserType('DOCTOR'), validateBody(z.object({
  title: z.string().min(2).max(200),
  description: z.string().min(10),
  fileUrl: z.string().url(),
  imageUrls: z.array(z.string().url()).optional(),
  totalPages: z.number().int().positive(),
  categoryId: uuidSchema,
  collegeId: uuidSchema.optional(),
  departmentId: uuidSchema.optional(),
})), bookController.createBook);

router.put('/:id', validateBody(z.object({
  title: z.string().min(2).max(200).optional(),
  description: z.string().min(10).optional(),
  fileUrl: z.string().url().optional(),
  imageUrls: z.array(z.string().url()).optional(),
  totalPages: z.number().int().positive().optional(),
  categoryId: uuidSchema.optional(),
  collegeId: uuidSchema.optional(),
  departmentId: uuidSchema.optional(),
})), bookController.updateBook);

router.delete('/:id', requireUserType('DOCTOR'), bookController.deleteBook);

router.post('/:id/pricing', requireUserType('DOCTOR'), validateBody(z.object({
  accessType: z.enum(['READ', 'BUY', 'PRINT']),
  price: z.number().nonnegative(),
})), bookController.addBookPricing);

module.exports = router;
