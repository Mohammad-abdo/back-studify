/**
 * Order Controller
 * Handles order-related HTTP requests
 */

const orderService = require('../services/orderService');
const { sendSuccess, sendPaginated } = require('../utils/response');

const getMyOrders = async (req, res, next) => {
  try {
    const result = await orderService.getMyOrders({
      userId: req.userId,
      ...req.query,
    });

    sendPaginated(res, result.data, result.pagination, 'Orders retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getActiveOrders = async (req, res, next) => {
  try {
    const result = await orderService.getActiveOrders({
      userId: req.userId,
      ...req.query,
    });

    sendPaginated(res, result.data, result.pagination, 'Active orders retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const order = await orderService.getOrderById({
      id: req.params.id,
      userId: req.userId,
      userType: req.userType,
    });

    sendSuccess(res, order, 'Order retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const createOrder = async (req, res, next) => {
  try {
    const order = await orderService.createOrder({
      userId: req.userId,
      io: req.app.get('io'),
      ...req.body,
    });

    sendSuccess(res, order, 'Order created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const order = await orderService.updateOrderStatus({
      id: req.params.id,
      status: req.body.status,
      io: req.app.get('io'),
    });

    sendSuccess(res, order, 'Order status updated successfully');
  } catch (error) {
    next(error);
  }
};

const confirmPayment = async (req, res, next) => {
  try {
    const order = await orderService.confirmPayment({
      id: req.params.id,
      userId: req.userId,
      userType: req.userType,
      paymentMethod: req.body.paymentMethod,
      io: req.app.get('io'),
    });

    sendSuccess(res, order, 'Payment confirmed successfully');
  } catch (error) {
    next(error);
  }
};

const cancelOrder = async (req, res, next) => {
  try {
    const order = await orderService.cancelOrder({
      id: req.params.id,
      userId: req.userId,
      userType: req.userType,
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
  confirmPayment,
  cancelOrder,
};
