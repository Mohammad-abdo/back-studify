const prisma = require('../config/database');

const orderListInclude = {
  items: {
    include: {
      order: {
        select: {
          id: true,
          status: true,
          createdAt: true,
        },
      },
    },
  },
  assignment: {
    include: {
      delivery: {
        include: {
          user: {
            select: {
              id: true,
              phone: true,
              avatarUrl: true,
            },
          },
        },
      },
    },
  },
};

const orderDetailInclude = {
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
  assignment: {
    include: {
      delivery: {
        include: {
          user: {
            select: {
              id: true,
              phone: true,
              avatarUrl: true,
            },
          },
        },
      },
    },
  },
  printAssignment: {
    include: {
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
  },
};

const orderWriteInclude = {
  items: true,
  user: {
    select: {
      id: true,
      phone: true,
      email: true,
    },
  },
};

const findOrders = ({ where, skip, take }) =>
  prisma.order.findMany({
    where,
    skip,
    take,
    include: orderListInclude,
    orderBy: { createdAt: 'desc' },
  });

const countOrders = (where) =>
  prisma.order.count({ where });

const findOrderById = (id) =>
  prisma.order.findUnique({
    where: { id },
    include: orderDetailInclude,
  });

const findOrderBasicById = (id) =>
  prisma.order.findUnique({
    where: { id },
  });

const createOrder = (data, include = orderWriteInclude) =>
  prisma.order.create({
    data,
    include,
  });

const updateOrder = (id, data) =>
  prisma.order.update({
    where: { id },
    data,
    include: orderWriteInclude,
  });

module.exports = {
  findOrders,
  countOrders,
  findOrderById,
  findOrderBasicById,
  createOrder,
  updateOrder,
};
