const wholesaleRepository = require('../repositories/wholesaleRepository');
const { buildPagination, getPaginationParams } = require('../utils/response');
const { NotFoundError, AuthorizationError, ValidationError } = require('../utils/errors');
const { ORDER_STATUS } = require('../utils/constants');
const { calculateOrderTotal } = require('../utils/helpers');

const getCustomerOrThrow = async (userId, message = 'Only wholesale customers can access this') => {
  const customer = await wholesaleRepository.findCustomerByUserId(userId);

  if (!customer) {
    throw new AuthorizationError(message);
  }

  return customer;
};

const getMyWholesaleOrders = async ({ userId, page, limit, status }) => {
  const customer = await getCustomerOrThrow(userId);
  const paginationParams = getPaginationParams(page, limit);
  const where = {
    customerId: customer.id,
    ...(status && { status }),
  };

  const [orders, total] = await Promise.all([
    wholesaleRepository.findWholesaleOrders({
      where,
      skip: paginationParams.skip,
      take: paginationParams.limit,
    }),
    wholesaleRepository.countWholesaleOrders(where),
  ]);

  return {
    data: orders,
    pagination: buildPagination(paginationParams.page, paginationParams.limit, total),
  };
};

const getWholesaleOrderById = async ({ id, userId, userType }) => {
  const customer = await getCustomerOrThrow(userId);
  const order = await wholesaleRepository.findWholesaleOrderById(id);

  if (!order) {
    throw new NotFoundError('Wholesale order not found');
  }

  if (order.customerId !== customer.id && userType !== 'ADMIN') {
    throw new NotFoundError('Wholesale order not found');
  }

  return order;
};

const createWholesaleOrder = async ({ userId, items, address }) => {
  if (!items || items.length === 0) {
    throw new ValidationError('Order must have at least one item');
  }

  const customer = await getCustomerOrThrow(userId, 'Only wholesale customers can create wholesale orders');
  const total = calculateOrderTotal(items);

  return wholesaleRepository.createWholesaleOrder({
    customerId: customer.id,
    total,
    status: ORDER_STATUS.CREATED,
    address,
    items: {
      create: items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
      })),
    },
  });
};

const updateWholesaleOrderStatus = async ({ id, status }) => {
  const existingOrder = await wholesaleRepository.findWholesaleOrderBasicById(id);

  if (!existingOrder) {
    throw new NotFoundError('Wholesale order not found');
  }

  return wholesaleRepository.updateWholesaleOrder(id, { status });
};

module.exports = {
  getMyWholesaleOrders,
  getWholesaleOrderById,
  createWholesaleOrder,
  updateWholesaleOrderStatus,
};
