/**
 * Order Controller
 * Handles order-related HTTP requests
 */

const prisma = require('../config/database');
const { sendSuccess, sendPaginated, getPaginationParams, buildPagination } = require('../utils/response');
const { NotFoundError, ValidationError, AuthorizationError } = require('../utils/errors');
const { ORDER_STATUS, USER_TYPES } = require('../utils/constants');
const { calculateOrderTotal } = require('../utils/helpers');
const { assignOrderToNearestPrintCenter } = require('../services/printOrderAssignment.service');
const { sanitizeProduct } = require('../utils/legacyApiShape');
const { createWholesaleOrderCore } = require('../services/wholesaleOrder.service');

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
              pricing: true,
            },
          });
          referenceData = product ? sanitizeProduct(product) : null;
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
              pricing: true,
            },
          });
          referenceData = product ? sanitizeProduct(product) : null;
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
      },
    });

    if (order) {
      if (order.userId !== userId && req.userType !== 'ADMIN') {
        throw new NotFoundError('Order not found');
      }
      const orderForResponse = {
        ...order,
        orderKind: 'RETAIL',
        address: (order.address && String(order.address).trim()) ? order.address : 'Address not provided',
      };
      const user = orderForResponse.user || {};
      orderForResponse.customerName =
        user.student?.name || user.doctor?.name || user.customer?.contactPerson || user.customer?.entityName || user.phone || null;
      return sendSuccess(res, orderForResponse, 'Order retrieved successfully');
    }

    const wholesale = await prisma.wholesaleOrder.findUnique({
      where: { id },
      include: {
        items: { include: { product: true } },
        customer: {
          include: {
            user: {
              select: {
                id: true,
                phone: true,
                email: true,
                customer: { select: { contactPerson: true, entityName: true } },
              },
            },
          },
        },
      },
    });

    if (!wholesale) {
      throw new NotFoundError('Order not found');
    }

    if (wholesale.customer.userId !== userId && req.userType !== 'ADMIN') {
      throw new NotFoundError('Order not found');
    }

    const u = wholesale.customer?.user;
    sendSuccess(
      res,
      {
        ...wholesale,
        orderKind: 'WHOLESALE',
        customerName: u?.customer?.entityName || u?.customer?.contactPerson || u?.phone || null,
      },
      'Order retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Create order (retail flow).
 * INSTITUTE users with only PRODUCT line items get a wholesale order (same as POST /api/wholesale-orders).
 *
 * Automatically determines orderType based on items:
 * - PRODUCT items → PRODUCT order
 * - BOOK/MATERIAL items → CONTENT order
 * - PRINT_OPTION items → PRINT order (if implemented)
 */
const createOrder = async (req, res, next) => {
  try {
    const userId = req.userId;
    const userType = req.userType;
    const { items, address } = req.body;

    if (!items || items.length === 0) {
      throw new ValidationError('Order must have at least one item');
    }

    // Institute + cart-style checkout (POST /api/orders with PRODUCT items) → wholesale order
    if (userType === USER_TYPES.INSTITUTE) {
      const allProduct = items.every((item) => item.referenceType === 'PRODUCT');
      if (!allProduct) {
        throw new ValidationError(
          'Institute accounts can only order wholesale products here. Send only PRODUCT line items from the institute catalogue, or use POST /api/wholesale-orders with { productId, quantity, price? }.'
        );
      }
      const wholesaleItems = items.map((item) => ({
        productId: item.referenceId,
        quantity: item.quantity,
        price: item.price,
      }));
      const wholesaleOrder = await createWholesaleOrderCore(userId, wholesaleItems, address);
      return sendSuccess(res, wholesaleOrder, 'Wholesale order created successfully', 201);
    }

    const deliveryAddress = (address && String(address).trim()) ? String(address).trim() : 'Address not provided';

    const hasProduct = items.some(item => item.referenceType === 'PRODUCT');
    const hasBookOrMaterial = items.some(item => item.referenceType === 'BOOK' || item.referenceType === 'MATERIAL');
    const hasPrintOption = items.some(item => item.referenceType === 'PRINT_OPTION');

    let orderType = 'PRODUCT';
    if (hasPrintOption && !hasProduct && !hasBookOrMaterial) {
      orderType = 'PRINT';
    } else if (hasBookOrMaterial && !hasProduct && !hasPrintOption) {
      orderType = 'CONTENT';
    } else if (hasProduct) {
      orderType = 'PRODUCT';
    }

    if ((hasProduct && hasBookOrMaterial) || (hasProduct && hasPrintOption) || (hasBookOrMaterial && hasPrintOption)) {
      throw new ValidationError('Cannot mix PRODUCT items with BOOK/MATERIAL/PRINT_OPTION items in the same order');
    }

    // Block institute products in normal order flow
    if (hasProduct) {
      const productItems = items.filter((i) => i.referenceType === 'PRODUCT');
      const productIds = productItems.map((i) => i.referenceId);
      const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, isInstituteProduct: true },
      });

      const instituteProduct = products.find((p) => p.isInstituteProduct);
      if (instituteProduct) {
        throw new ValidationError(
          'Institute products cannot be ordered through the regular order flow. Use /wholesale-orders instead.'
        );
      }
    }

    const total = calculateOrderTotal(items);
    const { latitude, longitude } = req.body;

    const order = await prisma.order.create({
      data: {
        userId,
        total,
        status: ORDER_STATUS.CREATED,
        orderType,
        address: deliveryAddress,
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
            email: true,
          },
        }
      },
    });

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
            email: true,
          },
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
 * Confirm payment for an order (CASH or CREDIT).
 * Updates status to PAID and records paymentMethod. Later: PAYMENT_LINK for web/gateway.
 */
