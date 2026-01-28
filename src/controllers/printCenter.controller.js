/**
 * Print Center Controller
 * Handles print center-related HTTP requests
 */

const prisma = require('../config/database');
const { sendSuccess, sendPaginated, getPaginationParams, buildPagination } = require('../utils/response');
const { NotFoundError } = require('../utils/errors');

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
 * Get print center by ID
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
      },
    });

    if (!center) {
      throw new NotFoundError('Print center not found');
    }

    sendSuccess(res, center, 'Print center retrieved successfully');
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
    const { name, location, isActive } = req.body;

    const center = await prisma.printCenter.update({
      where: { id },
      data: {
        name,
        location,
        isActive,
      },
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
  updatePrintCenter,
  deletePrintCenter,
};
