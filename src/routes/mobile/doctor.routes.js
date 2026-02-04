/**
 * Mobile Doctor Routes
 * Routes optimized for doctor mobile app
 */

const express = require('express');
const router = express.Router();
const userController = require('../../controllers/user.controller');
const authController = require('../../controllers/auth.controller');
const bookController = require('../../controllers/book.controller');
const bookPricingController = require('../../controllers/bookPricing.controller');
const materialController = require('../../controllers/material.controller');
const productController = require('../../controllers/product.controller');
const orderController = require('../../controllers/order.controller');
const reviewController = require('../../controllers/review.controller');
const doctorController = require('../../controllers/doctor.controller');
const notificationService = require('../../services/notification.service');
const prisma = require('../../config/database');
const { NotFoundError } = require('../../utils/errors');
const authenticate = require('../../middleware/auth.middleware');
const { requireUserType } = require('../../middleware/role.middleware');
const { validateBody, validateQuery } = require('../../middleware/validation.middleware');
const { paginationSchema, uuidSchema } = require('../../utils/validators');
const { sendSuccess, sendPaginated, getPaginationParams, buildPagination } = require('../../utils/response');
const { transformImageUrlsMiddleware } = require('../../middleware/imageUrl.middleware');
const { singleUpload } = require('../../services/fileUpload.service');
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

// Update doctor-specific profile (name, specialization, collegeId, departmentId)
router.put('/profile/doctor', validateBody(z.object({
  name: z.string().min(2).max(100).optional(),
  specialization: z.string().min(2).max(200).optional(),
  collegeId: uuidSchema.optional().nullable(),
  departmentId: uuidSchema.optional().nullable(),
})), userController.updateDoctorProfile);

// Upload profile image
router.post('/profile/avatar', singleUpload('avatar'), userController.uploadProfileImage);

// Change password
router.post('/change-password', validateBody(z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(6),
})), authController.changePassword);

// Delete account
router.delete('/profile', userController.deleteAccount);

// ============================================
// STATISTICS (dashboard)
// ============================================
router.get('/stats', doctorController.getDoctorStats);

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

// ============================================
// BOOK PRICING (must come before /books/:id)
// ============================================
router.get('/books/:bookId/pricing', validateQuery(paginationSchema), async (req, res, next) => {
  try {
    const doctorId = req.user.doctor?.id;
    if (!doctorId) {
      return res.status(404).json({ success: false, error: { message: 'Doctor profile not found' } });
    }

    // Verify book belongs to doctor
    const book = await prisma.book.findUnique({
      where: { id: req.params.bookId },
    });

    if (!book) {
      throw new NotFoundError('Book not found');
    }

    if (book.doctorId !== doctorId) {
      throw new NotFoundError('Book not found');
    }

    req.query.bookId = req.params.bookId;
    return bookPricingController.getBookPricings(req, res, next);
  } catch (error) {
    next(error);
  }
});

router.get('/books/:bookId/pricing/:id', async (req, res, next) => {
  try {
    const doctorId = req.user.doctor?.id;
    if (!doctorId) {
      return res.status(404).json({ success: false, error: { message: 'Doctor profile not found' } });
    }

    // Verify book belongs to doctor
    const pricing = await prisma.bookPricing.findUnique({
      where: { id: req.params.id },
      include: { book: true },
    });

    if (!pricing) {
      throw new NotFoundError('Book pricing not found');
    }

    if (pricing.book.doctorId !== doctorId) {
      throw new NotFoundError('Book pricing not found');
    }

    return bookPricingController.getBookPricingById(req, res, next);
  } catch (error) {
    next(error);
  }
});

router.post('/books/:id/pricing', validateBody(z.object({
  accessType: z.enum(['READ', 'BUY', 'PRINT']),
  price: z.number().nonnegative(),
})), bookController.addBookPricing);

