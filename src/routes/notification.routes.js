/**
 * Notification Routes
 */

const express = require('express');
const router = express.Router();
const notificationService = require('../services/notification.service');
const { sendSuccess, sendPaginated, getPaginationParams, buildPagination } = require('../utils/response');
const authenticate = require('../middleware/auth.middleware');
const { validateQuery } = require('../middleware/validation.middleware');
const { paginationSchema, uuidSchema } = require('../utils/validators');
const { z } = require('zod');

// All routes require authentication
router.use(authenticate);

/**
 * Get user notifications
 */
router.get('/', validateQuery(paginationSchema.extend({
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

/**
 * Get unread count
 */
router.get('/unread-count', async (req, res, next) => {
  try {
    const userId = req.userId;
    const count = await notificationService.getUnreadCount(userId);

    sendSuccess(res, { count }, 'Unread count retrieved successfully');
  } catch (error) {
    next(error);
  }
});

/**
 * Mark notification as read
 */
router.put('/:id/read', async (req, res, next) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const notification = await notificationService.markAsRead(id, userId);

    sendSuccess(res, notification, 'Notification marked as read');
  } catch (error) {
    next(error);
  }
});

/**
 * Mark all notifications as read
 */
router.put('/read-all', async (req, res, next) => {
  try {
    const userId = req.userId;

    await notificationService.markAllAsRead(userId);

    sendSuccess(res, null, 'All notifications marked as read');
  } catch (error) {
    next(error);
  }
});

/**
 * Delete notification
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    await notificationService.deleteNotification(id, userId);

    sendSuccess(res, null, 'Notification deleted successfully');
  } catch (error) {
    next(error);
  }
});

module.exports = router;
