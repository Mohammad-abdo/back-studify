/**
 * Mobile Global Routes
 * Categories, Faculties (Colleges), Departments, Cart, Supplies (Products)
 * Available to any authenticated user — not tied to student or any role.
 */

const express = require('express');
const router = express.Router();
const categoryController = require('../../controllers/category.controller');
const collegeController = require('../../controllers/college.controller');
const productController = require('../../controllers/product.controller');
const printOptionController = require('../../controllers/printOption.controller');
const cartRoutes = require('../cart.routes');
const prisma = require('../../config/database');
const authenticate = require('../../middleware/auth.middleware');
const { validateQuery } = require('../../middleware/validation.middleware');
const { paginationSchema, uuidSchema } = require('../../utils/validators');
const { sendPaginated, getPaginationParams, buildPagination, sendSuccess } = require('../../utils/response');
const { NotFoundError } = require('../../utils/errors');
const { transformImageUrlsMiddleware } = require('../../middleware/imageUrl.middleware');
const { z } = require('zod');

router.use(authenticate);
router.use(transformImageUrlsMiddleware);

// ============================================
// CATEGORIES (Global)
// ============================================
router.get('/categories/books', categoryController.getBookCategories);
router.get('/categories/products', validateQuery(paginationSchema.extend({
  collegeId: uuidSchema.optional(),
})), categoryController.getProductCategories);
router.get('/categories/materials', validateQuery(paginationSchema.extend({
  collegeId: uuidSchema.optional(),
})), categoryController.getMaterialCategories);

// ============================================
// COLLEGES / FACULTIES (Global)
// ============================================
router.get('/colleges', validateQuery(paginationSchema.extend({
  search: z.string().optional(),
})), collegeController.getColleges);
router.get('/colleges/:id', collegeController.getCollegeById);

// ============================================
// DEPARTMENTS (Global)
// ============================================
router.get('/departments', validateQuery(paginationSchema.extend({
  collegeId: uuidSchema.optional(),
  search: z.string().optional(),
})), async (req, res, next) => {
  try {
    const { page, limit } = getPaginationParams(req.query.page, req.query.limit);
    const { collegeId, search } = req.query;

    const where = {
      ...(collegeId && { collegeId }),
      ...(search && {
        name: { contains: search, mode: 'insensitive' },
      }),
    };

    const [departments, total] = await Promise.all([
      prisma.department.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          college: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.department.count({ where }),
    ]);

    const pagination = buildPagination(page, limit, total);
    sendPaginated(res, departments, pagination, 'Departments retrieved successfully');
  } catch (error) {
    next(error);
  }
});

router.get('/departments/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        college: { select: { id: true, name: true } },
      },
    });
    if (!department) throw new NotFoundError('Department not found');
    sendSuccess(res, department, 'Department retrieved successfully');
  } catch (error) {
    next(error);
  }
});

// ============================================
// SUPPLIES / PRODUCTS (Global)
// ============================================
router.get('/products', validateQuery(paginationSchema.extend({
  categoryId: uuidSchema.optional(),
  collegeId: uuidSchema.optional(),
  search: z.string().optional(),
})), productController.getProducts);
router.get('/products/:id', productController.getProductById);

// ============================================
// PRINT OPTIONS (Global — book or material by ID)
// GET /api/mobile/:id/print-options — :id = bookId OR materialId (فلتر صارم)
// ============================================
router.get('/:id/print-options', validateQuery(paginationSchema), printOptionController.getPrintOptionsByContentId);

// ============================================
// CART (Global — one per user)
// ============================================
router.use('/cart', cartRoutes);

module.exports = router;
