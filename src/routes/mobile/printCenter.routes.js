/**
 * Mobile Print Center Routes
 * للطالب والدكتور — كلاهما يستطيع الطباعة
 * POST /api/mobile/print-center/upload
 * POST /api/mobile/print-center/book/:bookId
 * POST /api/mobile/print-center/material/:materialId
 */

const express = require('express');
const router = express.Router();
const printOptionController = require('../../controllers/printOption.controller');
const authenticate = require('../../middleware/auth.middleware');
const { requireUserType } = require('../../middleware/role.middleware');
const { validateBody } = require('../../middleware/validation.middleware');
const { transformImageUrlsMiddleware } = require('../../middleware/imageUrl.middleware');
const { singleUpload } = require('../../services/fileUpload.service');
const { z } = require('zod');

router.use(authenticate);
router.use(requireUserType('STUDENT', 'DOCTOR'));
router.use(transformImageUrlsMiddleware);

// Upload file and create print option (form-data: coerce strings to number/boolean)
router.post('/upload', singleUpload('file'), validateBody(z.object({
  colorType: z.enum(['COLOR', 'BLACK_WHITE']),
  copies: z.coerce.number().int().positive(),
  paperType: z.enum(['A4', 'A3', 'LETTER']),
  doubleSide: z.coerce.boolean(),
  totalPages: z.coerce.number().int().positive().optional(),
})), printOptionController.createPrintOptionWithUpload);

// Create print option for book
router.post('/book/:bookId', validateBody(z.object({
  colorType: z.enum(['COLOR', 'BLACK_WHITE']),
  copies: z.coerce.number().int().positive(),
  paperType: z.enum(['A4', 'A3', 'LETTER']),
  doubleSide: z.coerce.boolean(),
})), async (req, res, next) => {
  try {
    req.body.bookId = req.params.bookId;
    return printOptionController.createPrintOption(req, res, next);
  } catch (error) {
    next(error);
  }
});

// Create print option for material
router.post('/material/:materialId', validateBody(z.object({
  colorType: z.enum(['COLOR', 'BLACK_WHITE']),
  copies: z.coerce.number().int().positive(),
  paperType: z.enum(['A4', 'A3', 'LETTER']),
  doubleSide: z.coerce.boolean(),
})), async (req, res, next) => {
  try {
    req.body.materialId = req.params.materialId;
    return printOptionController.createPrintOption(req, res, next);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
