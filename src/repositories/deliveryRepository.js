const prisma = require('../config/database');

const deliveryProfileInclude = {
  user: {
    select: {
      id: true,
      phone: true,
      email: true,
      avatarUrl: true,
    },
  },
  wallet: true,
};

const assignmentOrderInclude = {
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
};

const findDeliveryProfileByUserId = (userId) =>
  prisma.delivery.findUnique({
    where: { userId },
    include: deliveryProfileInclude,
  });

const findDeliveryByUserId = (userId) =>
  prisma.delivery.findUnique({
    where: { userId },
  });

const updateDeliveryByUserId = (userId, data, include = deliveryProfileInclude) =>
  prisma.delivery.update({
    where: { userId },
    data,
    include,
  });

const findAssignments = ({ where, skip, take }) =>
  prisma.deliveryAssignment.findMany({
    where,
    skip,
    take,
    include: assignmentOrderInclude,
    orderBy: { assignedAt: 'desc' },
  });

const countAssignments = (where) =>
  prisma.deliveryAssignment.count({ where });

const createDeliveryLocation = (data) =>
  prisma.deliveryLocation.create({
    data,
  });

const findActiveAssignmentByDeliveryId = (deliveryId) =>
  prisma.deliveryAssignment.findFirst({
    where: {
      deliveryId,
      status: { in: ['PROCESSING', 'SHIPPED'] },
    },
  });

const findDeliveryWithWalletByUserId = (userId) =>
  prisma.delivery.findUnique({
    where: { userId },
    include: {
      wallet: true,
    },
  });

const createDeliveryWallet = (deliveryId) =>
  prisma.deliveryWallet.create({
    data: {
      deliveryId,
      balance: 0,
    },
  });

const findAssignmentByOrderAndDeliveryId = ({ orderId, deliveryId }) =>
  prisma.deliveryAssignment.findFirst({
    where: {
      orderId,
      deliveryId,
    },
  });

const updateAssignmentWithOrder = (id, data) =>
  prisma.deliveryAssignment.update({
    where: { id },
    data,
    include: {
      order: true,
    },
  });

const updateOrderStatus = (id, status) =>
  prisma.order.update({
    where: { id },
    data: { status },
  });

const findActiveAssignmentWithOrderByDeliveryId = (deliveryId) =>
  prisma.deliveryAssignment.findFirst({
    where: {
      deliveryId,
      status: { in: ['PROCESSING', 'SHIPPED'] },
    },
    include: {
      order: {
        select: {
          id: true,
          address: true,
          latitude: true,
          longitude: true,
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

const findShippingHistoryAssignments = ({ where, skip, take }) =>
  prisma.deliveryAssignment.findMany({
    where,
    skip,
    take,
    include: assignmentOrderInclude,
    orderBy: { assignedAt: 'desc' },
  });

const countShippingHistoryAssignments = (where) =>
  prisma.deliveryAssignment.count({ where });

module.exports = {
  findDeliveryProfileByUserId,
  findDeliveryByUserId,
  updateDeliveryByUserId,
  findAssignments,
  countAssignments,
  createDeliveryLocation,
  findActiveAssignmentByDeliveryId,
  findDeliveryWithWalletByUserId,
  createDeliveryWallet,
  findAssignmentByOrderAndDeliveryId,
  updateAssignmentWithOrder,
  updateOrderStatus,
  findActiveAssignmentWithOrderByDeliveryId,
  findShippingHistoryAssignments,
  countShippingHistoryAssignments,
};
