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
      `Approved doctor: ${doctor.user.name}`,
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
      `Rejected doctor: ${doctor.user.name}`,
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
                  name: true,
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
      totalBooks,
      totalProducts,
      totalOrders,
      pendingDoctors,
      pendingBooks,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.doctor.count(),
      prisma.student.count(),
      prisma.book.count({ where: { approvalStatus: APPROVAL_STATUS.APPROVED } }),
      prisma.product.count(),
      prisma.order.count(),
      prisma.doctor.count({ where: { approvalStatus: APPROVAL_STATUS.PENDING } }),
      prisma.book.count({ where: { approvalStatus: APPROVAL_STATUS.PENDING } }),
    ]);

    const stats = {
      users: {
        total: totalUsers,
        doctors: totalDoctors,
        students: totalStudents,
      },
      books: {
        total: totalBooks,
        pending: pendingBooks,
      },
      products: {
        total: totalProducts,
      },
      orders: {
        total: totalOrders,
      },
      approvals: {
        pendingDoctors,
        pendingBooks,
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
  logAdminOperation,
};
