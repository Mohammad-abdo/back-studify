/**
 * Mobile Student Routes
 * Routes optimized for student mobile app
 */

const express = require('express');
const router = express.Router();
const userController = require('../../controllers/user.controller');
const authController = require('../../controllers/auth.controller');
const orderController = require('../../controllers/order.controller');
const reviewController = require('../../controllers/review.controller');
const bookController = require('../../controllers/book.controller');
const productController = require('../../controllers/product.controller');
const categoryController = require('../../controllers/category.controller');
const collegeController = require('../../controllers/college.controller');
const printOptionController = require('../../controllers/printOption.controller');
const notificationService = require('../../services/notification.service');
const prisma = require('../../config/database');
const authenticate = require('../../middleware/auth.middleware');
const { requireUserType } = require('../../middleware/role.middleware');
const { validateBody, validateQuery } = require('../../middleware/validation.middleware');
const { createOrderSchema, createReviewSchema, paginationSchema, uuidSchema } = require('../../utils/validators');
const { sendSuccess, sendPaginated, getPaginationParams, buildPagination } = require('../../utils/response');
const { transformImageUrlsMiddleware } = require('../../middleware/imageUrl.middleware');
const { singleUpload } = require('../../services/fileUpload.service');
const { z } = require('zod');

// All routes require authentication and student type
router.use(authenticate);
router.use(requireUserType('STUDENT'));

// Transform image URLs to full URLs for mobile
router.use(transformImageUrlsMiddleware);

// ============================================
// PROFILE
// ============================================
router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.delete('/profile', userController.deleteAccount);


// Update student-specific profile (name, college, department)
router.put('/profile/student', validateBody(z.object({
  name: z.string().min(2).max(100).optional(),
  collegeId: uuidSchema.optional().nullable(),
  departmentId: uuidSchema.optional().nullable(),
})), userController.updateStudentProfile);

// Upload profile image
router.post('/profile/avatar', singleUpload('avatar'), userController.uploadProfileImage);

// Change password
router.post('/change-password', validateBody(z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(6),
})), authController.changePassword);

// ============================================
// BOOKS
// ============================================
router.get('/books', validateQuery(paginationSchema.extend({
  categoryId: uuidSchema.optional(),
  collegeId: uuidSchema.optional(),
  departmentId: uuidSchema.optional(),
  search: z.string().optional(),
})), bookController.getBooks);

router.get('/books/:id', bookController.getBookById);

// ============================================
// PRODUCTS
// ============================================
router.get('/products', validateQuery(paginationSchema.extend({
  categoryId: uuidSchema.optional(),
  collegeId: uuidSchema.optional(),
  search: z.string().optional(),
})), productController.getProducts);

router.get('/products/:id', productController.getProductById);

// ============================================
// CATEGORIES (for filtering)
// ============================================
router.get('/categories/books', categoryController.getBookCategories);
router.get('/categories/products', validateQuery(paginationSchema.extend({
  collegeId: uuidSchema.optional(),
})), categoryController.getProductCategories);
router.get('/categories/materials', validateQuery(paginationSchema.extend({
  collegeId: uuidSchema.optional(),
})), categoryController.getMaterialCategories);

// ============================================
// COLLEGES (for filtering)
// ============================================
router.get('/colleges', validateQuery(paginationSchema.extend({
  search: z.string().optional(),
})), collegeController.getColleges);

router.get('/colleges/:id', collegeController.getCollegeById);

// ============================================
// DEPARTMENTS (for filtering)
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