router.put('/books/:bookId/pricing/:id', validateBody(z.object({
  price: z.number().nonnegative().optional(),
})), async (req, res, next) => {
  try {
    const doctorId = req.user.doctor?.id;
    if (!doctorId) {
      return res.status(404).json({ success: false, error: { message: 'Doctor profile not found' } });
    }

    // Verify book belongs to doctor
    const pricing = await prisma.bookPricing.findUnique({
      where: { id: req.params.id },
      include: { book: true },
    });

    if (!pricing) {
      throw new NotFoundError('Book pricing not found');
    }

    if (pricing.book.doctorId !== doctorId) {
      throw new NotFoundError('Book pricing not found');
    }

    return bookPricingController.updateBookPricing(req, res, next);
  } catch (error) {
    next(error);
  }
});

router.delete('/books/:bookId/pricing/:id', async (req, res, next) => {
  try {
    const doctorId = req.user.doctor?.id;
    if (!doctorId) {
      return res.status(404).json({ success: false, error: { message: 'Doctor profile not found' } });
    }

    // Verify book belongs to doctor
    const pricing = await prisma.bookPricing.findUnique({
      where: { id: req.params.id },
      include: { book: true },
    });

    if (!pricing) {
      throw new NotFoundError('Book pricing not found');
    }

    if (pricing.book.doctorId !== doctorId) {
      throw new NotFoundError('Book pricing not found');
    }

    return bookPricingController.deleteBookPricing(req, res, next);
  } catch (error) {
    next(error);
  }
});

// ============================================
// BOOK STATISTICS (must come before /books/:id)
// ============================================
router.get('/books/:id/stats', async (req, res, next) => {
  try {
    const doctorId = req.user.doctor?.id;
    if (!doctorId) {
      return res.status(404).json({ success: false, error: { message: 'Doctor profile not found' } });
    }

    const { id } = req.params;

    // Verify book belongs to doctor
    const book = await prisma.book.findUnique({
      where: { id },
    });

    if (!book) {
      throw new NotFoundError('Book not found');
    }

    if (book.doctorId !== doctorId) {
      throw new NotFoundError('Book not found');
    }

    // Get statistics
    const [ordersCount, reviewsCount, totalRevenue] = await Promise.all([
      prisma.orderItem.count({
        where: {
          referenceType: 'BOOK',
          referenceId: id,
        },
      }),
      prisma.review.count({
        where: {
          targetType: 'BOOK',
          targetId: id,
        },
      }),
      prisma.orderItem.aggregate({
        where: {
          referenceType: 'BOOK',
          referenceId: id,
          order: {
            status: {
              in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'],
            },
          },
        },
        _sum: {
          price: true,
        },
      }),
    ]);

    const stats = {
      orders: ordersCount,
      reviews: reviewsCount,
      totalRevenue: totalRevenue._sum.price || 0,
      averageRating: 0, // Can be calculated from reviews if needed
    };

    // Calculate average rating
    const reviews = await prisma.review.findMany({
      where: {
        targetType: 'BOOK',
        targetId: id,
      },
      select: {
        rating: true,
      },
    });

    if (reviews.length > 0) {
      const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
      stats.averageRating = sum / reviews.length;
    }

    sendSuccess(res, stats, 'Book statistics retrieved successfully');
  } catch (error) {
    next(error);
  }
});

// ============================================
// BOOK REVIEWS (for doctor's books) - must come before /books/:id
// ============================================
router.get('/books/:id/reviews', validateQuery(paginationSchema), async (req, res, next) => {
  try {
    const doctorId = req.user.doctor?.id;
    if (!doctorId) {
      return res.status(404).json({ success: false, error: { message: 'Doctor profile not found' } });
    }

    // Verify book belongs to doctor
    const book = await prisma.book.findUnique({
      where: { id: req.params.id },
    });

    if (!book) {
      throw new NotFoundError('Book not found');
    }

    if (book.doctorId !== doctorId) {
      throw new NotFoundError('Book not found');
    }

    req.query.targetId = req.params.id;
    req.query.targetType = 'BOOK';
    return reviewController.getReviews(req, res, next);
  } catch (error) {
    next(error);
  }
});

