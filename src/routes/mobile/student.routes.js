/**
 * Mobile Student Routes
 * Routes optimized for student mobile app
 */

const express = require('express');
const router = express.Router();
const userController = require('../../controllers/user.controller');
const orderController = require('../../controllers/order.controller');
const reviewController = require('../../controllers/review.controller');
const bookController = require('../../controllers/book.controller');
const productController = require('../../controllers/product.controller');
const notificationService = require('../../services/notification.service');
const authenticate = require('../../middleware/auth.middleware');
const { requireUserType } = require('../../middleware/role.middleware');
const { validateBody, validateQuery } = require('../../middleware/validation.middleware');
const { createOrderSchema, createReviewSchema, paginationSchema, uuidSchema } = require('../../utils/validators');
const { sendSuccess, sendPaginated, getPaginationParams } = require('../../utils/response');
const { z } = require('zod');

// All routes require authentication and student type
router.use(authenticate);
router.use(requireUserType('STUDENT'));

// ============================================
// PROFILE
// ============================================
router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);

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
  search: z.string().optional(),
})), productController.getProducts);

router.get('/products/:id', productController.getProductById);

// ============================================
// ORDERS
// ============================================
router.get('/orders', validateQuery(paginationSchema.extend({
  status: z.enum(['CREATED', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']).optional(),
})), orderController.getMyOrders);

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