// ============================================
// CONTENT ORDERS (BOOKS & MATERIALS READ / BUY / PRINT)
// ============================================
// Book content order: READ, BUY, PRINT
router.post('/books/:bookId/access', validateBody(z.object({
  accessType: z.enum(['READ', 'BUY', 'PRINT']),
  address: z.string().max(2000).optional(),
})), async (req, res, next) => {
  try {
    const userId = req.userId;
    const { bookId } = req.params;
    const { accessType } = req.body;

    // Ensure book exists
    const book = await prisma.book.findUnique({
      where: { id: bookId },
    });
    if (!book) {
      return next(new NotFoundError('Book not found'));
    }

    // Get pricing for this access type
    const pricing = await prisma.bookPricing.findUnique({
      where: {
        bookId_accessType: {
          bookId,
          accessType,
        },
      },
    });
    if (!pricing) {
      return next(new NotFoundError(`No pricing found for access type ${accessType}`));
    }

    // Create a CONTENT order (address from body or default)
    const address = (req.body?.address && String(req.body.address).trim()) ? String(req.body.address).trim() : 'Address not provided';
    const order = await prisma.order.create({
      data: {
        userId,
        total: pricing.price,
        status: 'CREATED',
        orderType: 'CONTENT',
        address,
        items: {
          create: [
            {
              referenceType: 'BOOK',
              referenceId: bookId,
              quantity: 1,
              price: pricing.price,
            },
          ],
        },
      },
      include: {
        items: true,
      },
    });

    sendSuccess(res, order, 'Content order for book created successfully', 201);
  } catch (error) {
    next(error);
  }
});

// Material content order: READ, BUY, PRINT
router.post('/materials/:materialId/access', validateBody(z.object({
  accessType: z.enum(['READ', 'BUY', 'PRINT']),
  address: z.string().max(2000).optional(),
})), async (req, res, next) => {
  try {
    const userId = req.userId;
    const { materialId } = req.params;
    const { accessType } = req.body;

    // Ensure material exists
    const material = await prisma.material.findUnique({
      where: { id: materialId },
    });
    if (!material) {
      return next(new NotFoundError('Material not found'));
    }

    // Get pricing for this access type
    const pricing = await prisma.materialPricing.findUnique({
      where: {
        materialId_accessType: {
          materialId,
          accessType,
        },
      },
    });
    if (!pricing) {
      return next(new NotFoundError(`No pricing found for access type ${accessType}`));
    }

    // Create a CONTENT order (address from body or default)
    const address = (req.body?.address && String(req.body.address).trim()) ? String(req.body.address).trim() : 'Address not provided';
    const order = await prisma.order.create({
      data: {
        userId,
        total: pricing.price,
        status: 'CREATED',
        orderType: 'CONTENT',
        address,
        items: {
          create: [
            {
              referenceType: 'MATERIAL',
              referenceId: materialId,
              quantity: 1,
              price: pricing.price,
            },
          ],
        },
      },
      include: {
        items: true,
      },
    });

    sendSuccess(res, order, 'Content order for material created successfully', 201);
  } catch (error) {
    next(error);
  }
});

// ============================================
// MATERIALS
// ============================================
const materialController = require('../../controllers/material.controller');
router.get('/materials', validateQuery(paginationSchema.extend({
  categoryId: uuidSchema.optional(),
  collegeId: uuidSchema.optional(),
  departmentId: uuidSchema.optional(),
  materialType: z.string().optional(),
  search: z.string().optional(),
})), materialController.getMaterials);

router.get('/materials/:id', materialController.getMaterialById);
router.post('/materials/:id/download', materialController.incrementDownloads);

// ============================================
// PRINT OPTIONS & PRINT CENTER
// ============================================
// Get print options for a book
router.get('/books/:bookId/print-options', validateQuery(paginationSchema.extend({
  bookId: uuidSchema.optional(),
})), printOptionController.getPrintOptions);

// Get print options for a material
router.get('/materials/:materialId/print-options', validateQuery(paginationSchema.extend({
  materialId: uuidSchema.optional(),
})), printOptionController.getPrintOptions);

// Get all print options (filtered by bookId or materialId)
router.get('/print-options', validateQuery(paginationSchema.extend({
  bookId: uuidSchema.optional(),
  materialId: uuidSchema.optional(),
  hasUploadedFile: z.enum(['true', 'false']).optional(),
})), printOptionController.getPrintOptions);

// Get print option by ID
router.get('/print-options/:id', printOptionController.getPrintOptionById);

// Get print quote for a print option
router.get('/print-options/:id/quote', printOptionController.getPrintQuote);

// Create print order from print option
router.post('/print-options/:id/order', printOptionController.createPrintOrder);

