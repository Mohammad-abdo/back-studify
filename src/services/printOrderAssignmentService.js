const printOrderAssignmentRepository = require('../repositories/printOrderAssignmentRepository');
const contentRepository = require('../repositories/contentRepository');
const { buildPagination, getPaginationParams } = require('../utils/response');
const { NotFoundError, AuthorizationError, ValidationError } = require('../utils/errors');

const enrichOrderItems = async (items) => {
  if (!items || !items.length) {
    return items;
  }

  const bookIds = [...new Set(items.filter((item) => item.referenceType === 'BOOK').map((item) => item.referenceId))];
  const materialIds = [...new Set(items.filter((item) => item.referenceType === 'MATERIAL').map((item) => item.referenceId))];

  const [books, materials] = await Promise.all([
    bookIds.length ? contentRepository.findBooksForPrintAssignment(bookIds) : [],
    materialIds.length ? contentRepository.findMaterialsForPrintAssignment(materialIds) : [],
  ]);

  const bookMap = Object.fromEntries(books.map((book) => [book.id, book]));
  const materialMap = Object.fromEntries(materials.map((material) => [material.id, material]));

  return items.map((item) => {
    const reference =
      item.referenceType === 'BOOK'
        ? bookMap[item.referenceId]
        : item.referenceType === 'MATERIAL'
          ? materialMap[item.referenceId]
          : null;

    return {
      ...item,
      reference: reference
        ? { title: reference.title, fileUrl: reference.fileUrl }
        : { title: 'Print item', fileUrl: null },
    };
  });
};

const attachAssignmentMeta = (assignment) => {
  const user = assignment.order?.user || {};

  return {
    ...assignment,
    customerName:
      user.student?.name ||
      user.doctor?.name ||
      user.customer?.contactPerson ||
      user.customer?.entityName ||
      user.phone ||
      null,
    deliveryAddress: assignment.order?.address || null,
  };
};

const getMyAssignments = async ({ printCenterId, page, limit, status }) => {
  if (!printCenterId) {
    throw new AuthorizationError('Print center access required');
  }

  const paginationParams = getPaginationParams(page, limit);
  const where = {
    printCenterId,
    ...(status && { status }),
  };

  const [assignments, total] = await Promise.all([
    printOrderAssignmentRepository.findMyAssignments({
      where,
      skip: paginationParams.skip,
      take: paginationParams.limit,
    }),
    printOrderAssignmentRepository.countAssignments(where),
  ]);

  const enrichedAssignments = await Promise.all(
    assignments.map(async (assignment) => ({
      ...assignment,
      order: assignment.order
        ? {
            ...assignment.order,
            items: await enrichOrderItems(assignment.order.items),
          }
        : assignment.order,
    })),
  );

  return {
    data: enrichedAssignments,
    pagination: buildPagination(paginationParams.page, paginationParams.limit, total),
  };
};

const getAllAssignments = async ({ page, limit, status, printCenterId }) => {
  const paginationParams = getPaginationParams(page, limit);
  const where = {};
  if (status) where.status = status;
  if (printCenterId) where.printCenterId = printCenterId;

  const [assignments, total] = await Promise.all([
    printOrderAssignmentRepository.findAllAssignments({
      where,
      skip: paginationParams.skip,
      take: paginationParams.limit,
    }),
    printOrderAssignmentRepository.countAssignments(where),
  ]);

  const enrichedAssignments = await Promise.all(
    assignments.map(async (assignment) =>
      attachAssignmentMeta({
        ...assignment,
        order: assignment.order
          ? {
              ...assignment.order,
              items: await enrichOrderItems(assignment.order.items),
            }
          : assignment.order,
      })),
  );

  return {
    data: enrichedAssignments,
    pagination: buildPagination(paginationParams.page, paginationParams.limit, total),
  };
};

const getAssignmentById = async ({ id, userType, printCenterId }) => {
  const assignment = await printOrderAssignmentRepository.findAssignmentById(id);

  if (!assignment) {
    throw new NotFoundError('Assignment not found');
  }

  if (userType === 'PRINT_CENTER' && assignment.printCenterId !== printCenterId) {
    throw new NotFoundError('Assignment not found');
  }

  return attachAssignmentMeta({
    ...assignment,
    order: assignment.order
      ? {
          ...assignment.order,
          items: await enrichOrderItems(assignment.order.items),
        }
      : assignment.order,
  });
};

const updateAssignmentStatus = async ({ id, status, notes, userType, printCenterId, io }) => {
  const assignment = await printOrderAssignmentRepository.findAssignmentForUpdate(id);

  if (!assignment) {
    throw new NotFoundError('Assignment not found');
  }

  if (userType === 'PRINT_CENTER' && assignment.printCenterId !== printCenterId) {
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

  const updated = await printOrderAssignmentRepository.updateAssignment(id, data);

  if (io) {
    io.to(`print_center_${assignment.printCenterId}`).emit('print_order_status_updated', updated);
    io.emit('order_updated', updated.order);
  }

  return updated;
};

const trackOrder = async ({ orderId }) => {
  let normalizedOrderId = (orderId || '').trim().replace(/^#+/, '');
  if (!normalizedOrderId) {
    throw new NotFoundError('No print assignment found for this order');
  }

  let assignment = await printOrderAssignmentRepository.findAssignmentForTrackingByOrderId(normalizedOrderId);

  if (!assignment && normalizedOrderId.length <= 8 && !normalizedOrderId.includes('-')) {
    const order = await printOrderAssignmentRepository.findOrderByIdPrefix(normalizedOrderId);
    if (order) {
      assignment = await printOrderAssignmentRepository.findAssignmentForTrackingByOrderId(order.id);
    }
  }

  if (!assignment) {
    throw new NotFoundError('No print assignment found for this order');
  }

  return assignment;
};

const getAssignmentByOrderId = async ({ orderId, userId, printCenterId, userType }) => {
  const assignment = await printOrderAssignmentRepository.findAssignmentByOrderId(orderId);

  if (!assignment) {
    throw new NotFoundError('No print assignment found for this order');
  }

  const isOrderOwner = userId === assignment.order.userId;
  const isPrintCenter = printCenterId === assignment.printCenterId;
  const isAdmin = userType === 'ADMIN';

  if (!isOrderOwner && !isPrintCenter && !isAdmin) {
    throw new NotFoundError('No print assignment found for this order');
  }

  return attachAssignmentMeta(assignment);
};

const getDeliveryTracking = async ({ id, userType, printCenterId }) => {
  const assignment = await printOrderAssignmentRepository.findAssignmentDeliveryTrackingById(id);

  if (!assignment) {
    throw new NotFoundError('Print assignment not found');
  }

  if (userType === 'PRINT_CENTER' && assignment.printCenterId !== printCenterId) {
    throw new NotFoundError('Print assignment not found');
  }

  const deliveryAssignment = await printOrderAssignmentRepository.findDeliveryAssignmentByOrderId(assignment.orderId);

  if (!deliveryAssignment) {
    return {
      hasDelivery: false,
      order: assignment.order,
      printCenter: assignment.printCenter,
      message: 'No delivery assigned yet',
    };
  }

  const latestLocation = await printOrderAssignmentRepository.findLatestDeliveryLocation(deliveryAssignment.deliveryId);

  return {
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
};

module.exports = {
  getMyAssignments,
  getAllAssignments,
  getAssignmentById,
  updateAssignmentStatus,
  trackOrder,
  getAssignmentByOrderId,
  getDeliveryTracking,
};
