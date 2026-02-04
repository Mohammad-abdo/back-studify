/**
 * Mobile Delivery Routes
 * Routes optimized for delivery mobile app
 */

const express = require('express');
const router = express.Router();
const deliveryController = require('../../controllers/delivery.controller');
const deliveryAssignmentController = require('../../controllers/deliveryAssignment.controller');
const deliveryLocationController = require('../../controllers/deliveryLocation.controller');
const financialTransactionController = require('../../controllers/financialTransaction.controller');
const notificationService = require('../../services/notification.service');
const prisma = require('../../config/database');
const { NotFoundError } = require('../../utils/errors');
const authenticate = require('../../middleware/auth.middleware');
const { requireUserType } = require('../../middleware/role.middleware');
const { validateBody, validateQuery } = require('../../middleware/validation.middleware');
const { paginationSchema } = require('../../utils/validators');
const { sendSuccess, sendPaginated, getPaginationParams, buildPagination } = require('../../utils/response');
const { transformImageUrlsMiddleware } = require('../../middleware/imageUrl.middleware');
const { z } = require('zod');

// All routes require authentication and delivery type
router.use(authenticate);
router.use(requireUserType('DELIVERY'));

// Transform image URLs to full URLs for mobile
router.use(transformImageUrlsMiddleware);

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

router.get('/assignments/:id', deliveryAssignmentController.getDeliveryAssignmentById);

/** GET /active-order – current order the delivery is working on (PROCESSING or SHIPPED) */
router.get('/active-order', deliveryController.getActiveOrder);

/** POST /polylines – إما { latitude, longitude } أو { points: [{ lat, lng }, ...] }. يحسب المسافة والوقت عبر OpenStreetMap (OSRM). */
router.post('/polylines', validateBody(z.union([
  z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }),
  z.object({
    points: z.array(z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    })).min(2),
  }),
])), deliveryController.postPolylines);

/** GET /shipping-history – orders delivered, cancelled, or not yet delivered (paginated) */
router.get('/shipping-history', validateQuery(paginationSchema.extend({
  status: z.enum(['CREATED', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']).optional(),
})), deliveryController.getShippingHistory);

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

router.get('/location/history', validateQuery(paginationSchema), async (req, res, next) => {
  try {
    const userId = req.userId;
    const { page, limit } = getPaginationParams(req.query.page, req.query.limit);

    const delivery = await prisma.delivery.findUnique({
      where: { userId },
    });

    if (!delivery) {
      throw new NotFoundError('Delivery profile not found');
    }

    const where = {
      deliveryId: delivery.id,
    };

    const [locations, total] = await Promise.all([
      prisma.deliveryLocation.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.deliveryLocation.count({ where }),
    ]);

    const pagination = buildPagination(page, limit, total);
    sendPaginated(res, locations, pagination, 'Location history retrieved successfully');
  } catch (error) {
    next(error);
  }
});

// ============================================
// WALLET
// ============================================
router.get('/wallet', deliveryController.getWallet);
router.get('/wallet/transactions', validateQuery(paginationSchema.extend({
  type: z.enum(['DEPOSIT', 'WITHDRAWAL', 'PAYMENT', 'REFUND', 'COMMISSION']).optional(),
  status: z.enum(['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED']).optional(),
})), async (req, res, next) => {
  try {
    const userId = req.userId;
    const { page, limit } = getPaginationParams(req.query.page, req.query.limit);
    const { type, status } = req.query;

    const delivery = await prisma.delivery.findUnique({
      where: { userId },
    });

    if (!delivery) {
      throw new NotFoundError('Delivery profile not found');
    }

    const where = {
      deliveryId: delivery.id,
      ...(type && { type }),
      ...(status && { status }),
    };

    const [transactions, total] = await Promise.all([
      prisma.financialTransaction.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.financialTransaction.count({ where }),
    ]);

    const pagination = buildPagination(page, limit, total);
    sendPaginated(res, transactions, pagination, 'Transactions retrieved successfully');
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

