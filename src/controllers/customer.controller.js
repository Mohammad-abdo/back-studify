/**
 * Customer Controller
 * Handles customer-related HTTP requests (Admin only)
 */

const prisma = require('../config/database');
const { sendSuccess, sendPaginated, getPaginationParams, buildPagination } = require('../utils/response');
const { NotFoundError } = require('../utils/errors');

/**
 * Get all customers
 */
const getCustomers = async (req, res, next) => {
  try {
    const { page, limit } = getPaginationParams(req.query.page, req.query.limit);
    const { search } = req.query;

    const where = {
      ...(search && {
        OR: [
          { entityName: { contains: search } },
          { contactPerson: { contains: search } },
          { phone: { contains: search } },
          { user: { phone: { contains: search } } },
          { user: { email: { contains: search } } },
        ],
      }),
    };

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
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
          _count: {
            select: {
              wholesaleOrders: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.customer.count({ where }),
    ]);

    const pagination = buildPagination(page, limit, total);
    sendPaginated(res, customers, pagination, 'Customers retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get customer by ID
 */
const getCustomerById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
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

    if (!customer) {
      throw new NotFoundError('Customer not found');
    }

    sendSuccess(res, customer, 'Customer retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Update customer (Admin only)
 */
const updateCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { entityName, contactPerson, phone } = req.body;

    const existingCustomer = await prisma.customer.findUnique({
      where: { id },
    });

    if (!existingCustomer) {
      throw new NotFoundError('Customer not found');
    }

    const updateData = {};
    if (entityName !== undefined) updateData.entityName = entityName;
    if (contactPerson !== undefined) updateData.contactPerson = contactPerson;
    if (phone !== undefined) updateData.phone = phone;

    const customer = await prisma.customer.update({
      where: { id },
      data: updateData,
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

    sendSuccess(res, customer, 'Customer updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete customer (Admin only)
 */
const deleteCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingCustomer = await prisma.customer.findUnique({
      where: { id },
    });

    if (!existingCustomer) {
      throw new NotFoundError('Customer not found');
    }

    await prisma.customer.delete({
      where: { id },
    });

    sendSuccess(res, null, 'Customer deleted successfully', 204);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
};


