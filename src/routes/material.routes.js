/**
 * Material Routes
 */

const express = require('express');
const router = express.Router();
const materialController = require('../controllers/material.controller');
const authenticate = require('../middleware/auth.middleware');
const { requireUserType } = require('../middleware/role.middleware');
const { validateBody, validateQuery } = require('../middleware/validation.middleware');
const { paginationSchema, uuidSchema } = require('../utils/validators');
const { z } = require('zod');

// Public routes (no auth required for viewing)
router.get('/', validateQuery(paginationSchema.extend({
  categoryId: uuidSchema.optional(),
  collegeId: uuidSchema.optional(),
  departmentId: uuidSchema.optional(),
  doctorId: uuidSchema.optional(),
  materialType: z.string().optional(),
  search: z.string().optional(),
  approvalStatus: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
})), materialController.getMaterials);

router.get('/:id', materialController.getMaterialById);
router.post('/:id/download', materialController.incrementDownloads);

// Protected routes (Doctor only for creating/updating)
router.use(authenticate);
router.use(requireUserType('DOCTOR'));

router.post('/', validateBody(z.object({
  title: z.string().min(2).max(200),
  description: z.string().min(10),
  fileUrl: z.string().url(),
  imageUrls: z.array(z.string().url()).optional(),
  totalPages: z.number().int().positive().optional(),
  categoryId: uuidSchema,
  collegeId: uuidSchema.optional(),
  departmentId: uuidSchema.optional(),
  materialType: z.string().optional(),
  pricing: z.array(z.object({
    accessType: z.enum(['READ', 'BUY', 'PRINT']),
    price: z.number().nonnegative(),
  })).optional(),
})), materialController.createMaterial);

router.put('/:id', validateBody(z.object({
  title: z.string().min(2).max(200).optional(),
  description: z.string().min(10).optional(),
  fileUrl: z.string().url().optional(),
  imageUrls: z.array(z.string().url()).optional(),
  totalPages: z.number().int().positive().optional(),
  categoryId: uuidSchema.optional(),
  collegeId: uuidSchema.optional(),
  departmentId: uuidSchema.optional(),
  materialType: z.string().optional(),
})), materialController.updateMaterial);

router.delete('/:id', materialController.deleteMaterial);

router.post('/:id/pricing', validateBody(z.object({
  accessType: z.enum(['READ', 'BUY', 'PRINT']),
  price: z.number().nonnegative(),
})), materialController.addMaterialPricing);

module.exports = router;

