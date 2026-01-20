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
const { singleUpload } = require('../services/fileUpload.service');
const { z } = require('zod');

// All routes require authentication
router.use(authenticate);

router.get('/', validateQuery(paginationSchema.extend({
  bookId: uuidSchema.optional(),
  materialId: uuidSchema.optional(),
  hasUploadedFile: z.enum(['true', 'false']).optional(),
})), printOptionController.getPrintOptions);
router.get('/:id', printOptionController.getPrintOptionById);

// Validation for creating a print option (configured by doctor)
const createPrintOptionSchema = z.object({
  bookId: uuidSchema.optional().nullable(),
  materialId: uuidSchema.optional().nullable(),
  uploadedFileUrl: z.string().url().optional().nullable(),
  // COLOR or BLACK_WHITE
  colorType: z.enum(['COLOR', 'BLACK_WHITE']),
  copies: z.number().int().positive(),
  paperType: z.enum(['A4', 'A3', 'LETTER']),
  doubleSide: z.boolean(),
}).refine(
  (data) => data.bookId || data.materialId || data.uploadedFileUrl,
  {
    message: 'Either bookId, materialId, or uploadedFileUrl must be provided',
  }
);

// Validation for updating a print option
const updatePrintOptionSchema = z.object({
  bookId: uuidSchema.optional().nullable(),
  materialId: uuidSchema.optional().nullable(),
  uploadedFileUrl: z.string().url().optional().nullable(),
  colorType: z.enum(['COLOR', 'BLACK_WHITE']).optional(),
  copies: z.number().int().positive().optional(),
  paperType: z.enum(['A4', 'A3', 'LETTER']).optional(),
  doubleSide: z.boolean().optional(),
});

// Create print option with file upload support
router.post(
  '/upload',
  requireUserType('DOCTOR'),
  singleUpload('file'),
  validateBody(z.object({
    colorType: z.enum(['COLOR', 'BLACK_WHITE']),
    copies: z.number().int().positive(),
    paperType: z.enum(['A4', 'A3', 'LETTER']),
    doubleSide: z.boolean(),
    totalPages: z.number().int().positive().optional(), // Optional for uploaded files
  })),
  printOptionController.createPrintOptionWithUpload
);

router.post(
  '/',
  requireUserType('DOCTOR'),
  validateBody(createPrintOptionSchema),
  printOptionController.createPrintOption
);

router.put(
  '/:id',
  requireUserType('DOCTOR'),
  validateBody(updatePrintOptionSchema),
  printOptionController.updatePrintOption
);

// Get quote for a print option (no body needed, uses print option's own configuration)
router.get(
  '/:id/quote',
  printOptionController.getPrintQuote
);

// Create print order from print option (for students)
router.post(
  '/:id/order',
  printOptionController.createPrintOrder
);

router.delete('/:id', requireUserType('DOCTOR'), printOptionController.deletePrintOption);

module.exports = router;

