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
const { optionalAuthenticate, checkProductAccess } = require('../middleware/institute.middleware');
const { validateBody, validateQuery } = require('../middleware/validation.middleware');
const { paginationSchema, uuidSchema } = require('../utils/validators');
const { z } = require('zod');
const multer = require('multer');

const csvUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const okTypes = new Set(['text/csv', 'application/vnd.ms-excel']);
    if (okTypes.has(file.mimetype)) return cb(null, true);
    return cb(new Error(`Invalid file type: ${file.mimetype}. Expected CSV.`), false);
  },
});

const xlsxUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
  fileFilter: (req, file, cb) => {
    const okTypes = new Set([
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/octet-stream',
    ]);
    const name = (file.originalname || '').toLowerCase();
    if (okTypes.has(file.mimetype) || name.endsWith('.xlsx')) return cb(null, true);
    return cb(new Error(`Invalid file type: ${file.mimetype}. Expected .xlsx.`), false);
  },
});

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
const productListQuerySchema = paginationSchema.extend({
  categoryId: uuidSchema.optional(),
  collegeId: uuidSchema.optional(),
  search: z.string().optional(),
  isInstituteProduct: z.enum(['true', 'false']).optional(),
});

router.get('/', optionalAuthenticate, validateQuery(productListQuerySchema), productController.getProducts);

// CSV import/export (Admin only)
router.get('/export.csv', authenticate, requireUserType('ADMIN'), productController.exportProductsCsv);
router.get('/pricing/export.csv', authenticate, requireUserType('ADMIN'), productController.exportProductPricingCsv);
router.post('/import.csv', authenticate, requireUserType('ADMIN'), csvUpload.single('file'), productController.importProductsCsv);
router.post('/pricing/import.csv', authenticate, requireUserType('ADMIN'), csvUpload.single('file'), productController.importProductPricingCsv);
router.get('/templates/products.csv', authenticate, requireUserType('ADMIN'), productController.downloadProductsCsvTemplate);
router.get('/templates/product_pricing.csv', authenticate, requireUserType('ADMIN'), productController.downloadProductPricingCsvTemplate);
router.get('/templates/products_import.xlsx', authenticate, requireUserType('ADMIN'), productController.downloadProductsImportXlsxTemplate);
router.get('/export.xlsx', authenticate, requireUserType('ADMIN'), productController.exportProductsXlsx);
router.post('/import.xlsx', authenticate, requireUserType('ADMIN'), xlsxUpload.single('file'), productController.importProductsXlsx);

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
router.get('/:id', optionalAuthenticate, checkProductAccess, productController.getProductById);

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
  isInstituteProduct: z.boolean().optional().default(false),
  basePrice: z.number().nonnegative().optional().nullable(),
  pricingStrategy: z.enum(['FIXED_TIERS', 'DISCOUNT_TIERS']).optional().nullable(),
  pricingTiers: z.array(z.object({
    minQuantity: z.number().int().positive(),
    maxQuantity: z.number().int().positive().optional().nullable(),
    price: z.number().nonnegative(),
    fixedPrice: z.number().nonnegative().optional().nullable(),
    discountPercent: z.number().min(0).max(100).optional().nullable(),
  })).optional(),
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
  isInstituteProduct: z.boolean().optional(),
  basePrice: z.number().nonnegative().optional().nullable(),
  pricingStrategy: z.enum(['FIXED_TIERS', 'DISCOUNT_TIERS']).optional().nullable(),
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
  maxQuantity: z.number().int().positive().optional().nullable(),
  price: z.number().nonnegative(),
  fixedPrice: z.number().nonnegative().optional().nullable(),
  discountPercent: z.number().min(0).max(100).optional().nullable(),
})), productController.addProductPricing);

module.exports = router;
