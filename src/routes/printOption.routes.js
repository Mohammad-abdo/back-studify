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
const { transformImageUrlsMiddleware } = require('../middleware/imageUrl.middleware');
const { z } = require('zod');

// All routes require authentication
router.use(authenticate);
// Normalize file URLs (localhost → backend URL) in responses
router.use(transformImageUrlsMiddleware);

// —— Static paths first (before /:id) so /upload is not matched as id ——
// POST /api/print-options/upload — form-data: file + colorType, copies, paperType, doubleSide, totalPages (optional)
router.post(
  '/upload',
  requireUserType('DOCTOR', 'ADMIN'),
  singleUpload('file'),
  validateBody(z.object({
    colorType: z.enum(['COLOR', 'BLACK_WHITE']),
    copies: z.coerce.number().int().positive(),
    paperType: z.enum(['A4', 'A3', 'LETTER']),
    doubleSide: z.coerce.boolean(),
    totalPages: z.coerce.number().int().positive().optional(),
  })),
  printOptionController.createPrintOptionWithUpload
);

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
  colorType: z.enum(['COLOR', 'BLACK_WHITE']),
  copies: z.number().int().positive(),
  paperType: z.enum(['A4', 'A3', 'LETTER']),
  doubleSide: z.boolean(),
  enabled: z.boolean().optional(),
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
  enabled: z.boolean().optional(),
});

router.post(
  '/',
  requireUserType('DOCTOR', 'ADMIN'),
  validateBody(createPrintOptionSchema),
  printOptionController.createPrintOption
);

router.put(
  '/:id',
  requireUserType('DOCTOR', 'ADMIN'),
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
  validateBody(z.object({
    address: z.string().max(2000).optional(),
  })),
  printOptionController.createPrintOrder
);

router.delete('/:id', requireUserType('DOCTOR', 'ADMIN'), printOptionController.deletePrintOption);

module.exports = router;

