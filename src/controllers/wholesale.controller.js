/**
 * Wholesale Order Controller
 * Handles wholesale order-related HTTP requests for institute users.
 */

const prisma = require('../config/database');
const { sendSuccess, sendPaginated, getPaginationParams, buildPagination } = require('../utils/response');
const { NotFoundError, AuthorizationError, ValidationError } = require('../utils/errors');
const { ORDER_STATUS } = require('../utils/constants');
const { calculateOrderTotal } = require('../utils/helpers');
const { sanitizeOrderItemsWithProducts } = require('../utils/legacyApiShape');
const { validateInstituteProducts, calculateInstitutePriceFromTiers } = require('../services/institute.service');

/**
 * Get wholesale orders.
 * ADMIN sees all orders; CUSTOMER/INSTITUTE sees only their own.
 */
const getMyWholesaleOrders = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { page, limit } = getPaginationParams(req.query.page, req.query.limit);
    const { status, customerId: filterCustomerId } = req.query;

    const isAdmin = req.userType === 'ADMIN';

    let where = {};

    if (isAdmin) {
      if (filterCustomerId) where.customerId = filterCustomerId;
    } else {
      const customer = await prisma.customer.findUnique({
        where: { userId },
      });

      if (!customer) {
        throw new AuthorizationError(
          'No customer profile found. Wholesale orders require a customer profile (institute accounts should have one linked).'
        );
      }

      where.customerId = customer.id;
    }

    if (status) where.status = status;

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
          customer: isAdmin ? {
            include: {
              user: {
                select: { id: true, phone: true, email: true },
              },
            },
          } : false,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.wholesaleOrder.count({ where }),
    ]);

    const pagination = buildPagination(page, limit, total);

    sendPaginated(
      res,
      orders,
      pagination,
      'Wholesale orders retrieved successfully'
    );
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
    const isAdmin = req.userType === 'ADMIN';

    let customer = null;
    if (!isAdmin) {
      customer = await prisma.customer.findUnique({
        where: { userId },
      });

      if (!customer) {
        throw new AuthorizationError(
          'No customer profile found. Wholesale orders require a customer profile (institute accounts should have one linked).'
        );
      }
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

    if (!isAdmin && order.customerId !== customer.id) {
      throw new NotFoundError('Wholesale order not found');
    }

    sendSuccess(res, order, 'Wholesale order retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Create wholesale order
 * - Validates all products are institute products
 * - Calculates prices from ProductPricing tiers when no explicit price is given
 */
const createWholesaleOrder = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { items, address } = req.body;

    if (!items || items.length === 0) {
      throw new ValidationError('Order must have at least one item');
    }

    const customer = await prisma.customer.findUnique({
      where: { userId },
    });

    if (!customer) {
      throw new AuthorizationError(
        'No customer profile found. Wholesale orders require a customer profile (institute accounts should have one linked).'
      );
    }

    // Validate ALL products are institute products
    const productIds = items.map((i) => i.productId);
    const { valid, invalidIds } = await validateInstituteProducts(productIds);
    if (!valid) {
      throw new ValidationError(
        `The following products are not institute products or do not exist: ${invalidIds.join(', ')}`
      );
    }

    // Fetch products with pricing tiers to compute prices
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { pricing: { orderBy: { minQuantity: 'asc' } } },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    const resolvedItems = items.map((item) => {
      const product = productMap.get(item.productId);

      // If the client sent a price, honour it (admin / pre-negotiated)
      if (item.price != null && item.price > 0) {
        return {
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        };
      }

      // Calculate from pricing tiers
      if (product.pricing && product.pricing.length > 0) {
        const calc = calculateInstitutePriceFromTiers(item.quantity, product.pricing);
        if (calc) {
          return {
            productId: item.productId,
            quantity: item.quantity,
            price: calc.unitPrice,
          };
        }
      }

      // Fall back to basePrice
      if (product.basePrice != null) {
        return {
          productId: item.productId,
          quantity: item.quantity,
          price: product.basePrice,
        };
      }

      throw new ValidationError(
        `No pricing available for product "${product.name}" (${product.id}). Add pricing tiers or a base price.`
      );
    });

    const total = resolvedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

    const order = await prisma.wholesaleOrder.create({
      data: {
        customerId: customer.id,
        total,
        status: ORDER_STATUS.CREATED,
        address,
        items: {
          create: resolvedItems.map((item) => ({
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
