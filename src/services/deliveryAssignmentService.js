const deliveryAssignmentRepository = require('../repositories/deliveryAssignmentRepository');
const { buildPagination, getPaginationParams } = require('../utils/response');
const { NotFoundError, ConflictError } = require('../utils/errors');

const enrichAssignment = (assignment) => {
  const order = assignment.order || {};
  const user = order.user || {};
  const customerName =
    user.student?.name ||
    user.doctor?.name ||
    user.customer?.contactPerson ||
    user.customer?.entityName ||
    user.phone ||
    null;

  return {
    ...assignment,
    customerName,
    deliveryAddress: order.address || null,
    latitude: order.latitude ?? null,
    longitude: order.longitude ?? null,
  };
};

const getDeliveryAssignments = async ({ page, limit, deliveryId, orderId, status }) => {
  const paginationParams = getPaginationParams(page, limit);
  const where = {
    ...(deliveryId && { deliveryId }),
    ...(orderId && { orderId }),
    ...(status && { status }),
  };

  const [assignments, total] = await Promise.all([
    deliveryAssignmentRepository.findDeliveryAssignments({
      where,
      skip: paginationParams.skip,
      take: paginationParams.limit,
    }),
    deliveryAssignmentRepository.countDeliveryAssignments(where),
  ]);

  return {
    data: assignments,
    pagination: buildPagination(paginationParams.page, paginationParams.limit, total),
  };
};

const getDeliveryAssignmentById = async ({ id }) => {
  const assignment = await deliveryAssignmentRepository.findDeliveryAssignmentByIdWithDetails(id);

  if (!assignment) {
    throw new NotFoundError('Delivery assignment not found');
  }

  return enrichAssignment(assignment);
};

const createDeliveryAssignment = async ({ orderId, deliveryId, status }) => {
  const order = await deliveryAssignmentRepository.findOrderById(orderId);
  if (!order) {
    throw new NotFoundError('Order not found');
  }

  const delivery = await deliveryAssignmentRepository.findDeliveryById(deliveryId);
  if (!delivery) {
    throw new NotFoundError('Delivery not found');
  }

  const existingAssignment = await deliveryAssignmentRepository.findDeliveryAssignmentByOrderId(orderId);
  if (existingAssignment) {
    throw new ConflictError('Order already has a delivery assignment');
  }

  return deliveryAssignmentRepository.createDeliveryAssignment({
    orderId,
    deliveryId,
    status: status || 'CREATED',
  });
};

const updateDeliveryAssignment = async ({ id, status, pickedUpAt, deliveredAt }) => {
  const existingAssignment = await deliveryAssignmentRepository.findDeliveryAssignmentById(id);

  if (!existingAssignment) {
    throw new NotFoundError('Delivery assignment not found');
  }

  const updateData = {};
  if (status !== undefined) updateData.status = status;
  if (pickedUpAt !== undefined) updateData.pickedUpAt = pickedUpAt ? new Date(pickedUpAt) : null;
  if (deliveredAt !== undefined) updateData.deliveredAt = deliveredAt ? new Date(deliveredAt) : null;

  return deliveryAssignmentRepository.updateDeliveryAssignment(id, updateData);
};

const deleteDeliveryAssignment = async ({ id }) => {
  const existingAssignment = await deliveryAssignmentRepository.findDeliveryAssignmentById(id);

  if (!existingAssignment) {
    throw new NotFoundError('Delivery assignment not found');
  }

  await deliveryAssignmentRepository.deleteDeliveryAssignment(id);
};

module.exports = {
  getDeliveryAssignments,
  getDeliveryAssignmentById,
  createDeliveryAssignment,
  updateDeliveryAssignment,
  deleteDeliveryAssignment,
};