// ============================================
// GET BOOK BY ID (must come after all specific routes)
// ============================================
router.get('/books/:id', bookController.getBookById);

// ============================================
// ORDERS (for books sold)
// ============================================
router.get('/orders', validateQuery(paginationSchema.extend({
  status: z.enum(['CREATED', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']).optional(),
  bookId: uuidSchema.optional(),
})), async (req, res, next) => {
  try {
    const doctorId = req.user.doctor?.id;
    if (!doctorId) {
      return res.status(404).json({ success: false, error: { message: 'Doctor profile not found' } });
    }

    const { page, limit } = getPaginationParams(req.query.page, req.query.limit);
    const { status, bookId } = req.query;

    // Get all books by this doctor
    const doctorBooks = await prisma.book.findMany({
      where: { doctorId },
      select: { id: true },
    });

    const bookIds = doctorBooks.map(book => book.id);

    if (bookIds.length === 0) {
      return sendPaginated(res, [], buildPagination(page, limit, 0), 'Orders retrieved successfully');
    }

    // Build where clause
    const where = {
      items: {
        some: {
          referenceType: 'BOOK',
          referenceId: {
            in: bookIds,
          },
          ...(bookId && { referenceId: bookId }),
        },
      },
      ...(status && { status }),
    };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          items: {
            where: {
              referenceType: 'BOOK',
              referenceId: {
                in: bookIds,
              },
            },
            include: {
              order: {
                select: {
                  id: true,
                  status: true,
                  createdAt: true,
                },
              },
            },
          },
          user: {
            select: {
              id: true,
              phone: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.order.count({ where }),
    ]);

    const pagination = buildPagination(page, limit, total);
    sendPaginated(res, orders, pagination, 'Orders retrieved successfully');
  } catch (error) {
    next(error);
  }
});

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
// MATERIALS
// ============================================
router.get('/materials', validateQuery(paginationSchema.extend({
  categoryId: uuidSchema.optional(),
  collegeId: uuidSchema.optional(),
  departmentId: uuidSchema.optional(),
  materialType: z.string().optional(),
  search: z.string().optional(),
  approvalStatus: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
})), async (req, res, next) => {
  try {
    // Get materials created by this doctor
    const doctorId = req.user.doctor?.id;
    if (!doctorId) {
      return res.status(404).json({ success: false, error: { message: 'Doctor profile not found' } });
    }
    
    // Use material controller but filter by doctor
    req.query.doctorId = doctorId;
    return materialController.getMaterials(req, res, next);
  } catch (error) {
    next(error);
  }
});

router.post('/materials', validateBody(z.object({
  title: z.string().min(2).max(200),
  description: z.string().min(10),
  fileUrl: z.string().url(),
  imageUrls: z.array(z.string().url()).optional(),
  totalPages: z.number().int().positive().optional(),
  categoryId: uuidSchema,
  collegeId: uuidSchema.optional(),
  departmentId: uuidSchema.optional(),
  materialType: z.string().optional(),
  pricing: z.array(z.object({
    accessType: z.enum(['READ', 'BUY', 'PRINT']),
    price: z.number().nonnegative(),
  })).optional(),
})), materialController.createMaterial);

router.put('/materials/:id', validateBody(z.object({
  title: z.string().min(2).max(200).optional(),
  description: z.string().min(10).optional(),
  fileUrl: z.string().url().optional(),
  imageUrls: z.array(z.string().url()).optional(),
  totalPages: z.number().int().positive().optional(),
  categoryId: uuidSchema.optional(),
  collegeId: uuidSchema.optional(),
  departmentId: uuidSchema.optional(),
  materialType: z.string().optional(),
})), materialController.updateMaterial);

router.delete('/materials/:id', materialController.deleteMaterial);

router.post('/materials/:id/pricing', validateBody(z.object({
  accessType: z.enum(['READ', 'BUY', 'PRINT']),
  price: z.number().nonnegative(),
})), materialController.addMaterialPricing);

router.get('/materials/:id', materialController.getMaterialById);

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

