/**
 * Delivery Assignment Controller
 * Handles delivery assignment-related HTTP requests (Admin only for CRUD)
 */

const prisma = require('../config/database');
const { sendSuccess, sendPaginated, getPaginationParams, buildPagination } = require('../utils/response');
const { NotFoundError, ConflictError } = require('../utils/errors');

/**
 * Get all delivery assignments
 */
const getDeliveryAssignments = async (req, res, next) => {
  try {
    const { page, limit } = getPaginationParams(req.query.page, req.query.limit);
    const { deliveryId, orderId, status } = req.query;

    const where = {
      ...(deliveryId && { deliveryId }),
      ...(orderId && { orderId }),
      ...(status && { status }),
    };

    const [assignments, total] = await Promise.all([
      prisma.deliveryAssignment.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          order: {
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
        orderBy: { assignedAt: 'desc' },
      }),
      prisma.deliveryAssignment.count({ where }),
    ]);

    const pagination = buildPagination(page, limit, total);
    sendPaginated(res, assignments, pagination, 'Delivery assignments retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get delivery assignment by ID
 */
const getDeliveryAssignmentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const assignment = await prisma.deliveryAssignment.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            user: {
              select: {
                id: true,
                phone: true,
                email: true,
                avatarUrl: true,
                student: { select: { name: true } },
                doctor: { select: { name: true } },
                customer: { select: { contactPerson: true, entityName: true } },
              },
            },
            items: true,
          },
        },
        delivery: {
          include: {
            user: {
              select: {
                id: true,
                phone: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    if (!assignment) {
      throw new NotFoundError('Delivery assignment not found');
    }

    const order = assignment.order || {};
    const user = order.user || {};
    const customerName =
      user.student?.name ||
      user.doctor?.name ||
      user.customer?.contactPerson ||
      user.customer?.entityName ||
      user.phone ||
      null;
    const deliveryAddress = order.address || null;

    const response = {
      ...assignment,
      customerName,
      deliveryAddress,
    };

    sendSuccess(res, response, 'Delivery assignment retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Create delivery assignment (Admin only)
 */
const createDeliveryAssignment = async (req, res, next) => {
  try {
    const { orderId, deliveryId, status } = req.body;

    // Check if order exists
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    // Check if delivery exists
    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId },
    });

    if (!delivery) {
      throw new NotFoundError('Delivery not found');
    }

    // Check if assignment already exists
    const existingAssignment = await prisma.deliveryAssignment.findUnique({
      where: { orderId },
    });

    if (existingAssignment) {
      throw new ConflictError('Order already has a delivery assignment');
    }

    const assignment = await prisma.deliveryAssignment.create({
      data: {
        orderId,
        deliveryId,
        status: status || 'CREATED',
      },
      include: {
        order: true,
        delivery: true,
      },
    });

    sendSuccess(res, assignment, 'Delivery assignment created successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Update delivery assignment (Admin only)
 */
const updateDeliveryAssignment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, pickedUpAt, deliveredAt } = req.body;

    const existingAssignment = await prisma.deliveryAssignment.findUnique({
      where: { id },
    });

    if (!existingAssignment) {
      throw new NotFoundError('Delivery assignment not found');
    }

    const updateData = {};
    if (status !== undefined) updateData.status = status;
    if (pickedUpAt !== undefined) updateData.pickedUpAt = pickedUpAt ? new Date(pickedUpAt) : null;
    if (deliveredAt !== undefined) updateData.deliveredAt = deliveredAt ? new Date(deliveredAt) : null;

    const assignment = await prisma.deliveryAssignment.update({
      where: { id },
      data: updateData,
      include: {
        order: true,
        delivery: true,
      },
    });

    sendSuccess(res, assignment, 'Delivery assignment updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete delivery assignment (Admin only)
 */
const deleteDeliveryAssignment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingAssignment = await prisma.deliveryAssignment.findUnique({
      where: { id },
    });

    if (!existingAssignment) {
      throw new NotFoundError('Delivery assignment not found');
    }

    await prisma.deliveryAssignment.delete({
      where: { id },
    });

    sendSuccess(res, null, 'Delivery assignment deleted successfully', 204);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDeliveryAssignments,
  getDeliveryAssignmentById,
  createDeliveryAssignment,
  updateDeliveryAssignment,
  deleteDeliveryAssignment,
};

