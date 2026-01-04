/**
 * Mobile Customer Routes
 * Routes optimized for customer (wholesale) mobile app
 */

const express = require('express');
const router = express.Router();
const userController = require('../../controllers/user.controller');
const authController = require('../../controllers/auth.controller');
const customerController = require('../../controllers/customer.controller');
const wholesaleController = require('../../controllers/wholesale.controller');
const productController = require('../../controllers/product.controller');
const categoryController = require('../../controllers/category.controller');
const notificationService = require('../../services/notification.service');
const prisma = require('../../config/database');
const { NotFoundError, ValidationError, AuthorizationError } = require('../../utils/errors');
const { ORDER_STATUS } = require('../../utils/constants');
const authenticate = require('../../middleware/auth.middleware');
const { requireUserType } = require('../../middleware/role.middleware');
const { validateBody, validateQuery } = require('../../middleware/validation.middleware');
const { paginationSchema, uuidSchema } = require('../../utils/validators');
const { sendSuccess, sendPaginated, getPaginationParams, buildPagination } = require('../../utils/response');
const { transformImageUrlsMiddleware } = require('../../middleware/imageUrl.middleware');
const { singleUpload } = require('../../services/fileUpload.service');
const { z } = require('zod');

// All routes require authentication and customer type
router.use(authenticate);
router.use(requireUserType('CUSTOMER'));

// Transform image URLs to full URLs for mobile
router.use(transformImageUrlsMiddleware);

// ============================================
// PROFILE
// ============================================
router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);

// Get customer-specific profile details
router.get('/profile/customer', async (req, res, next) => {
  try {
    const userId = req.userId;
    const customer = await prisma.customer.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            phone: true,
            email: true,
            avatarUrl: true,
            type: true,
            isActive: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            wholesaleOrders: true,
          },
        },
      },
    });

    if (!customer) {
      throw new NotFoundError('Customer profile not found');
    }

    sendSuccess(res, customer, 'Customer profile retrieved successfully');
  } catch (error) {
    next(error);
  }
});

// Update customer-specific profile (entityName, contactPerson, phone)
router.put('/profile/customer', validateBody(z.object({
  entityName: z.string().min(2).max(200).optional(),
  contactPerson: z.string().min(2).max(100).optional(),
  phone: z.string().optional(),
})), async (req, res, next) => {
  try {
    const userId = req.userId;
    const { entityName, contactPerson, phone } = req.body;

    const customer = await prisma.customer.findUnique({
      where: { userId },
    });

    if (!customer) {
      throw new NotFoundError('Customer profile not found');
    }

    const updateData = {};
    if (entityName !== undefined) updateData.entityName = entityName;
    if (contactPerson !== undefined) updateData.contactPerson = contactPerson;
    if (phone !== undefined) updateData.phone = phone;

    const updatedCustomer = await prisma.customer.update({
      where: { id: customer.id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            phone: true,
            email: true,
            avatarUrl: true,
            type: true,
            isActive: true,
          },
        },
      },
    });

    sendSuccess(res, updatedCustomer, 'Customer profile updated successfully');
  } catch (error) {
    next(error);
  }
});

// Upload profile image
router.post('/profile/avatar', singleUpload('avatar'), userController.uploadProfileImage);

// Change password
router.post('/change-password', validateBody(z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(6),
})), authController.changePassword);

// ============================================
// PRODUCTS
// ============================================
router.get('/products', validateQuery(paginationSchema.extend({
  categoryId: uuidSchema.optional(),
  search: z.string().optional(),
})), productController.getProducts);

router.get('/products/:id', productController.getProductById);

// ============================================
// WHOLESALE ORDERS
// ============================================
router.get('/orders', validateQuery(paginationSchema.extend({
  status: z.enum(['CREATED', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']).optional(),
})), wholesaleController.getMyWholesaleOrders);

router.get('/orders/:id', wholesaleController.getWholesaleOrderById);

router.post('/orders', validateBody(z.object({
  items: z.array(z.object({
    productId: uuidSchema,
    quantity: z.number().int().positive(),
    price: z.number().nonnegative(),
  })).min(1),
})), wholesaleController.createWholesaleOrder);

router.post('/orders/:id/cancel', async (req, res, next) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    // Check if user is a customer
    const customer = await prisma.customer.findUnique({
      where: { userId },
    });

    if (!customer) {
      throw new NotFoundError('Customer profile not found');
    }

    const existingOrder = await prisma.wholesaleOrder.findUnique({
      where: { id },
    });

    if (!existingOrder) {
      throw new NotFoundError('Wholesale order not found');
    }

    // Check if order belongs to customer
    if (existingOrder.customerId !== customer.id) {
      throw new NotFoundError('Wholesale order not found');
    }

    // Check if order can be cancelled
    if (existingOrder.status === ORDER_STATUS.DELIVERED) {
      throw new ValidationError('Cannot cancel a delivered order');
    }

    if (existingOrder.status === ORDER_STATUS.CANCELLED) {
      throw new ValidationError('Order is already cancelled');
    }

    const order = await prisma.wholesaleOrder.update({
      where: { id },
      data: { status: ORDER_STATUS.CANCELLED },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    sendSuccess(res, order, 'Wholesale order cancelled successfully');
  } catch (error) {
    next(error);
  }
});

// ============================================
// CATEGORIES (for filtering products)
// ============================================
router.get('/categories/products', categoryController.getProductCategories);

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

