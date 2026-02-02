/**
 * Print Order Assignment Controller
 * Handles print order assignments (admin + print center dashboard)
 */

const prisma = require('../config/database');
const { sendSuccess, sendPaginated, getPaginationParams, buildPagination } = require('../utils/response');
const { NotFoundError, AuthorizationError, ValidationError } = require('../utils/errors');

/**
 * Enrich order items with reference (Book/Material) title and fileUrl for printing
 */
async function enrichOrderItems(items) {
  if (!items || !items.length) return items;
  const bookIds = [...new Set(items.filter(i => i.referenceType === 'BOOK').map(i => i.referenceId))];
  const materialIds = [...new Set(items.filter(i => i.referenceType === 'MATERIAL').map(i => i.referenceId))];
  const [books, materials] = await Promise.all([
    bookIds.length ? prisma.book.findMany({ where: { id: { in: bookIds } }, select: { id: true, title: true, fileUrl: true } }) : [],
    materialIds.length ? prisma.material.findMany({ where: { id: { in: materialIds } }, select: { id: true, title: true, fileUrl: true } }) : [],
  ]);
  const bookMap = Object.fromEntries(books.map(b => [b.id, b]));
  const materialMap = Object.fromEntries(materials.map(m => [m.id, m]));
  return items.map(item => {
    const ref = item.referenceType === 'BOOK' ? bookMap[item.referenceId] : item.referenceType === 'MATERIAL' ? materialMap[item.referenceId] : null;
    return {
      ...item,
      reference: ref ? { title: ref.title, fileUrl: ref.fileUrl } : { title: 'عنصر طباعة', fileUrl: null },
    };
  });
}

/**
 * Get assignments for current print center (my orders)
 */
