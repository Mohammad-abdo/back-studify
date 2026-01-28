/**
 * Product Routes
 * 
 * @swagger
 * tags:
 *   name: Products
 *   description: Physical university products and stationery management
 */

const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const authenticate = require('../middleware/auth.middleware');
const { requireUserType } = require('../middleware/role.middleware');
const { validateBody, validateQuery } = require('../middleware/validation.middleware');
const { paginationSchema, uuidSchema } = require('../utils/validators');
const { z } = require('zod');

/**
 * @swagger
 * /products:
 *   get:
 *     summary: List all products with pagination and filters
 *     tags: [Products]
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
 *         description: List of products
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Paginated'
 *                 - properties:
 *                     data: { type: array, items: { $ref: '#/components/schemas/Product' } }
 */
router.get('/', validateQuery(paginationSchema), productController.getProducts);

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Get product details
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Product details
 */
router.get('/:id', productController.getProductById);

// Protected routes (Admin only)
router.use(authenticate);
router.use(requireUserType('ADMIN'));

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Create a new product (Admin only)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, description, categoryId]
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               imageUrls: { type: array, items: { type: string, format: uri } }
 *               categoryId: { type: string, format: uuid }
 *     responses:
 *       201:
 *         description: Product created
 */
router.post('/', validateBody(z.object({
  name: z.string().min(2).max(200),
  description: z.string().min(10),
  imageUrls: z.array(z.string().url()).optional(),
  categoryId: uuidSchema,
})), productController.createProduct);

/**
 * @swagger
 * /products/{id}:
 *   put:
 *     summary: Update product details
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Product updated
 */
router.put('/:id', validateBody(z.object({
  name: z.string().min(2).max(200).optional(),
  description: z.string().min(10).optional(),
  imageUrls: z.array(z.string().url()).optional(),
  categoryId: uuidSchema.optional(),
})), productController.updateProduct);

/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Delete a product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       204:
 *         description: Product deleted
 */
router.delete('/:id', productController.deleteProduct);

/**
 * @swagger
 * /products/{id}/pricing:
 *   post:
 *     summary: Add wholesale/volume pricing for a product
 *     tags: [Products]
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
 *             required: [minQuantity, price]
 *             properties:
 *               minQuantity: { type: integer, minimum: 1 }
 *               price: { type: number, minimum: 0 }
 *     responses:
 *       200:
 *         description: Pricing tier added
 */
router.post('/:id/pricing', validateBody(z.object({
  minQuantity: z.number().int().positive(),
  price: z.number().nonnegative(),
})), productController.addProductPricing);

module.exports = router;
