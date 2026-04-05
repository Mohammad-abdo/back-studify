const prisma = require('../config/database');

const myAssignmentInclude = {
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
    select: {
      id: true,
      name: true,
      location: true,
      address: true,
    },
  },
};

const adminAssignmentInclude = {
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
};

const assignmentWithOrderAndCenterInclude = {
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
};

const updateAssignmentInclude = {
  order: {
    include: {
      items: true,
      user: {
        select: {
          id: true,
          phone: true,
        },
      },
    },
  },
  printCenter: {
    select: {
      id: true,
      name: true,
    },
  },
};

const trackingInclude = {
  order: {
    include: {
      items: true,
      user: {
        select: {
          phone: true,
        },
      },
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
};

const assignmentOrderTrackingInclude = {
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
        },
      },
    },
  },
};

const deliveryTrackingAssignmentInclude = {
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
};

const findMyAssignments = ({ where, skip, take }) =>
  prisma.printOrderAssignment.findMany({
    where,
    skip,
    take,
    include: myAssignmentInclude,
    orderBy: { assignedAt: 'desc' },
  });

const countAssignments = (where) =>
  prisma.printOrderAssignment.count({ where });

const findAllAssignments = ({ where, skip, take }) =>
  prisma.printOrderAssignment.findMany({
    where,
    skip,
    take,
    include: adminAssignmentInclude,
    orderBy: { assignedAt: 'desc' },
  });

const findAssignmentById = (id) =>
  prisma.printOrderAssignment.findUnique({
    where: { id },
    include: assignmentWithOrderAndCenterInclude,
  });

const findAssignmentForUpdate = (id) =>
  prisma.printOrderAssignment.findUnique({
    where: { id },
    include: {
      order: true,
      printCenter: true,
    },
  });

const updateAssignment = (id, data) =>
  prisma.printOrderAssignment.update({
    where: { id },
    data,
    include: updateAssignmentInclude,
  });

const findAssignmentForTrackingByOrderId = (orderId) =>
  prisma.printOrderAssignment.findUnique({
    where: { orderId },
    include: trackingInclude,
  });

const findOrderByIdPrefix = (orderIdPrefix) =>
  prisma.order.findFirst({
    where: { id: { startsWith: orderIdPrefix } },
    select: { id: true },
  });

const findAssignmentByOrderId = (orderId) =>
  prisma.printOrderAssignment.findUnique({
    where: { orderId },
    include: assignmentOrderTrackingInclude,
  });

const findAssignmentDeliveryTrackingById = (id) =>
  prisma.printOrderAssignment.findUnique({
    where: { id },
    include: deliveryTrackingAssignmentInclude,
  });

const findDeliveryAssignmentByOrderId = (orderId) =>
  prisma.deliveryAssignment.findUnique({
    where: { orderId },
    include: {
      delivery: {
        select: {
          id: true,
          name: true,
          vehicleType: true,
          vehiclePlateNumber: true,
          status: true,
          user: {
            select: {
              phone: true,
            },
          },
        },
      },
    },
  });

const findLatestDeliveryLocation = (deliveryId) =>
  prisma.deliveryLocation.findFirst({
    where: { deliveryId },
    orderBy: { createdAt: 'desc' },
    select: {
      latitude: true,
      longitude: true,
      address: true,
      createdAt: true,
    },
  });

module.exports = {
  findMyAssignments,
  countAssignments,
  findAllAssignments,
  findAssignmentById,
  findAssignmentForUpdate,
  updateAssignment,
  findAssignmentForTrackingByOrderId,
  findOrderByIdPrefix,
  findAssignmentByOrderId,
  findAssignmentDeliveryTrackingById,
  findDeliveryAssignmentByOrderId,
  findLatestDeliveryLocation,
};
