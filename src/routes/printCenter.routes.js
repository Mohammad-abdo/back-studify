/**
 * Print Center Routes
 * 
 * @swagger
 * tags:
 *   name: Print Center
 *   description: Print center management and production node oversight
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

/**
 * @swagger
 * /print-centers:
 *   post:
 *     summary: Create print center account (Admin only)
 *     tags: [Print Center]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone, password, name]
 *             properties:
 *               phone: { type: string }
 *               password: { type: string }
 *               email: { type: string }
 *               name: { type: string }
 *               location: { type: string }
 *               address: { type: string }
 *               latitude: { type: number }
 *               longitude: { type: number }
 *     responses:
 *       201:
 *         description: Print center created
 *       400:
 *         description: Validation error
 */
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

/**
 * @swagger
 * /print-centers:
 *   get:
 *     summary: List all registered print centers (Admin only)
 *     tags: [Print Center]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of print centers
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Paginated'
 *                 - properties:
 *                     data: { type: array, items: { $ref: '#/components/schemas/PrintCenter' } }
 */
router.get('/', validateQuery(paginationSchema), printCenterController.getPrintCenters);

/**
 * @swagger
 * /print-centers/{id}:
 *   get:
 *     summary: Get print center by ID
 *     tags: [Print Center]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Print center details
 */
router.get('/:id', printCenterController.getPrintCenterById);

/**
 * @swagger
 * /print-centers/{id}:
 *   put:
 *     summary: Update print center configuration
 *     tags: [Print Center]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               location: { type: string }
 *               isActive: { type: boolean }
 *     responses:
 *       200:
 *         description: Configuration updated
 */
router.put('/:id', validateBody(z.object({
  name: z.string().min(2).max(100).optional(),
  location: z.string().max(200).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  latitude: z.union([z.number(), z.string()]).optional().nullable().transform((v) => (v === '' || v == null ? null : Number(v))),
  longitude: z.union([z.number(), z.string()]).optional().nullable().transform((v) => (v === '' || v == null ? null : Number(v))),
  isActive: z.boolean().optional(),
})), printCenterController.updatePrintCenter);

/**
 * @swagger
 * /print-centers/{id}:
 *   delete:
 *     summary: Unregister and delete print center account
 *     tags: [Print Center]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       204:
 *         description: Node deleted
 */
router.delete('/:id', printCenterController.deletePrintCenter);

module.exports = router;
