/**
 * Mobile Doctor Routes
 * Routes optimized for doctor mobile app
 */

const express = require('express');
const router = express.Router();
const userController = require('../../controllers/user.controller');
const bookController = require('../../controllers/book.controller');
const orderController = require('../../controllers/order.controller');
const notificationService = require('../../services/notification.service');
const authenticate = require('../../middleware/auth.middleware');
const { requireUserType } = require('../../middleware/role.middleware');
const { validateBody, validateQuery } = require('../../middleware/validation.middleware');
const { paginationSchema, uuidSchema } = require('../../utils/validators');
const { sendSuccess, sendPaginated, getPaginationParams } = require('../../utils/response');
const { transformImageUrlsMiddleware } = require('../../middleware/imageUrl.middleware');
const { z } = require('zod');

// All routes require authentication and doctor type
router.use(authenticate);
router.use(requireUserType('DOCTOR'));

// Transform image URLs to full URLs for mobile
router.use(transformImageUrlsMiddleware);

// ============================================
// PROFILE
// ============================================
router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);

// ============================================
// MY BOOKS
// ============================================
router.get('/books', validateQuery(paginationSchema.extend({
  approvalStatus: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  categoryId: uuidSchema.optional(),
  search: z.string().optional(),
})), async (req, res, next) => {
  try {
    // Get books created by this doctor
    const doctorId = req.user.doctor?.id;
    if (!doctorId) {
      return res.status(404).json({ success: false, error: { message: 'Doctor profile not found' } });
    }
    
    // Use book controller but filter by doctor
    req.query.doctorId = doctorId;
    return bookController.getBooks(req, res, next);
  } catch (error) {
    next(error);
  }
});

router.get('/books/:id', bookController.getBookById);

router.post('/books', validateBody(z.object({
  title: z.string().min(2).max(200),
  description: z.string().min(10),
  fileUrl: z.string().url(),
  imageUrls: z.array(z.string().url()).optional(),
  totalPages: z.number().int().positive(),
  categoryId: uuidSchema,
  collegeId: uuidSchema.optional(),
  departmentId: uuidSchema.optional(),
})), bookController.createBook);

router.put('/books/:id', validateBody(z.object({
  title: z.string().min(2).max(200).optional(),
  description: z.string().min(10).optional(),
  fileUrl: z.string().url().optional(),
  imageUrls: z.array(z.string().url()).optional(),
  totalPages: z.number().int().positive().optional(),
  categoryId: uuidSchema.optional(),
  collegeId: uuidSchema.optional(),
  departmentId: uuidSchema.optional(),
})), bookController.updateBook);

router.delete('/books/:id', bookController.deleteBook);

// Book pricing
router.post('/books/:id/pricing', validateBody(z.object({
  accessType: z.enum(['READ', 'BUY', 'PRINT']),
  price: z.number().nonnegative(),
})), bookController.addBookPricing);

// ============================================
// BOOK STATISTICS
// ============================================
router.get('/books/:id/stats', async (req, res, next) => {
  try {
    // Get book statistics (views, orders, reviews)
    // This would need to be implemented in book controller
    sendSuccess(res, { message: 'Book statistics endpoint - to be implemented' }, 'Book statistics');
  } catch (error) {
    next(error);
  }
});

// ============================================
// ORDERS (for books sold)
// ============================================
router.get('/orders', validateQuery(paginationSchema.extend({
  status: z.enum(['CREATED', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']).optional(),
})), async (req, res, next) => {
  try {
    // Get orders for books created by this doctor
    // This would need custom implementation
    sendSuccess(res, { message: 'Doctor orders endpoint - to be implemented' }, 'Orders');
  } catch (error) {
    next(error);
  }
});

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

