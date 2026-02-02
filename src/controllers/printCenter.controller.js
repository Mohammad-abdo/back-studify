/**
 * Print Center Controller
 * Handles print center-related HTTP requests
 */

const prisma = require('../config/database');
const { sendSuccess, sendPaginated, getPaginationParams, buildPagination } = require('../utils/response');
const { NotFoundError, ConflictError } = require('../utils/errors');
const { hashPassword, formatPhoneNumber } = require('../utils/helpers');

/**
 * Get all print centers
 */
const getPrintCenters = async (req, res, next) => {
  try {
    const { page, limit } = getPaginationParams(req.query.page, req.query.limit);
    const { search } = req.query;

    const where = {
      ...(search && {
        OR: [
          { name: { contains: search } },
          { user: { phone: { contains: search } } },
        ],
      }),
    };

    const [centers, total] = await Promise.all([
      prisma.printCenter.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              phone: true,
              email: true,
              avatarUrl: true,
              isActive: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.printCenter.count({ where }),
    ]);

    const pagination = buildPagination(page, limit, total);
    sendPaginated(res, centers, pagination, 'Print centers retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Create print center (Admin only) - creates User + PrintCenter account
 */
const createPrintCenter = async (req, res, next) => {
  try {
    const { phone, password, email, name, location, address, latitude, longitude } = req.body;
    const formattedPhone = formatPhoneNumber(phone);

    const existingUser = await prisma.user.findUnique({
      where: { phone: formattedPhone },
    });
    if (existingUser) {
      throw new ConflictError('Phone number already registered');
    }
    if (email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email },
      });
      if (existingEmail) {
        throw new ConflictError('Email already registered');
      }
    }

    const passwordHash = await hashPassword(password);

    const center = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          phone: formattedPhone,
          password: passwordHash,
          email: email || null,
          type: 'PRINT_CENTER',
          isActive: true,
        },
      });
      const pc = await tx.printCenter.create({
        data: {
          userId: user.id,
          name: name || 'Print Center',
          location: location || null,
          address: address || null,
          latitude: latitude != null ? Number(latitude) : null,
          longitude: longitude != null ? Number(longitude) : null,
        },
        include: {
          user: {
            select: {
              id: true,
              phone: true,
              email: true,
              avatarUrl: true,
              isActive: true,
            },
          },
        },
      });
      return pc;
    });

    sendSuccess(res, center, 'Print center created successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Get print center by ID (with full detail: assignments, stats)
 */
const getPrintCenterById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const center = await prisma.printCenter.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            phone: true,
            email: true,
            avatarUrl: true,
            isActive: true,
          },
        },
        printAssignments: {
          include: {
            order: {
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
            },
          },
          orderBy: { assignedAt: 'desc' },
          take: 100,
        },
      },
    });

    if (!center) {
      throw new NotFoundError('Print center not found');
    }

    const stats = await prisma.printOrderAssignment.aggregate({
      where: { printCenterId: id },
      _count: { id: true },
    });
    const byStatus = await prisma.printOrderAssignment.groupBy({
      by: ['status'],
      where: { printCenterId: id },
      _count: { id: true },
    });

    const response = {
      ...center,
      stats: {
        totalAssignments: stats._count.id,
        byStatus: byStatus.reduce((acc, row) => {
          acc[row.status] = row._count.id;
          return acc;
        }, {}),
      },
    };

    sendSuccess(res, response, 'Print center retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Update print center
 */
const updatePrintCenter = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, location, address, latitude, longitude, isActive } = req.body;

    const data = {};
    if (name !== undefined) data.name = name;
    if (location !== undefined) data.location = location;
    if (address !== undefined) data.address = address;
    if (latitude !== undefined) data.latitude = latitude == null ? null : Number(latitude);
    if (longitude !== undefined) data.longitude = longitude == null ? null : Number(longitude);
    if (isActive !== undefined) data.isActive = isActive;

    const center = await prisma.printCenter.update({
      where: { id },
      data,
    });

    sendSuccess(res, center, 'Print center updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete print center
 */
const deletePrintCenter = async (req, res, next) => {
  try {
    const { id } = req.params;

    const center = await prisma.printCenter.findUnique({
      where: { id },
    });

    if (!center) {
      throw new NotFoundError('Print center not found');
    }

    // Delete user (will cascade delete print center)
    await prisma.user.delete({
      where: { id: center.userId },
    });

    sendSuccess(res, null, 'Print center deleted successfully', 204);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPrintCenters,
  getPrintCenterById,
  createPrintCenter,
  updatePrintCenter,
  deletePrintCenter,
};
