/**
 * Mobile Delivery Routes
 * Routes optimized for delivery mobile app
 */

const express = require('express');
const router = express.Router();
const deliveryController = require('../../controllers/delivery.controller');
const deliveryAssignmentController = require('../../controllers/deliveryAssignment.controller');
const deliveryLocationController = require('../../controllers/deliveryLocation.controller');
const deliveryWalletController = require('../../controllers/deliveryWallet.controller');
const notificationService = require('../../services/notification.service');
const authenticate = require('../../middleware/auth.middleware');
const { requireUserType } = require('../../middleware/role.middleware');
const { validateBody, validateQuery } = require('../../middleware/validation.middleware');
const { paginationSchema } = require('../../utils/validators');
const { sendSuccess, sendPaginated, getPaginationParams } = require('../../utils/response');
const { z } = require('zod');

// All routes require authentication and delivery type
router.use(authenticate);
router.use(requireUserType('DELIVERY'));

// ============================================
// PROFILE
// ============================================
router.get('/profile', deliveryController.getProfile);
router.put('/profile', validateBody(z.object({
  name: z.string().min(2).max(100).optional(),
  vehicleType: z.string().optional(),
  vehiclePlateNumber: z.string().optional(),
})), deliveryController.updateProfile);

// ============================================
// STATUS
// ============================================
router.put('/status', validateBody(z.object({
  status: z.enum(['AVAILABLE', 'ON_DELIVERY', 'OFFLINE']),
})), deliveryController.updateStatus);

// ============================================
// ASSIGNMENTS
// ============================================
router.get('/assignments', validateQuery(paginationSchema.extend({
  status: z.enum(['CREATED', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']).optional(),
})), deliveryController.getAssignments);

router.get('/assignments/:id', deliveryAssignmentController.getAssignmentById);

router.post('/orders/:orderId/pickup', deliveryController.markPickedUp);
router.post('/orders/:orderId/deliver', deliveryController.markDelivered);

// ============================================
// LOCATION TRACKING
// ============================================
router.post('/location', validateBody(z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().optional(),
})), deliveryController.updateLocation);

router.get('/location/history', validateQuery(paginationSchema), deliveryLocationController.getLocationHistory);

// ============================================
// WALLET
// ============================================
router.get('/wallet', deliveryWalletController.getWallet);
router.get('/wallet/transactions', validateQuery(paginationSchema.extend({
  type: z.enum(['DEPOSIT', 'WITHDRAWAL', 'PAYMENT', 'REFUND', 'COMMISSION']).optional(),
  status: z.enum(['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED']).optional(),
})), deliveryWalletController.getTransactions);

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

