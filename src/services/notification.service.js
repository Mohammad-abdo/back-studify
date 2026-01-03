/**
 * Notification Service
 * Handles user notifications
 */

const prisma = require('../config/database');
const { NotFoundError } = require('../utils/errors');

/**
 * Create notification
 */
const createNotification = async (userId, title, message) => {
  return await prisma.notification.create({
    data: {
      userId,
      title,
      message,
    },
  });
};

/**
 * Get user notifications
 */
const getUserNotifications = async (userId, options = {}) => {
  const { page = 1, limit = 20, isRead = null } = options;

  const skip = (page - 1) * limit;

  const where = {
    userId,
    ...(isRead !== null && { isRead }),
  };

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.notification.count({ where }),
  ]);

  return {
    notifications,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Mark notification as read
 */
const markAsRead = async (notificationId, userId) => {
  const notification = await prisma.notification.findFirst({
    where: {
      id: notificationId,
      userId,
    },
  });

  if (!notification) {
    throw new NotFoundError('Notification not found');
  }

  return await prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });
};

/**
 * Mark all notifications as read
 */
const markAllAsRead = async (userId) => {
  return await prisma.notification.updateMany({
    where: {
      userId,
      isRead: false,
    },
    data: {
      isRead: true,
    },
  });
};

/**
 * Delete notification
 */
const deleteNotification = async (notificationId, userId) => {
  const notification = await prisma.notification.findFirst({
    where: {
      id: notificationId,
      userId,
    },
  });

  if (!notification) {
    throw new NotFoundError('Notification not found');
  }

  return await prisma.notification.delete({
    where: { id: notificationId },
  });
};

/**
 * Get unread count
 */
const getUnreadCount = async (userId) => {
  return await prisma.notification.count({
    where: {
      userId,
      isRead: false,
    },
  });
};

module.exports = {
  createNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
};