// Print Center - Upload file and create print option
router.post('/print-center/upload', singleUpload('file'), validateBody(z.object({
  colorType: z.enum(['COLOR', 'BLACK_WHITE']),
  copies: z.number().int().positive(),
  paperType: z.enum(['A4', 'A3', 'LETTER']),
  doubleSide: z.boolean(),
  totalPages: z.number().int().positive().optional(),
})), printOptionController.createPrintOptionWithUpload);

// Print Center - Create print option for book
router.post('/print-center/book/:bookId', validateBody(z.object({
  colorType: z.enum(['COLOR', 'BLACK_WHITE']),
  copies: z.number().int().positive(),
  paperType: z.enum(['A4', 'A3', 'LETTER']),
  doubleSide: z.boolean(),
})), async (req, res, next) => {
  try {
    req.body.bookId = req.params.bookId;
    return printOptionController.createPrintOption(req, res, next);
  } catch (error) {
    next(error);
  }
});

// Print Center - Create print option for material
router.post('/print-center/material/:materialId', validateBody(z.object({
  colorType: z.enum(['COLOR', 'BLACK_WHITE']),
  copies: z.number().int().positive(),
  paperType: z.enum(['A4', 'A3', 'LETTER']),
  doubleSide: z.boolean(),
})), async (req, res, next) => {
  try {
    req.body.materialId = req.params.materialId;
    return printOptionController.createPrintOption(req, res, next);
  } catch (error) {
    next(error);
  }
});

// ============================================
// ORDERS
// ============================================
router.get('/orders', validateQuery(paginationSchema.extend({
  status: z.enum(['CREATED', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']).optional(),
})), orderController.getMyOrders);

router.get('/orders/active', validateQuery(paginationSchema), orderController.getActiveOrders);
router.get('/orders/:id', orderController.getOrderById);
router.post('/orders', validateBody(createOrderSchema), orderController.createOrder);
router.post('/orders/:id/cancel', orderController.cancelOrder);

// ============================================
// REVIEWS
// ============================================
router.get('/reviews', validateQuery(paginationSchema.extend({
  targetId: uuidSchema.optional(),
  targetType: z.enum(['BOOK', 'PRODUCT']).optional(),
})), reviewController.getReviews);

router.post('/reviews', validateBody(createReviewSchema), reviewController.createReview);
router.put('/reviews/:id', validateBody(createReviewSchema.partial()), reviewController.updateReview);
router.delete('/reviews/:id', reviewController.deleteReview);

// ============================================
// CART
// ============================================
const cartRoutes = require('../cart.routes');
router.use('/cart', cartRoutes);

// ============================================
// NOTIFICATIONS
// ============================================
router.get('/notifications', validateQuery(paginationSchema.extend({
  isRead: z.enum(['true', 'false']).optional(),
})), async (req, res, next) => {
  try {
    const userId = req.userId;
    const { page, limit } = getPaginationParams(req.query.page, req.query.limit);
    const isRead = req.query.isRead === 'true' ? true : req.query.isRead === 'false' ? false : null;

    const result = await notificationService.getUserNotifications(userId, {
      page,
      limit,
      isRead,
    });

    sendPaginated(res, result.notifications, result.pagination, 'Notifications retrieved successfully');
  } catch (error) {
    next(error);
  }
});

router.get('/notifications/unread-count', async (req, res, next) => {
  try {
    const userId = req.userId;
    const count = await notificationService.getUnreadCount(userId);
    sendSuccess(res, { count }, 'Unread count retrieved successfully');
  } catch (error) {
    next(error);
  }
});

router.put('/notifications/:id/read', async (req, res, next) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const notification = await notificationService.markAsRead(id, userId);
    sendSuccess(res, notification, 'Notification marked as read');
  } catch (error) {
    next(error);
  }
});

router.put('/notifications/read-all', async (req, res, next) => {
  try {
    const userId = req.userId;
    await notificationService.markAllAsRead(userId);
    sendSuccess(res, null, 'All notifications marked as read');
  } catch (error) {
    next(error);
  }
});

module.exports = router;