const getMyAssignments = async (req, res, next) => {
  try {
    const printCenterId = req.printCenterId;
    if (!printCenterId) {
      throw new AuthorizationError('Print center access required');
    }

    const { page, limit } = getPaginationParams(req.query.page, req.query.limit);
    const { status } = req.query;

    const where = { printCenterId };
    if (status) {
      where.status = status;
    }

    const [assignments, total] = await Promise.all([
      prisma.printOrderAssignment.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          order: {
            include: {
              items: true,
              user: {
                select: {
                  id: true,
                  phone: true,
                  email: true,
                  student: { select: { name: true } },
                },
              },
            },
          },
          printCenter: {
            select: { id: true, name: true, location: true, address: true },
          },
        },
        orderBy: { assignedAt: 'desc' },
      }),
      prisma.printOrderAssignment.count({ where }),
    ]);

    for (const a of assignments) {
      if (a.order?.items?.length) {
        a.order.items = await enrichOrderItems(a.order.items);
      }
    }

    const pagination = buildPagination(page, limit, total);
    sendPaginated(res, assignments, pagination, 'Assignments retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get all print order assignments (Admin only)
 */
const getAllAssignments = async (req, res, next) => {
  try {
    const { page, limit } = getPaginationParams(req.query.page, req.query.limit);
    const { status, printCenterId } = req.query;

    const where = {};
    if (status) where.status = status;
    if (printCenterId) where.printCenterId = printCenterId;

    const [assignments, total] = await Promise.all([
      prisma.printOrderAssignment.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          order: {
            include: {
              items: true,
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
            },
          },
          printCenter: {
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
      prisma.printOrderAssignment.count({ where }),
    ]);

    for (const a of assignments) {
      if (a.order?.items?.length) {
        a.order.items = await enrichOrderItems(a.order.items);
      }
      const user = a.order?.user || {};
      a.customerName = user.student?.name || user.doctor?.name || user.customer?.contactPerson || user.customer?.entityName || user.phone || null;
      a.deliveryAddress = a.order?.address || null;
    }

    const pagination = buildPagination(page, limit, total);
    sendPaginated(res, assignments, pagination, 'Assignments retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get assignment by ID
 */
const getAssignmentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const assignment = await prisma.printOrderAssignment.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            items: true,
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
          },
        },
        printCenter: {
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
    });

    if (!assignment) {
      throw new NotFoundError('Assignment not found');
    }

    const user = assignment.order?.user || {};
    assignment.customerName = user.student?.name || user.doctor?.name || user.customer?.contactPerson || user.customer?.entityName || user.phone || null;
    assignment.deliveryAddress = assignment.order?.address || null;

    // Print center can only view their own
    if (req.userType === 'PRINT_CENTER' && assignment.printCenterId !== req.printCenterId) {
      throw new NotFoundError('Assignment not found');
    }

    if (assignment.order?.items?.length) {
      assignment.order.items = await enrichOrderItems(assignment.order.items);
    }

    sendSuccess(res, assignment, 'Assignment retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Update assignment status (Print center or Admin)
 */
const updateAssignmentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const assignment = await prisma.printOrderAssignment.findUnique({
      where: { id },
      include: { order: true, printCenter: true },
    });

    if (!assignment) {
      throw new NotFoundError('Assignment not found');
    }

    if (req.userType === 'PRINT_CENTER' && assignment.printCenterId !== req.printCenterId) {
      throw new AuthorizationError('You can only update your own assignments');
    }

    const validStatuses = ['PENDING', 'ACCEPTED', 'PRINTING', 'READY_FOR_PICKUP', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      throw new ValidationError('Invalid status');
    }

    const data = { status };
    if (notes !== undefined) data.notes = notes;
    if (status === 'ACCEPTED' && !assignment.acceptedAt) {
      data.acceptedAt = new Date();
    }
    if (status === 'COMPLETED') {
      data.completedAt = new Date();
    }

    const updated = await prisma.printOrderAssignment.update({
      where: { id },
      data,
      include: {
        order: {
          include: {
            items: true,
            user: { select: { id: true, phone: true } },
          },
        },
        printCenter: {
          select: { id: true, name: true },
        },
      },
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`print_center_${assignment.printCenterId}`).emit('print_order_status_updated', updated);
      io.emit('order_updated', updated.order); // Notify order owner if needed
    }

    sendSuccess(res, updated, 'Assignment status updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Public order tracking endpoint (no authentication required)
 * Supports full order UUID or short id (e.g. 940b0963)
 */
const trackOrder = async (req, res, next) => {
  try {
    let { orderId } = req.params;
    orderId = (orderId || '').trim().replace(/^#+/, '');
    if (!orderId) {
      throw new NotFoundError('No print assignment found for this order');
    }

    let assignment = await prisma.printOrderAssignment.findUnique({
      where: { orderId },
      include: {
        order: {
          include: {
            items: true,
            user: { select: { phone: true } },
          },
        },
        printCenter: {
          select: {
            id: true,
            name: true,
            location: true,
            address: true,
          },
        },
      },
    });

    if (!assignment && orderId.length <= 8 && !orderId.includes('-')) {
      const order = await prisma.order.findFirst({
        where: { id: { startsWith: orderId } },
        select: { id: true },
      });
      if (order) {
        assignment = await prisma.printOrderAssignment.findUnique({
          where: { orderId: order.id },
          include: {
            order: {
              include: {
                items: true,
                user: { select: { phone: true } },
              },
            },
            printCenter: {
              select: {
                id: true,
                name: true,
                location: true,
                address: true,
              },
            },
          },
        });
      }
    }

    if (!assignment) {
      throw new NotFoundError('No print assignment found for this order');
    }

    sendSuccess(res, assignment, 'Assignment retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get assignment by order ID (for tracking - order owner or admin or assigned print center)
 */
const getAssignmentByOrderId = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    const assignment = await prisma.printOrderAssignment.findUnique({
      where: { orderId },
      include: {
        order: {
          include: {
            items: true,
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
          },
        },
        printCenter: {
          include: {
            user: { select: { id: true, phone: true } },
          },
        },
      },
    });

    if (!assignment) {
      throw new NotFoundError('No print assignment found for this order');
    }

    const user = assignment.order?.user || {};
    assignment.customerName = user.student?.name || user.doctor?.name || user.customer?.contactPerson || user.customer?.entityName || user.phone || null;
    assignment.deliveryAddress = assignment.order?.address || null;

    const isOrderOwner = req.userId === assignment.order.userId;
    const isPrintCenter = req.printCenterId === assignment.printCenterId;
    const isAdmin = req.userType === 'ADMIN';

    if (!isOrderOwner && !isPrintCenter && !isAdmin) {
      throw new NotFoundError('No print assignment found for this order');
    }

    sendSuccess(res, assignment, 'Assignment retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get delivery tracking for a print assignment (print center or admin)
 * Returns: order, print center, delivery assignment, delivery person, latest delivery location
 */
const getDeliveryTracking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const assignment = await prisma.printOrderAssignment.findUnique({
      where: { id },
      include: {
        order: {
          select: {
            id: true,
            address: true,
            latitude: true,
            longitude: true,
            status: true,
          },
        },
        printCenter: {
          select: {
            id: true,
            name: true,
            location: true,
            address: true,
            latitude: true,
            longitude: true,
          },
        },
      },
    });

    if (!assignment) {
      throw new NotFoundError('Print assignment not found');
    }

    if (req.userType === 'PRINT_CENTER' && assignment.printCenterId !== req.printCenterId) {
      throw new NotFoundError('Print assignment not found');
    }

    const deliveryAssignment = await prisma.deliveryAssignment.findUnique({
      where: { orderId: assignment.orderId },
      include: {
        delivery: {
          select: {
            id: true,
            name: true,
            vehicleType: true,
            vehiclePlateNumber: true,
            status: true,
            user: { select: { phone: true } },
          },
        },
      },
    });

    if (!deliveryAssignment) {
      return sendSuccess(res, {
        hasDelivery: false,
        order: assignment.order,
        printCenter: assignment.printCenter,
        message: 'لم يُعيَّن دليفري لهذا الطلب بعد',
      }, 'No delivery assigned');
    }

    const latestLocation = await prisma.deliveryLocation.findFirst({
      where: { deliveryId: deliveryAssignment.deliveryId },
      orderBy: { createdAt: 'desc' },
      select: { latitude: true, longitude: true, address: true, createdAt: true },
    });

    const payload = {
      hasDelivery: true,
      order: assignment.order,
      printCenter: assignment.printCenter,
      deliveryAssignment: {
        id: deliveryAssignment.id,
        status: deliveryAssignment.status,
        assignedAt: deliveryAssignment.assignedAt,
        pickedUpAt: deliveryAssignment.pickedUpAt,
        deliveredAt: deliveryAssignment.deliveredAt,
      },
      delivery: {
        id: deliveryAssignment.delivery.id,
        name: deliveryAssignment.delivery.name,
        phone: deliveryAssignment.delivery.user?.phone,
        vehicleType: deliveryAssignment.delivery.vehicleType,
        vehiclePlateNumber: deliveryAssignment.delivery.vehiclePlateNumber,
        status: deliveryAssignment.delivery.status,
      },
      deliveryLatestLocation: latestLocation,
    };

    sendSuccess(res, payload, 'Delivery tracking retrieved successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyAssignments,
  getAllAssignments,
  getAssignmentById,
  getAssignmentByOrderId,
  updateAssignmentStatus,
  trackOrder,
  getDeliveryTracking,
};
