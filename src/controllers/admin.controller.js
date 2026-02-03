/**
 * Admin Controller
 * Handles admin-related HTTP requests
 */

const prisma = require('../config/database');
const { sendSuccess, sendPaginated, getPaginationParams, buildPagination } = require('../utils/response');
const { NotFoundError, AuthorizationError, ValidationError } = require('../utils/errors');
const { APPROVAL_STATUS, ADMIN_OPERATION_TYPE } = require('../utils/constants');

/**
 * Log admin operation
 */
const logAdminOperation = async (adminId, operationType, entityType, entityId, description, metadata, req) => {
  await prisma.adminOperationLog.create({
    data: {
      adminId,
      operationType,
      entityType,
      entityId,
      description,
      metadata,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    },
  });
};

/**
 * Approve doctor
 */
const approveDoctor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const adminId = req.user.admin.id;

    const doctor = await prisma.doctor.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });

    if (!doctor) {
      throw new NotFoundError('Doctor not found');
    }

    const updatedDoctor = await prisma.doctor.update({
      where: { id },
      data: {
        approvalStatus: APPROVAL_STATUS.APPROVED,
        approvedAt: new Date(),
      },
      include: {
        user: true,
      },
    });

    await logAdminOperation(
      adminId,
      ADMIN_OPERATION_TYPE.APPROVE,
      'DOCTOR',
      id,
      `Approved doctor: ${doctor.name}`,
      { doctorId: id },
      req
    );

    sendSuccess(res, updatedDoctor, 'Doctor approved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Reject doctor
 */
const rejectDoctor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const adminId = req.user.admin.id;

    const doctor = await prisma.doctor.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });

    if (!doctor) {
      throw new NotFoundError('Doctor not found');
    }

    const updatedDoctor = await prisma.doctor.update({
      where: { id },
      data: {
        approvalStatus: APPROVAL_STATUS.REJECTED,
      },
      include: {
        user: true,
      },
    });

    await logAdminOperation(
      adminId,
      ADMIN_OPERATION_TYPE.REJECT,
      'DOCTOR',
      id,
      `Rejected doctor: ${doctor.name}`,
      { doctorId: id },
      req
    );

    sendSuccess(res, updatedDoctor, 'Doctor rejected successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Approve book
 */
const approveBook = async (req, res, next) => {
  try {
    const { id } = req.params;
    const adminId = req.user.admin.id;

    const book = await prisma.book.findUnique({
      where: { id },
    });

    if (!book) {
      throw new NotFoundError('Book not found');
    }

    const updatedBook = await prisma.book.update({
      where: { id },
      data: {
        approvalStatus: APPROVAL_STATUS.APPROVED,
      },
      include: {
        category: true,
        doctor: true,
      },
    });

    // Approve all pricing for this book
    await prisma.bookPricing.updateMany({
      where: { bookId: id },
      data: {
        approvalStatus: APPROVAL_STATUS.APPROVED,
      },
    });

    await logAdminOperation(
      adminId,
      ADMIN_OPERATION_TYPE.APPROVE,
      'BOOK',
      id,
      `Approved book: ${book.title}`,
      { bookId: id },
      req
    );

    sendSuccess(res, updatedBook, 'Book approved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Reject book
 */
const rejectBook = async (req, res, next) => {
  try {
    const { id } = req.params;
    const adminId = req.user.admin.id;

    const book = await prisma.book.findUnique({
      where: { id },
    });

    if (!book) {
      throw new NotFoundError('Book not found');
    }

    const updatedBook = await prisma.book.update({
      where: { id },
      data: {
        approvalStatus: APPROVAL_STATUS.REJECTED,
      },
      include: {
        category: true,
        doctor: true,
      },
    });

    await logAdminOperation(
      adminId,
      ADMIN_OPERATION_TYPE.REJECT,
      'BOOK',
      id,
      `Rejected book: ${book.title}`,
      { bookId: id },
      req
    );

    sendSuccess(res, updatedBook, 'Book rejected successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get pending approvals
 */
const getPendingApprovals = async (req, res, next) => {
  try {
    const { type } = req.query; // 'DOCTOR' or 'BOOK'

    if (type === 'DOCTOR') {
      const doctors = await prisma.doctor.findMany({
        where: {
          approvalStatus: APPROVAL_STATUS.PENDING,
        },
        include: {
          user: {
            select: {
              id: true,
              phone: true,
              email: true,
              avatarUrl: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return sendSuccess(res, doctors, 'Pending doctors retrieved successfully');
    } else if (type === 'BOOK') {
      const books = await prisma.book.findMany({
        where: {
          approvalStatus: APPROVAL_STATUS.PENDING,
        },
        include: {
          category: true,
          doctor: {
            include: {
              user: {
                select: {
                  id: true,
                  phone: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return sendSuccess(res, books, 'Pending books retrieved successfully');
    }

    throw new ValidationError('Invalid type. Use DOCTOR or BOOK');
  } catch (error) {
    next(error);
  }
};

/**
 * Get admin operation logs
 */
const getOperationLogs = async (req, res, next) => {
  try {
    const { page, limit } = getPaginationParams(req.query.page, req.query.limit);
    const { operationType, entityType } = req.query;

    const where = {
      ...(operationType && { operationType }),
      ...(entityType && { entityType }),
    };

    const [logs, total] = await Promise.all([
      prisma.adminOperationLog.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          admin: {
            include: {
              user: {
                select: {
                  id: true,
                  phone: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.adminOperationLog.count({ where }),
    ]);

    const pagination = buildPagination(page, limit, total);

    sendPaginated(res, logs, pagination, 'Operation logs retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get all users (Admin only)
 */
const getUsers = async (req, res, next) => {
  try {
    const { page, limit } = getPaginationParams(req.query.page, req.query.limit);
    const { type, isActive, search } = req.query;

    const where = {
      ...(type && { type }),
      ...(isActive !== undefined && { isActive: isActive === 'true' }),
      ...(search && {
        OR: [
          { phone: { contains: search } },
          { email: { contains: search } },
        ],
      }),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          phone: true,
          email: true,
          avatarUrl: true,
          type: true,
          isActive: true,
          createdAt: true,
          student: {
            select: {
              id: true,
              name: true,
              college: { select: { id: true, name: true } },
              department: { select: { id: true, name: true } },
            },
          },
          doctor: {
            select: {
              id: true,
              name: true,
              specialization: true,
              approvalStatus: true,
            },
          },
          delivery: {
            select: {
              id: true,
              name: true,
              vehicleType: true,
              status: true,
            },
          },
          customer: {
            select: {
              id: true,
              entityName: true,
              contactPerson: true,
            },
          },
          admin: {
            select: {
              id: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    const pagination = buildPagination(page, limit, total);

    sendPaginated(res, users, pagination, 'Users retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get user by ID (Admin only)
 */
const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        phone: true,
        email: true,
        avatarUrl: true,
        type: true,
        isActive: true,
        createdAt: true,
        student: {
          select: {
            id: true,
            name: true,
            college: { select: { id: true, name: true } },
            department: { select: { id: true, name: true } },
          },
        },
        doctor: {
          select: {
            id: true,
            name: true,
            specialization: true,
            approvalStatus: true,
          },
        },
        delivery: {
          select: {
            id: true,
            name: true,
            vehicleType: true,
            status: true,
          },
        },
        customer: {
          select: {
            id: true,
            entityName: true,
            contactPerson: true,
          },
        },
        admin: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    sendSuccess(res, user, 'User retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Update user (Admin only)
 */
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { phone, email, isActive } = req.body;

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const updateData = {};
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        phone: true,
        email: true,
        avatarUrl: true,
        type: true,
        isActive: true,
        createdAt: true,
      },
    });

    // Log admin operation
    await logAdminOperation(
      req.userId,
      ADMIN_OPERATION_TYPE.UPDATE,
      'USER',
      id,
      `Updated user ${updatedUser.phone}`,
      { changes: updateData },
      req
    );

    sendSuccess(res, updatedUser, 'User updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get dashboard statistics
 */
const getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalDoctors,
      totalStudents,
      totalDelivery,
      totalCustomers,
      totalBooks,
      totalProducts,
      totalOrders,
      totalWholesaleOrders,
      pendingDoctors,
      pendingBooks,
      rejectedBooks,
      totalColleges,
      totalDepartments,
      totalReviews,
      totalBookCategories,
      totalProductCategories,
      totalMaterials,
      totalCarts,
      totalCartItems,
      totalSliders,
      totalPrintOptions,
      // Order type breakdown
      totalProductOrders,
      totalContentOrders,
      totalPrintOrders,
      // Orders by status (for dashboard: pending payment vs paid)
      ordersCreated,
      ordersPaid,
      ordersProcessing,
      ordersShipped,
      ordersDelivered,
      ordersCancelled,
      // Revenue calculations
      totalRevenue,
      totalProductRevenue,
      totalContentRevenue,
      totalWholesaleRevenue,
      // Recent activity (last 7 days)
      recentOrders,
      recentBooks,
      recentProducts,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.doctor.count(),
      prisma.student.count(),
      prisma.delivery.count(),
      prisma.customer.count(),
      prisma.book.count({ where: { approvalStatus: APPROVAL_STATUS.APPROVED } }),
      prisma.product.count(),
      prisma.order.count(),
      prisma.wholesaleOrder.count(),
      prisma.doctor.count({ where: { approvalStatus: APPROVAL_STATUS.PENDING } }),
      prisma.book.count({ where: { approvalStatus: APPROVAL_STATUS.PENDING } }),
      prisma.book.count({ where: { approvalStatus: APPROVAL_STATUS.REJECTED } }),
      prisma.college.count(),
      prisma.department.count(),
      prisma.review.count(),
      prisma.bookCategory.count(),
      prisma.productCategory.count(),
      prisma.material.count(),
      prisma.cart.count(),
      prisma.cartItem.count(),
      prisma.slider.count(),
      prisma.printOption.count(),
      // Order type breakdown
      prisma.order.count({ where: { orderType: 'PRODUCT' } }),
      prisma.order.count({ where: { orderType: 'CONTENT' } }),
      prisma.order.count({ where: { orderType: 'PRINT' } }),
      // Orders by status
      prisma.order.count({ where: { status: 'CREATED' } }),
      prisma.order.count({ where: { status: 'PAID' } }),
      prisma.order.count({ where: { status: 'PROCESSING' } }),
      prisma.order.count({ where: { status: 'SHIPPED' } }),
      prisma.order.count({ where: { status: 'DELIVERED' } }),
      prisma.order.count({ where: { status: 'CANCELLED' } }),
      // Calculate total revenue from completed orders (all types)
      prisma.order.aggregate({
        where: {
          status: {
            in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'],
          },
        },
        _sum: {
          total: true,
        },
      }),
      // Product revenue only
      prisma.order.aggregate({
        where: {
          status: {
            in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'],
          },
          orderType: 'PRODUCT',
        },
        _sum: {
          total: true,
        },
      }),
      // Content revenue (books & materials: READ / BUY / PRINT)
      prisma.order.aggregate({
        where: {
          status: {
            in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'],
          },
          orderType: 'CONTENT',
        },
        _sum: {
          total: true,
        },
      }),
      // Total wholesale revenue
      prisma.wholesaleOrder.aggregate({
        where: {
          status: {
            in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'],
          },
        },
        _sum: {
          total: true,
        },
      }),
      // Recent orders (last 7 days)
      prisma.order.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      // Recent books (last 7 days)
      prisma.book.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      // Recent products (last 7 days)
      prisma.product.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    const stats = {
      users: {
        total: totalUsers,
        doctors: totalDoctors,
        students: totalStudents,
        delivery: totalDelivery,
        customers: totalCustomers,
      },
      books: {
        total: totalBooks,
        pending: pendingBooks,
        rejected: rejectedBooks,
      },
      products: {
        total: totalProducts,
      },
      orders: {
        total: totalOrders,
        wholesale: totalWholesaleOrders,
        pendingPayment: ordersCreated,
        byType: {
          product: totalProductOrders,
          content: totalContentOrders,
          print: totalPrintOrders,
        },
        byStatus: {
          created: ordersCreated,
          paid: ordersPaid,
          processing: ordersProcessing,
          shipped: ordersShipped,
          delivered: ordersDelivered,
          cancelled: ordersCancelled,
        },
      },
      approvals: {
        pendingDoctors,
        pendingBooks,
      },
      colleges: {
        total: totalColleges,
      },
      departments: {
        total: totalDepartments,
      },
      categories: {
        books: totalBookCategories,
        products: totalProductCategories,
      },
      reviews: {
        total: totalReviews,
      },
      materials: {
        total: totalMaterials,
      },
      carts: {
        total: totalCarts,
        items: totalCartItems,
      },
      sliders: {
        total: totalSliders,
      },
      printOptions: {
        total: totalPrintOptions,
      },
      revenue: {
        total: (totalRevenue._sum.total || 0) + (totalWholesaleRevenue._sum.total || 0),
        orders: totalRevenue._sum.total || 0,
        product: totalProductRevenue._sum.total || 0,
        content: totalContentRevenue._sum.total || 0,
        wholesale: totalWholesaleRevenue._sum.total || 0,
      },
      recent: {
        orders: recentOrders,
        books: recentBooks,
        products: recentProducts,
      },
    };

    sendSuccess(res, stats, 'Dashboard statistics retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get all reviews (Admin only)
 */
const getReviews = async (req, res, next) => {
  try {
    const { page, limit } = getPaginationParams(req.query.page, req.query.limit);
    const { targetType } = req.query;

    const where = {
      ...(targetType && { targetType }),
    };

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              phone: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.review.count({ where }),
    ]);

    const pagination = buildPagination(page, limit, total);
    sendPaginated(res, reviews, pagination, 'Reviews retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get recent orders for admin dashboard
 */
const getRecentOrders = async (req, res, next) => {
  try {
    const { page, limit } = getPaginationParams(req.query.page, req.query.limit);
    const { status, orderType } = req.query;

    const where = {
      ...(status && { status }),
      ...(orderType && { orderType }),
    };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              phone: true,
              email: true,
              student: { select: { name: true } },
              doctor: { select: { name: true } },
              customer: { select: { contactPerson: true, entityName: true } },
            },
          },
          items: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.order.count({ where }),
    ]);

    const pagination = buildPagination(page, limit, total);

    const ordersWithCustomer = orders.map((order) => {
      const user = order.user || {};
      const customerName =
        user.student?.name ||
        user.doctor?.name ||
        user.customer?.contactPerson ||
        user.customer?.entityName ||
        user.phone ||
        null;
      const deliveryAddress = order.address || null;
      return {
        ...order,
        customerName,
        deliveryAddress,
      };
    });

    sendPaginated(res, ordersWithCustomer, pagination, 'Orders retrieved successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  approveDoctor,
  rejectDoctor,
  approveBook,
  rejectBook,
  getPendingApprovals,
  getOperationLogs,
  getDashboardStats,
  getUsers,
  getUserById,
  updateUser,
  getReviews,
  getRecentOrders,
  logAdminOperation,
};
