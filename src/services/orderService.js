const orderRepository = require('../repositories/orderRepository');
const contentRepository = require('../repositories/contentRepository');
const { buildPagination, getPaginationParams } = require('../utils/response');
const { NotFoundError, ValidationError } = require('../utils/errors');
const { ORDER_STATUS } = require('../utils/constants');
const { calculateOrderTotal } = require('../utils/helpers');
const { assignOrderToNearestPrintCenter } = require('./printOrderAssignment.service');

const getReferenceMaps = async (items) => {
  const bookIds = [...new Set(items.filter((item) => item.referenceType === 'BOOK').map((item) => item.referenceId))];
  const materialIds = [...new Set(items.filter((item) => item.referenceType === 'MATERIAL').map((item) => item.referenceId))];
  const productIds = [...new Set(items.filter((item) => item.referenceType === 'PRODUCT').map((item) => item.referenceId))];

  const [books, materials, products] = await Promise.all([
    bookIds.length ? contentRepository.findBooksForOrderItems(bookIds) : [],
    materialIds.length ? contentRepository.findMaterialsForOrderItems(materialIds) : [],
    productIds.length ? contentRepository.findProductsForOrderItems(productIds) : [],
  ]);

  return {
    books: Object.fromEntries(books.map((book) => [book.id, book])),
    materials: Object.fromEntries(materials.map((material) => [material.id, material])),
    products: Object.fromEntries(products.map((product) => [product.id, product])),
  };
};

const enrichOrders = async (orders, { includeDisplayFields = false } = {}) => {
  const allItems = orders.flatMap((order) => order.items || []);
  const referenceMaps = await getReferenceMaps(allItems);

  return orders.map((order) => ({
    ...order,
    items: (order.items || []).map((item) => {
      let reference = null;
      if (item.referenceType === 'BOOK') {
        reference = referenceMaps.books[item.referenceId] || null;
      } else if (item.referenceType === 'MATERIAL') {
        reference = referenceMaps.materials[item.referenceId] || null;
      } else if (item.referenceType === 'PRODUCT') {
        reference = referenceMaps.products[item.referenceId] || null;
      }

      const enrichedItem = {
        ...item,
        reference,
      };

      if (includeDisplayFields) {
        enrichedItem.displayTitle =
          reference?.title ||
          reference?.name ||
          '';
        enrichedItem.doctorName =
          item.referenceType === 'BOOK' || item.referenceType === 'MATERIAL'
            ? reference?.doctor?.name || ''
            : '';
      }

      return enrichedItem;
    }),
  }));
};

const getMyOrders = async ({ userId, page, limit, status }) => {
  const paginationParams = getPaginationParams(page, limit);
  const where = {
    userId,
    ...(status && { status }),
  };

  const [orders, total] = await Promise.all([
    orderRepository.findOrders({
      where,
      skip: paginationParams.skip,
      take: paginationParams.limit,
    }),
    orderRepository.countOrders(where),
  ]);

  return {
    data: await enrichOrders(orders),
    pagination: buildPagination(paginationParams.page, paginationParams.limit, total),
  };
};

const getActiveOrders = async ({ userId, page, limit }) => {
  const paginationParams = getPaginationParams(page, limit);
  const where = {
    userId,
    status: {
      notIn: ['DELIVERED', 'CANCELLED'],
    },
  };

  const [orders, total] = await Promise.all([
    orderRepository.findOrders({
      where,
      skip: paginationParams.skip,
      take: paginationParams.limit,
    }),
    orderRepository.countOrders(where),
  ]);

  return {
    data: await enrichOrders(orders, { includeDisplayFields: true }),
    pagination: buildPagination(paginationParams.page, paginationParams.limit, total),
  };
};

const getOrderById = async ({ id, userId, userType }) => {
  const order = await orderRepository.findOrderById(id);

  if (!order) {
    throw new NotFoundError('Order not found');
  }

  if (order.userId !== userId && userType !== 'ADMIN') {
    throw new NotFoundError('Order not found');
  }

  const orderForResponse = {
    ...order,
    address: order.address && String(order.address).trim() ? order.address : 'Address not provided',
  };

  const user = orderForResponse.user || {};
  orderForResponse.customerName =
    user.student?.name ||
    user.doctor?.name ||
    user.customer?.contactPerson ||
    user.customer?.entityName ||
    user.phone ||
    null;

  return orderForResponse;
};

const createOrder = async ({ userId, items, address, latitude, longitude, io }) => {
  if (!items || items.length === 0) {
    throw new ValidationError('Order must have at least one item');
  }

  const deliveryAddress = address && String(address).trim() ? String(address).trim() : 'Address not provided';

  const hasProduct = items.some((item) => item.referenceType === 'PRODUCT');
  const hasBookOrMaterial = items.some((item) => item.referenceType === 'BOOK' || item.referenceType === 'MATERIAL');
  const hasPrintOption = items.some((item) => item.referenceType === 'PRINT_OPTION');

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

  const total = calculateOrderTotal(items);

  const order = await orderRepository.createOrder({
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
  });

  if (io) {
    io.emit('new_order', order);
  }

  return order;
};

const updateOrderStatus = async ({ id, status, io }) => {
  const existingOrder = await orderRepository.findOrderBasicById(id);

  if (!existingOrder) {
    throw new NotFoundError('Order not found');
  }

  const order = await orderRepository.updateOrder(id, { status });

  if (status === ORDER_STATUS.PAID) {
    try {
      await assignOrderToNearestPrintCenter(id, io || null);
    } catch (assignErr) {
      console.error('Print assignment failed:', assignErr.message);
    }
  }

  if (io) {
    io.emit('order_updated', order);
  }

  return order;
};

const confirmPayment = async ({ id, userId, userType, paymentMethod, io }) => {
  const existingOrder = await orderRepository.findOrderBasicById(id);

  if (!existingOrder) {
    throw new NotFoundError('Order not found');
  }

  if (existingOrder.userId !== userId && userType !== 'ADMIN') {
    throw new NotFoundError('Order not found');
  }

  if (existingOrder.status !== ORDER_STATUS.CREATED) {
    throw new ValidationError('Only orders with status CREATED can be confirmed for payment');
  }

  const order = await orderRepository.updateOrder(id, {
    status: ORDER_STATUS.PAID,
    paymentMethod: paymentMethod || null,
    paidAt: new Date(),
  });

  try {
    if (io) {
      io.emit('order_updated', order);
    }
    await assignOrderToNearestPrintCenter(id, io || null);
  } catch (assignErr) {
    console.error('Print assignment failed:', assignErr.message);
  }

  return order;
};

const cancelOrder = async ({ id, userId, userType }) => {
  const existingOrder = await orderRepository.findOrderBasicById(id);

  if (!existingOrder) {
    throw new NotFoundError('Order not found');
  }

  if (existingOrder.userId !== userId && userType !== 'ADMIN') {
    throw new NotFoundError('Order not found');
  }

  if (existingOrder.status === ORDER_STATUS.DELIVERED) {
    throw new ValidationError('Cannot cancel a delivered order');
  }

  if (existingOrder.status === ORDER_STATUS.CANCELLED) {
    throw new ValidationError('Order is already cancelled');
  }

  return orderRepository.updateOrder(id, { status: ORDER_STATUS.CANCELLED });
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