const confirmPayment = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { paymentMethod } = req.body;

    const existingOrder = await prisma.order.findUnique({
      where: { id },
    });

    if (existingOrder) {
      if (existingOrder.userId !== userId && req.userType !== 'ADMIN') {
        throw new NotFoundError('Order not found');
      }

      if (existingOrder.status !== ORDER_STATUS.CREATED) {
        throw new ValidationError('Only orders with status CREATED can be confirmed for payment');
      }

      const order = await prisma.order.update({
        where: { id },
        data: {
          status: ORDER_STATUS.PAID,
          paymentMethod: paymentMethod || null,
          paidAt: new Date(),
        },
        include: {
          items: true,
          user: {
            select: {
              id: true,
              phone: true,
              email: true,
            },
          },
        },
      });

      try {
        const io = req.app.get('io');
        if (io) {
          io.emit('order_updated', order);
        }
        await assignOrderToNearestPrintCenter(id, req.app.get('io') || null);
      } catch (assignErr) {
        console.error('Print assignment failed:', assignErr.message);
      }

      return sendSuccess(res, order, 'Payment confirmed successfully');
    }

    // Institute / wholesale checkout uses WholesaleOrder (same id returned from POST /orders or /wholesale-orders)
    const existingWholesale = await prisma.wholesaleOrder.findUnique({
      where: { id },
      include: {
        customer: { select: { userId: true } },
      },
    });

    if (!existingWholesale) {
      throw new NotFoundError('Order not found');
    }

    if (existingWholesale.customer.userId !== userId && req.userType !== 'ADMIN') {
      throw new NotFoundError('Order not found');
    }

    if (existingWholesale.status !== ORDER_STATUS.CREATED) {
      throw new ValidationError('Only orders with status CREATED can be confirmed for payment');
    }

    const wholesaleOrder = await prisma.wholesaleOrder.update({
      where: { id },
      data: {
        status: ORDER_STATUS.PAID,
      },
      include: {
        items: { include: { product: true } },
        customer: {
          include: {
            user: {
              select: { id: true, phone: true, email: true },
            },
          },
        },
      },
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('wholesale_order_updated', wholesaleOrder);
    }

    return sendSuccess(
      res,
      { ...wholesaleOrder, paymentMethod: paymentMethod || null, orderKind: 'WHOLESALE' },
      'Payment confirmed successfully'
    );
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

    if (existingOrder) {
      if (existingOrder.userId !== userId && req.userType !== 'ADMIN') {
        throw new NotFoundError('Order not found');
      }

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

      return sendSuccess(res, order, 'Order cancelled successfully');
    }

    const existingWholesale = await prisma.wholesaleOrder.findUnique({
      where: { id },
      include: { customer: { select: { userId: true } } },
    });

    if (!existingWholesale) {
      throw new NotFoundError('Order not found');
    }

    if (existingWholesale.customer.userId !== userId && req.userType !== 'ADMIN') {
      throw new NotFoundError('Order not found');
    }

    if (existingWholesale.status === ORDER_STATUS.DELIVERED) {
      throw new ValidationError('Cannot cancel a delivered order');
    }

    if (existingWholesale.status === ORDER_STATUS.CANCELLED) {
      throw new ValidationError('Order is already cancelled');
    }

    const order = await prisma.wholesaleOrder.update({
      where: { id },
      data: { status: ORDER_STATUS.CANCELLED },
      include: {
        items: { include: { product: true } },
      },
    });

    return sendSuccess(res, { ...order, orderKind: 'WHOLESALE' }, 'Order cancelled successfully');
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
  confirmPayment,
  cancelOrder,
};
