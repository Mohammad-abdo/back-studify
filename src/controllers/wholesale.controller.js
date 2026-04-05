/**
 * Wholesale Order Controller
 * Handles wholesale order-related HTTP requests
 */

const wholesaleService = require('../services/wholesaleService');
const { sendSuccess, sendPaginated } = require('../utils/response');

const getMyWholesaleOrders = async (req, res, next) => {
  try {
    const result = await wholesaleService.getMyWholesaleOrders({
      userId: req.userId,
      ...req.query,
    });

    sendPaginated(res, result.data, result.pagination, 'Wholesale orders retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getWholesaleOrderById = async (req, res, next) => {
  try {
    const order = await wholesaleService.getWholesaleOrderById({
      id: req.params.id,
      userId: req.userId,
      userType: req.userType,
    });

    sendSuccess(res, order, 'Wholesale order retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const createWholesaleOrder = async (req, res, next) => {
  try {
    const order = await wholesaleService.createWholesaleOrder({
      userId: req.userId,
      ...req.body,
    });

    sendSuccess(res, order, 'Wholesale order created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const updateWholesaleOrderStatus = async (req, res, next) => {
  try {
    const order = await wholesaleService.updateWholesaleOrderStatus({
      id: req.params.id,
      status: req.body.status,
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
