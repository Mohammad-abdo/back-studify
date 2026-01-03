/**
 * Delivery Location Controller
 * Handles delivery location-related HTTP requests (Admin only for viewing)
 */

const prisma = require('../config/database');
const { sendSuccess, sendPaginated, getPaginationParams, buildPagination } = require('../utils/response');
const { NotFoundError } = require('../utils/errors');

/**
 * Get all delivery locations
 */
const getDeliveryLocations = async (req, res, next) => {
  try {
    const { page, limit } = getPaginationParams(req.query.page, req.query.limit);
    const { deliveryId, startDate, endDate } = req.query;

    const where = {
      ...(deliveryId && { deliveryId }),
      ...(startDate || endDate ? {
        createdAt: {
          ...(startDate && { gte: new Date(startDate) }),
          ...(endDate && { lte: new Date(endDate) }),
        },
      } : {}),
    };

    const [locations, total] = await Promise.all([
      prisma.deliveryLocation.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          delivery: {
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
      prisma.deliveryLocation.count({ where }),
    ]);

    const pagination = buildPagination(page, limit, total);
    sendPaginated(res, locations, pagination, 'Delivery locations retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get delivery location by ID
 */
const getDeliveryLocationById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const location = await prisma.deliveryLocation.findUnique({
      where: { id },
      include: {
        delivery: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!location) {
      throw new NotFoundError('Delivery location not found');
    }

    sendSuccess(res, location, 'Delivery location retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete delivery location (Admin only)
 */
const deleteDeliveryLocation = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingLocation = await prisma.deliveryLocation.findUnique({
      where: { id },
    });

    if (!existingLocation) {
      throw new NotFoundError('Delivery location not found');
    }

    await prisma.deliveryLocation.delete({
      where: { id },
    });

    sendSuccess(res, null, 'Delivery location deleted successfully', 204);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDeliveryLocations,
  getDeliveryLocationById,
  deleteDeliveryLocation,
};


