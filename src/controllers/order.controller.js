/**
 * Order Controller
 * Handles order-related HTTP requests
 */

const prisma = require('../config/database');
const { sendSuccess, sendPaginated, getPaginationParams, buildPagination } = require('../utils/response');
const { NotFoundError, ValidationError } = require('../utils/errors');
const { ORDER_STATUS } = require('../utils/constants');
const { calculateOrderTotal } = require('../utils/helpers');
const { assignOrderToNearestPrintCenter } = require('../services/printOrderAssignment.service');

/**
 * Get user orders
 */
const getMyOrders = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { page, limit } = getPaginationParams(req.query.page, req.query.limit);
    const { status } = req.query;

    const where = {
      userId,
      ...(status && { status }),
    };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
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
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.order.count({ where }),
    ]);

    // Enrich order items with material/book/product details
    const enrichedOrders = await Promise.all(orders.map(async (order) => {
      const enrichedItems = await Promise.all(order.items.map(async (item) => {
        let referenceData = null;
        
        if (item.referenceType === 'BOOK') {
          const book = await prisma.book.findUnique({
            where: { id: item.referenceId },
            include: {
              doctor: {
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
              category: true,
            },
          });
          referenceData = book;
        } else if (item.referenceType === 'MATERIAL') {
          const material = await prisma.material.findUnique({
            where: { id: item.referenceId },
            include: {
              doctor: {
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
              category: true,
            },
          });
          referenceData = material;
        } else if (item.referenceType === 'PRODUCT') {
          const product = await prisma.product.findUnique({
            where: { id: item.referenceId },
            include: {
              category: true,
            },
          });
          referenceData = product;
        }

        return {
          ...item,
          reference: referenceData,
        };
      }));

      return {
        ...order,
        items: enrichedItems,
      };
    }));

    const pagination = buildPagination(page, limit, total);

    sendPaginated(res, enrichedOrders, pagination, 'Orders retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get active orders (orders that are not completed or cancelled)
 */
const getActiveOrders = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { page, limit } = getPaginationParams(req.query.page, req.query.limit);

    const where = {
      userId,
      status: {
        notIn: ['DELIVERED', 'CANCELLED'],
      },
    };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
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
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.order.count({ where }),
    ]);

    // Enrich order items with material/book/product details
    const enrichedOrders = await Promise.all(orders.map(async (order) => {
      const enrichedItems = await Promise.all(order.items.map(async (item) => {
        let referenceData = null;
        let title = '';
        let doctorName = '';
        
        if (item.referenceType === 'BOOK') {
          const book = await prisma.book.findUnique({
            where: { id: item.referenceId },
            include: {
              doctor: {
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
              category: true,
            },
          });
          referenceData = book;
          title = book?.title || '';
          doctorName = book?.doctor?.name || '';
        } else if (item.referenceType === 'MATERIAL') {
          const material = await prisma.material.findUnique({
            where: { id: item.referenceId },
            include: {
              doctor: {
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
              category: true,
            },
          });
          referenceData = material;
          title = material?.title || '';
          doctorName = material?.doctor?.name || '';
        } else if (item.referenceType === 'PRODUCT') {
          const product = await prisma.product.findUnique({
            where: { id: item.referenceId },
            include: {
              category: true,
            },
          });
          referenceData = product;
          title = product?.name || '';
        }

        return {
          ...item,
          reference: referenceData,
          displayTitle: title,
          doctorName: doctorName,
        };
      }));

      return {
        ...order,
        items: enrichedItems,
      };
    }));

    const pagination = buildPagination(page, limit, total);

    sendPaginated(res, enrichedOrders, pagination, 'Active orders retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get order by ID
 */
const getOrderById = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
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
      },
    });

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    // Check if order belongs to user (unless admin)
    if (order.userId !== userId && req.userType !== 'ADMIN') {
      throw new NotFoundError('Order not found');
    }

    sendSuccess(res, order, 'Order retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Create order
 * Automatically determines orderType based on items:
 * - PRODUCT items → PRODUCT order
 * - BOOK/MATERIAL items → CONTENT order
 * - PRINT_OPTION items → PRINT order (if implemented)
 */
const createOrder = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { items, address } = req.body;

    if (!items || items.length === 0) {
      throw new ValidationError('Order must have at least one item');
    }

    // Determine orderType based on items
    // If all items are PRODUCT → PRODUCT order
    // If all items are BOOK or MATERIAL → CONTENT order
    // If mixed, default to PRODUCT (cart-based)
    const hasProduct = items.some(item => item.referenceType === 'PRODUCT');
    const hasBookOrMaterial = items.some(item => item.referenceType === 'BOOK' || item.referenceType === 'MATERIAL');
    const hasPrintOption = items.some(item => item.referenceType === 'PRINT_OPTION');

    let orderType = 'PRODUCT'; // default
    if (hasPrintOption && !hasProduct && !hasBookOrMaterial) {
      orderType = 'PRINT';
    } else if (hasBookOrMaterial && !hasProduct && !hasPrintOption) {
      orderType = 'CONTENT';
    } else if (hasProduct) {
      orderType = 'PRODUCT';
    }

    // Validate: Don't allow mixing PRODUCT with BOOK/MATERIAL/PRINT_OPTION
    if ((hasProduct && hasBookOrMaterial) || (hasProduct && hasPrintOption) || (hasBookOrMaterial && hasPrintOption)) {
      throw new ValidationError('Cannot mix PRODUCT items with BOOK/MATERIAL/PRINT_OPTION items in the same order');
    }

    // Calculate total
    const total = calculateOrderTotal(items);

    const { latitude, longitude } = req.body;

    // Create order with items
    const order = await prisma.order.create({
      data: {
        userId,
        total,
        status: ORDER_STATUS.CREATED,
        orderType,
        address,
        latitude: latitude != null ? Number(latitude) : null,
        longitude: longitude != null ? Number(longitude) : null,
        items: {
          create: items.map((item) => ({
            referenceType: item.referenceType,
            referenceId: item.referenceId,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
      include: {
        items: true,
        user: {
          select: {
            id: true,
            phone: true,
            name: true,
            email: true,
          }
        }
      },
    });

    // Emit socket event for the new order
    const io = req.app.get('io');
    if (io) {
      io.emit('new_order', order);
    }

    sendSuccess(res, order, 'Order created successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Update order status
 */
const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const existingOrder = await prisma.order.findUnique({
      where: { id },
    });

    if (!existingOrder) {
      throw new NotFoundError('Order not found');
    }

    const order = await prisma.order.update({
      where: { id },
      data: { status },
      include: {
        items: true,
        user: {
          select: {
            id: true,
            phone: true,
            name: true,
            email: true,
          }
        }
      },
    });

    // When order becomes PAID and has print items, assign to nearest print center
    if (status === ORDER_STATUS.PAID) {
      try {
        const io = req.app.get('io');
        await assignOrderToNearestPrintCenter(id, io || null);
      } catch (assignErr) {
        console.error('Print assignment failed:', assignErr.message);
      }
    }

    // Emit socket event for the updated order
    const io = req.app.get('io');
    if (io) {
      io.emit('order_updated', order);
    }

    sendSuccess(res, order, 'Order status updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel order
 */
const cancelOrder = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const existingOrder = await prisma.order.findUnique({
      where: { id },
    });

    if (!existingOrder) {
      throw new NotFoundError('Order not found');
    }

    // Check if order belongs to user
    if (existingOrder.userId !== userId && req.userType !== 'ADMIN') {
      throw new NotFoundError('Order not found');
    }

    // Check if order can be cancelled
    if (existingOrder.status === ORDER_STATUS.DELIVERED) {
      throw new ValidationError('Cannot cancel a delivered order');
    }

    if (existingOrder.status === ORDER_STATUS.CANCELLED) {
      throw new ValidationError('Order is already cancelled');
    }

    const order = await prisma.order.update({
      where: { id },
      data: { status: ORDER_STATUS.CANCELLED },
    });

    sendSuccess(res, order, 'Order cancelled successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyOrders,
  getActiveOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  cancelOrder,
};
