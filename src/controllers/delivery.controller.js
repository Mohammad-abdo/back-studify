/**
 * Delivery Controller
 * Handles delivery-related HTTP requests
 */

const prisma = require('../config/database');
const { sendSuccess, sendPaginated, getPaginationParams, buildPagination } = require('../utils/response');
const { NotFoundError, AuthorizationError } = require('../utils/errors');
const { DELIVERY_STATUS, ORDER_STATUS } = require('../utils/constants');
const { calculateDistanceKm } = require('../utils/helpers');

/**
 * Get delivery profile
 */
const getProfile = async (req, res, next) => {
  try {
    const userId = req.userId;

    const delivery = await prisma.delivery.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            phone: true,
            email: true,
            avatarUrl: true,
          },
        },
        wallet: true,
      },
    });

    if (!delivery) {
      throw new NotFoundError('Delivery profile not found');
    }

    sendSuccess(res, delivery, 'Profile retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Update delivery profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { name, vehicleType, vehiclePlateNumber } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (vehicleType !== undefined) updateData.vehicleType = vehicleType;
    if (vehiclePlateNumber !== undefined) updateData.vehiclePlateNumber = vehiclePlateNumber;

    const delivery = await prisma.delivery.update({
      where: { userId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            phone: true,
            email: true,
            avatarUrl: true,
          },
        },
        wallet: true,
      },
    });

    sendSuccess(res, delivery, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Update delivery status
 */
const updateStatus = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { status } = req.body;

    const delivery = await prisma.delivery.update({
      where: { userId },
      data: { status },
      include: {
        user: {
          select: {
            id: true,
            phone: true,
          },
        },
        wallet: true,
      },
    });

    sendSuccess(res, delivery, 'Status updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get delivery assignments
 */
const getAssignments = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { page, limit } = getPaginationParams(req.query.page, req.query.limit);
    const { status } = req.query;

    const delivery = await prisma.delivery.findUnique({
      where: { userId },
    });

    if (!delivery) {
      throw new NotFoundError('Delivery profile not found');
    }

    const where = {
      deliveryId: delivery.id,
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
                  avatarUrl: true,
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
      }),
      prisma.deliveryAssignment.count({ where }),
    ]);

    const pagination = buildPagination(page, limit, total);

    const assignmentsWithCustomer = assignments.map((a) => {
      const order = a.order || {};
      const user = order.user || {};
      const customerName =
        user.student?.name ||
        user.doctor?.name ||
        user.customer?.contactPerson ||
        user.customer?.entityName ||
        user.phone ||
        null;
      const deliveryAddress = order.address || null;
      const latitude = order.latitude ?? null;
      const longitude = order.longitude ?? null;
      return {
        ...a,
        customerName,
        deliveryAddress,
        latitude,
        longitude,
      };
    });

    sendPaginated(res, assignmentsWithCustomer, pagination, 'Assignments retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Update delivery location
 */
const updateLocation = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { latitude, longitude, address } = req.body;

    const delivery = await prisma.delivery.findUnique({
      where: { userId },
    });

    if (!delivery) {
      throw new NotFoundError('Delivery profile not found');
    }

    const location = await prisma.deliveryLocation.create({
      data: {
        deliveryId: delivery.id,
        latitude,
        longitude,
        address: address || null,
      },
    });

    // Emit socket event for real-time tracking
    const io = req.app.get('io');
    if (io) {
      // Broadcast to admins
      io.to('admin_room').emit('delivery_moved', {
        deliveryId: delivery.id,
        latitude,
        longitude,
        address,
        timestamp: location.createdAt,
      });

      // Check if this delivery is currently assigned to any active orders
      const activeAssignment = await prisma.deliveryAssignment.findFirst({
        where: {
          deliveryId: delivery.id,
          status: { in: ['PROCESSING', 'SHIPPED'] },
        },
      });

      if (activeAssignment) {
        io.to(`order_${activeAssignment.orderId}`).emit('location_updated', {
          deliveryId: delivery.id,
          latitude,
          longitude,
          address,
          timestamp: location.createdAt,
        });
      }
    }

    sendSuccess(res, location, 'Location updated successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Get wallet balance
 */
const getWallet = async (req, res, next) => {
  try {
    const userId = req.userId;

    const delivery = await prisma.delivery.findUnique({
      where: { userId },
      include: {
        wallet: true,
      },
    });

    if (!delivery) {
      throw new NotFoundError('Delivery profile not found');
    }

    // Create wallet if doesn't exist
    if (!delivery.wallet) {
      const wallet = await prisma.deliveryWallet.create({
        data: {
          deliveryId: delivery.id,
          balance: 0,
        },
      });

      return sendSuccess(res, wallet, 'Wallet retrieved successfully');
    }

    sendSuccess(res, delivery.wallet, 'Wallet retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Mark order as picked up
 */
const markPickedUp = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { orderId } = req.params;

    const delivery = await prisma.delivery.findUnique({
      where: { userId },
    });

    if (!delivery) {
      throw new NotFoundError('Delivery profile not found');
    }

    const assignment = await prisma.deliveryAssignment.findFirst({
      where: {
        orderId,
        deliveryId: delivery.id,
      },
    });

    if (!assignment) {
      throw new NotFoundError('Assignment not found');
    }

    const updatedAssignment = await prisma.deliveryAssignment.update({
      where: { id: assignment.id },
      data: {
        status: ORDER_STATUS.PROCESSING,
        pickedUpAt: new Date(),
      },
      include: {
        order: true,
      },
    });

    // Update order status
    await prisma.order.update({
      where: { id: orderId },
      data: { status: ORDER_STATUS.PROCESSING },
    });

    sendSuccess(res, updatedAssignment, 'Order marked as picked up');
  } catch (error) {
    next(error);
  }
};

/**
 * Mark order as delivered
 */
const markDelivered = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { orderId } = req.params;

    const delivery = await prisma.delivery.findUnique({
      where: { userId },
    });

    if (!delivery) {
      throw new NotFoundError('Delivery profile not found');
    }

    const assignment = await prisma.deliveryAssignment.findFirst({
      where: {
        orderId,
        deliveryId: delivery.id,
      },
    });

    if (!assignment) {
      throw new NotFoundError('Assignment not found');
    }

    const updatedAssignment = await prisma.deliveryAssignment.update({
      where: { id: assignment.id },
      data: {
        status: ORDER_STATUS.DELIVERED,
        deliveredAt: new Date(),
      },
      include: {
        order: true,
      },
    });

    // Update order status
    await prisma.order.update({
      where: { id: orderId },
      data: { status: ORDER_STATUS.DELIVERED },
    });

    sendSuccess(res, updatedAssignment, 'Order marked as delivered');
  } catch (error) {
    next(error);
  }
};

/**
 * Get active order – current order the delivery is working on (PROCESSING or SHIPPED)
 */
const getActiveOrder = async (req, res, next) => {
  try {
    const userId = req.userId;

    const delivery = await prisma.delivery.findUnique({
      where: { userId },
    });

    if (!delivery) {
      throw new NotFoundError('Delivery profile not found');
    }

    const assignment = await prisma.deliveryAssignment.findFirst({
      where: {
        deliveryId: delivery.id,
        status: { in: [ORDER_STATUS.PROCESSING, ORDER_STATUS.SHIPPED] },
      },
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
      },
    });

    if (!assignment) {
      throw new NotFoundError('No active order');
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

    const data = {
      ...assignment,
      customerName,
      deliveryAddress: order.address || null,
      latitude: order.latitude ?? null,
      longitude: order.longitude ?? null,
    };

    sendSuccess(res, data, 'Active order retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Polylines – الدليفري يرسل موقعه الحالي (latitude, longitude) في الـ body،
 * الباكند يحسب المسافة بينه وبين وجهة الطلب النشط ويرجع destination + distance + currentLocation.
 */
const postPolylines = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { latitude: currentLat, longitude: currentLng } = req.body;

    const delivery = await prisma.delivery.findUnique({
      where: { userId },
    });

    if (!delivery) {
      throw new NotFoundError('Delivery profile not found');
    }

    const activeAssignment = await prisma.deliveryAssignment.findFirst({
      where: {
        deliveryId: delivery.id,
        status: { in: [ORDER_STATUS.PROCESSING, ORDER_STATUS.SHIPPED] },
      },
      include: {
        order: {
          select: {
            id: true,
            address: true,
            latitude: true,
            longitude: true,
          },
        },
      },
    });

    if (!activeAssignment?.order) {
      throw new NotFoundError('No active order');
    }

    const destLat = activeAssignment.order.latitude;
    const destLng = activeAssignment.order.longitude;

    let distanceKm = null;
    let distanceMeters = null;
    let estimatedMinutes = null;

    if (
      destLat != null &&
      destLng != null &&
      currentLat != null &&
      currentLng != null
    ) {
      distanceKm = Math.round(calculateDistanceKm(currentLat, currentLng, destLat, destLng) * 1000) / 1000;
      distanceMeters = Math.round(distanceKm * 1000);
      estimatedMinutes = Math.max(1, Math.round(distanceKm * 3));
    }

    // استجابة واضحة: إحداثيات وجهة الطلب + موقع الدليفري + المسافة والوقت المحسوبان
    const data = {
      // مكان وصول الطلب (اللوكيشن اللي الدليفري هيوصل له — order destination)
      orderDestination: {
        lat: destLat,
        lng: destLng,
        latitude: destLat,
        longitude: destLng,
        address: activeAssignment.order.address || null,
      },
      // موقع الدليفري الحالي (اللي أرسله في الـ body)
      currentLocation: {
        lat: currentLat,
        lng: currentLng,
        latitude: currentLat,
        longitude: currentLng,
      },
      // نتيجة العملية الحسابية: المسافة والوقت
      distanceKm,
      distanceMeters,
      estimatedMinutes,
      estimatedTimeMinutes: estimatedMinutes,
    };

    sendSuccess(res, data, 'Polylines computed successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Shipping history – orders the delivery has delivered, cancelled, or not yet delivered (paginated)
 */
const getShippingHistory = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { page, limit } = getPaginationParams(req.query.page, req.query.limit);
    const { status } = req.query;

    const delivery = await prisma.delivery.findUnique({
      where: { userId },
    });

    if (!delivery) {
      throw new NotFoundError('Delivery profile not found');
    }

    const where = {
      deliveryId: delivery.id,
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
                  avatarUrl: true,
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
      }),
      prisma.deliveryAssignment.count({ where }),
    ]);

    const pagination = buildPagination(page, limit, total);

    const list = assignments.map((a) => {
      const order = a.order || {};
      const user = order.user || {};
      const customerName =
        user.student?.name ||
        user.doctor?.name ||
        user.customer?.contactPerson ||
        user.customer?.entityName ||
        user.phone ||
        null;
      return {
        ...a,
        customerName,
        deliveryAddress: order.address || null,
        latitude: order.latitude ?? null,
        longitude: order.longitude ?? null,
      };
    });

    sendPaginated(res, list, pagination, 'Shipping history retrieved successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  updateStatus,
  getAssignments,
  updateLocation,
  getWallet,
  markPickedUp,
  markDelivered,
  getActiveOrder,
  postPolylines,
  getShippingHistory,
};

