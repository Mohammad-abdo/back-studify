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
// PRINT OPTIONS (for books)
// ============================================
router.get('/books/:bookId/print-options', validateQuery(paginationSchema), printOptionController.getPrintOptions);

router.get('/print-options/:id', printOptionController.getPrintOptionById);

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

