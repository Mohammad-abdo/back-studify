const prisma = require('../config/database');

const customerBaseInclude = {
  user: {
    select: {
      id: true,
      phone: true,
      email: true,
      avatarUrl: true,
      type: true,
      isActive: true,
      createdAt: true,
    },
  },
};

const findCustomers = ({ where, skip, take }) =>
  prisma.customer.findMany({
    where,
    skip,
    take,
    include: {
      ...customerBaseInclude,
      _count: {
        select: {
          wholesaleOrders: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

const countCustomers = (where) =>
  prisma.customer.count({ where });

const findCustomerByIdWithDetails = (id) =>
  prisma.customer.findUnique({
    where: { id },
    include: {
      ...customerBaseInclude,
      wholesaleOrders: {
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
        take: 10,
        orderBy: { createdAt: 'desc' },
      },
      _count: {
        select: {
          wholesaleOrders: true,
        },
      },
    },
  });

const findCustomerById = (id) =>
  prisma.customer.findUnique({
    where: { id },
  });

const updateCustomer = (id, data) =>
  prisma.customer.update({
    where: { id },
    data,
    include: {
      user: {
        select: {
          id: true,
          phone: true,
          email: true,
          avatarUrl: true,
          type: true,
          isActive: true,
        },
      },
    },
  });

const deleteCustomer = (id) =>
  prisma.customer.delete({
    where: { id },
  });

module.exports = {
  findCustomers,
  countCustomers,
  findCustomerByIdWithDetails,
  findCustomerById,
  updateCustomer,
  deleteCustomer,
};
