/**
 * Delivery Controller
 * Handles delivery-related HTTP requests
 */

const deliveryService = require('../services/deliveryService');
const { sendSuccess, sendPaginated } = require('../utils/response');

const getProfile = async (req, res, next) => {
  try {
    const delivery = await deliveryService.getProfile({
      userId: req.userId,
    });

    sendSuccess(res, delivery, 'Profile retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const delivery = await deliveryService.updateProfile({
      userId: req.userId,
      ...req.body,
    });

    sendSuccess(res, delivery, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const delivery = await deliveryService.updateStatus({
      userId: req.userId,
      status: req.body.status,
    });

    sendSuccess(res, delivery, 'Status updated successfully');
  } catch (error) {
    next(error);
  }
};

const getAssignments = async (req, res, next) => {
  try {
    const result = await deliveryService.getAssignments({
      userId: req.userId,
      ...req.query,
    });

    sendPaginated(res, result.data, result.pagination, 'Assignments retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const updateLocation = async (req, res, next) => {
  try {
    const location = await deliveryService.updateLocation({
      userId: req.userId,
      ...req.body,
      io: req.app.get('io'),
    });

    sendSuccess(res, location, 'Location updated successfully', 201);
  } catch (error) {
    next(error);
  }
};

const getWallet = async (req, res, next) => {
  try {
    const wallet = await deliveryService.getWallet({
      userId: req.userId,
    });

    sendSuccess(res, wallet, 'Wallet retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const markPickedUp = async (req, res, next) => {
  try {
    const assignment = await deliveryService.markPickedUp({
      userId: req.userId,
      orderId: req.params.orderId,
    });

    sendSuccess(res, assignment, 'Order marked as picked up');
  } catch (error) {
    next(error);
  }
};

const markDelivered = async (req, res, next) => {
  try {
    const assignment = await deliveryService.markDelivered({
      userId: req.userId,
      orderId: req.params.orderId,
    });

    sendSuccess(res, assignment, 'Order marked as delivered');
  } catch (error) {
    next(error);
  }
};

const getActiveOrder = async (req, res, next) => {
  try {
    const assignment = await deliveryService.getActiveOrder({
      userId: req.userId,
    });

    sendSuccess(res, assignment, 'Active order retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const postPolylines = async (req, res, next) => {
  try {
    const data = await deliveryService.postPolylines({
      userId: req.userId,
      latitude: req.body.latitude,
      longitude: req.body.longitude,
      points: req.body.points,
    });

    sendSuccess(res, data, 'Polylines computed successfully');
  } catch (error) {
    next(error);
  }
};

const getShippingHistory = async (req, res, next) => {
  try {
    const result = await deliveryService.getShippingHistory({
      userId: req.userId,
      ...req.query,
    });

    sendPaginated(res, result.data, result.pagination, 'Shipping history retrieved successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  updateStatus,
  getAssignments,
  updateLocation,
  getWallet,
  markPickedUp,
  markDelivered,
  getActiveOrder,
  postPolylines,
  getShippingHistory,
};
