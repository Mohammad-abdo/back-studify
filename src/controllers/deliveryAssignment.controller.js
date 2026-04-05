/**
 * Delivery Assignment Controller
 * Handles delivery assignment-related HTTP requests (Admin only for CRUD)
 */

const deliveryAssignmentService = require('../services/deliveryAssignmentService');
const { sendSuccess, sendPaginated } = require('../utils/response');

const getDeliveryAssignments = async (req, res, next) => {
  try {
    const result = await deliveryAssignmentService.getDeliveryAssignments(req.query);
    sendPaginated(res, result.data, result.pagination, 'Delivery assignments retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getDeliveryAssignmentById = async (req, res, next) => {
  try {
    const assignment = await deliveryAssignmentService.getDeliveryAssignmentById({
      id: req.params.id,
    });

    sendSuccess(res, assignment, 'Delivery assignment retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const createDeliveryAssignment = async (req, res, next) => {
  try {
    const assignment = await deliveryAssignmentService.createDeliveryAssignment(req.body);
    sendSuccess(res, assignment, 'Delivery assignment created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const updateDeliveryAssignment = async (req, res, next) => {
  try {
    const assignment = await deliveryAssignmentService.updateDeliveryAssignment({
      id: req.params.id,
      ...req.body,
    });

    sendSuccess(res, assignment, 'Delivery assignment updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteDeliveryAssignment = async (req, res, next) => {
  try {
    await deliveryAssignmentService.deleteDeliveryAssignment({
      id: req.params.id,
    });

    sendSuccess(res, null, 'Delivery assignment deleted successfully', 204);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDeliveryAssignments,
  getDeliveryAssignmentById,
  createDeliveryAssignment,
  updateDeliveryAssignment,
  deleteDeliveryAssignment,
};
