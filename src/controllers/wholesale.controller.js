/**
 * Wholesale Order Controller
 * Handles wholesale order-related HTTP requests
 */

const prisma = require('../config/database');
const { sendSuccess, sendPaginated, getPaginationParams, buildPagination } = require('../utils/response');
const { NotFoundError, AuthorizationError, ValidationError } = require('../utils/errors');
const { ORDER_STATUS } = require('../utils/constants');
const { calculateOrderTotal } = require('../utils/helpers');

/**
 * Get customer's wholesale orders
 */
const getMyWholesaleOrders = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { page, limit } = getPaginationParams(req.query.page, req.query.limit);
    const { status } = req.query;

    // Check if user is a customer
    const customer = await prisma.customer.findUnique({
      where: { userId },
    });

    if (!customer) {
      throw new AuthorizationError('Only wholesale customers can access this');
    }

    const where = {
      customerId: customer.id,
      ...(status && { status }),
    };

    const [orders, total] = await Promise.all([
      prisma.wholesaleOrder.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.wholesaleOrder.count({ where }),
    ]);

    const pagination = buildPagination(page, limit, total);

    sendPaginated(res, orders, pagination, 'Wholesale orders retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get wholesale order by ID
 */
const getWholesaleOrderById = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const customer = await prisma.customer.findUnique({
      where: { userId },
    });

    if (!customer) {
      throw new AuthorizationError('Only wholesale customers can access this');
    }

    const order = await prisma.wholesaleOrder.findUnique({
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

    if (!order) {
      throw new NotFoundError('Wholesale order not found');
    }

    // Check if order belongs to customer (unless admin)
    if (order.customerId !== customer.id && req.userType !== 'ADMIN') {
      throw new NotFoundError('Wholesale order not found');
    }

    sendSuccess(res, order, 'Wholesale order retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Create wholesale order
 */
const createWholesaleOrder = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { items } = req.body;

    if (!items || items.length === 0) {
      throw new ValidationError('Order must have at least one item');
    }

    // Check if user is a customer
    const customer = await prisma.customer.findUnique({
      where: { userId },
    });

    if (!customer) {
      throw new AuthorizationError('Only wholesale customers can create wholesale orders');
    }

    // Calculate total
    const total = calculateOrderTotal(items);

    // Create order with items
    const order = await prisma.wholesaleOrder.create({
      data: {
        customerId: customer.id,
        total,
        status: ORDER_STATUS.CREATED,
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    sendSuccess(res, order, 'Wholesale order created successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Update wholesale order status (Admin only)
 */
const updateWholesaleOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const existingOrder = await prisma.wholesaleOrder.findUnique({
      where: { id },
    });

    if (!existingOrder) {
      throw new NotFoundError('Wholesale order not found');
    }

    const order = await prisma.wholesaleOrder.update({
      where: { id },
      data: { status },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    sendSuccess(res, order, 'Wholesale order status updated successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyWholesaleOrders,
  getWholesaleOrderById,
  createWholesaleOrder,
  updateWholesaleOrderStatus,
};
