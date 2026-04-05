const prisma = require('../config/database');

const assignmentListInclude = {
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
};

const assignmentDetailsInclude = {
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
};

const findDeliveryAssignments = ({ where, skip, take }) =>
  prisma.deliveryAssignment.findMany({
    where,
    skip,
    take,
    include: assignmentListInclude,
    orderBy: { assignedAt: 'desc' },
  });

const countDeliveryAssignments = (where) =>
  prisma.deliveryAssignment.count({ where });

const findDeliveryAssignmentByIdWithDetails = (id) =>
  prisma.deliveryAssignment.findUnique({
    where: { id },
    include: assignmentDetailsInclude,
  });

const findOrderById = (id) =>
  prisma.order.findUnique({
    where: { id },
  });

const findDeliveryById = (id) =>
  prisma.delivery.findUnique({
    where: { id },
  });

const findDeliveryAssignmentByOrderId = (orderId) =>
  prisma.deliveryAssignment.findUnique({
    where: { orderId },
  });

const createDeliveryAssignment = (data) =>
  prisma.deliveryAssignment.create({
    data,
    include: {
      order: true,
      delivery: true,
    },
  });

const findDeliveryAssignmentById = (id) =>
  prisma.deliveryAssignment.findUnique({
    where: { id },
  });

const updateDeliveryAssignment = (id, data) =>
  prisma.deliveryAssignment.update({
    where: { id },
    data,
    include: {
      order: true,
      delivery: true,
    },
  });

const deleteDeliveryAssignment = (id) =>
  prisma.deliveryAssignment.delete({
    where: { id },
  });

module.exports = {
  findDeliveryAssignments,
  countDeliveryAssignments,
  findDeliveryAssignmentByIdWithDetails,
  findOrderById,
  findDeliveryById,
  findDeliveryAssignmentByOrderId,
  createDeliveryAssignment,
  findDeliveryAssignmentById,
  updateDeliveryAssignment,
  deleteDeliveryAssignment,
};
