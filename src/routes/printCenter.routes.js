/**
 * Print Center Routes
 */

const express = require('express');
const router = express.Router();
const printCenterController = require('../controllers/printCenter.controller');
const authenticate = require('../middleware/auth.middleware');
const { requireUserType } = require('../middleware/role.middleware');
const { validateBody, validateQuery } = require('../middleware/validation.middleware');
const { paginationSchema } = require('../utils/validators');
const { z } = require('zod');

// All routes require authentication and admin access
router.use(authenticate);
router.use(requireUserType('ADMIN'));

router.post('/', validateBody(z.object({
  phone: z.string().min(8).max(20),
  password: z.string().min(8).max(100),
  email: z.string().email().optional().nullable(),
  name: z.string().min(2).max(100),
  location: z.string().max(200).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  latitude: z.union([z.number(), z.string()]).optional().nullable().transform((v) => (v === '' || v == null ? null : Number(v))),
  longitude: z.union([z.number(), z.string()]).optional().nullable().transform((v) => (v === '' || v == null ? null : Number(v))),
})), printCenterController.createPrintCenter);

router.get('/', validateQuery(paginationSchema), printCenterController.getPrintCenters);
router.get('/:id', printCenterController.getPrintCenterById);

router.put('/:id', validateBody(z.object({
  name: z.string().min(2).max(100).optional(),
  location: z.string().max(200).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  latitude: z.union([z.number(), z.string()]).optional().nullable().transform((v) => (v === '' || v == null ? null : Number(v))),
  longitude: z.union([z.number(), z.string()]).optional().nullable().transform((v) => (v === '' || v == null ? null : Number(v))),
  isActive: z.boolean().optional(),
})), printCenterController.updatePrintCenter);

router.delete('/:id', printCenterController.deletePrintCenter);

module.exports = router;
