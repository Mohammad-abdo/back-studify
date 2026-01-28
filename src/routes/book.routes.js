/**
 * Book Routes
 * 
 * @swagger
 * tags:
 *   name: Books
 *   description: Academic books and study materials management
 */

const express = require('express');
const router = express.Router();
const bookController = require('../controllers/book.controller');
const authenticate = require('../middleware/auth.middleware');
const { requireUserType } = require('../middleware/role.middleware');
const { validateBody, validateQuery } = require('../middleware/validation.middleware');
const { paginationSchema, uuidSchema } = require('../utils/validators');
const { z } = require('zod');

/**
 * @swagger
 * /books:
 *   get:
 *     summary: List all books with pagination and filters
 *     tags: [Books]
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
 *       - in: query
 *         name: categoryId
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: List of books
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Paginated'
 *                 - properties:
 *                     data: { type: array, items: { $ref: '#/components/schemas/Book' } }
 */
router.get('/', validateQuery(paginationSchema), bookController.getBooks);

/**
 * @swagger
 * /books/{id}:
 *   get:
 *     summary: Get detailed information for a specific book
 *     tags: [Books]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Book details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/Book' }
 *       404:
 *         description: Book not found
 */
router.get('/:id', bookController.getBookById);

// Protected routes
router.use(authenticate);

/**
 * @swagger
 * /books:
 *   post:
 *     summary: Create a new book (Doctor only)
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, description, fileUrl, totalPages, categoryId]
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               fileUrl: { type: string, format: uri }
 *               imageUrls: { type: array, items: { type: string, format: uri } }
 *               totalPages: { type: integer }
 *               categoryId: { type: string, format: uuid }
 *               collegeId: { type: string, format: uuid }
 *               departmentId: { type: string, format: uuid }
 *     responses:
 *       201:
 *         description: Book created successfully
 *       403:
 *         description: Forbidden - Only doctors can create books
 */
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

/**
 * @swagger
 * /books/{id}:
 *   put:
 *     summary: Update an existing book
 *     tags: [Books]
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
 *             $ref: '#/components/schemas/Book'
 *     responses:
 *       200:
 *         description: Book updated
 */
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

/**
 * @swagger
 * /books/{id}:
 *   delete:
 *     summary: Delete a book
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       204:
 *         description: Book deleted
 */
router.delete('/:id', requireUserType('DOCTOR'), bookController.deleteBook);

/**
 * @swagger
 * /books/{id}/pricing:
 *   post:
 *     summary: Add pricing tier for a book
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [accessType, price]
 *             properties:
 *               accessType: { type: string, enum: [READ, BUY, PRINT] }
 *               price: { type: number, minimum: 0 }
 *     responses:
 *       200:
 *         description: Pricing added
 */
router.post('/:id/pricing', requireUserType('DOCTOR'), validateBody(z.object({
  accessType: z.enum(['READ', 'BUY', 'PRINT']),
  price: z.number().nonnegative(),
})), bookController.addBookPricing);

module.exports = router;
