const prisma = require('../config/database');

const wholesaleOrderInclude = {
  items: {
    include: {
      product: true,
    },
  },
};

const findCustomerByUserId = (userId) =>
  prisma.customer.findUnique({
    where: { userId },
  });

const findWholesaleOrders = ({ where, skip, take }) =>
  prisma.wholesaleOrder.findMany({
    where,
    skip,
    take,
    include: wholesaleOrderInclude,
    orderBy: { createdAt: 'desc' },
  });

const countWholesaleOrders = (where) =>
  prisma.wholesaleOrder.count({ where });

const findWholesaleOrderById = (id) =>
  prisma.wholesaleOrder.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: true,
        },
      },
      customer: {
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

const createWholesaleOrder = (data) =>
  prisma.wholesaleOrder.create({
    data,
    include: wholesaleOrderInclude,
  });

const findWholesaleOrderBasicById = (id) =>
  prisma.wholesaleOrder.findUnique({
    where: { id },
  });

const updateWholesaleOrder = (id, data) =>
  prisma.wholesaleOrder.update({
    where: { id },
    data,
    include: wholesaleOrderInclude,
  });

module.exports = {
  findCustomerByUserId,
  findWholesaleOrders,
  countWholesaleOrders,
  findWholesaleOrderById,
  createWholesaleOrder,
  findWholesaleOrderBasicById,
  updateWholesaleOrder,
};
