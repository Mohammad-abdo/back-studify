/**
 * Print Order Assignment Controller
 * Handles print order assignments (admin + print center dashboard)
 */

const printOrderAssignmentService = require('../services/printOrderAssignmentService');
const { sendSuccess, sendPaginated } = require('../utils/response');

const getMyAssignments = async (req, res, next) => {
  try {
    const result = await printOrderAssignmentService.getMyAssignments({
      printCenterId: req.printCenterId,
      ...req.query,
    });

    sendPaginated(res, result.data, result.pagination, 'Assignments retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getAllAssignments = async (req, res, next) => {
  try {
    const result = await printOrderAssignmentService.getAllAssignments(req.query);
    sendPaginated(res, result.data, result.pagination, 'Assignments retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getAssignmentById = async (req, res, next) => {
  try {
    const assignment = await printOrderAssignmentService.getAssignmentById({
      id: req.params.id,
      userType: req.userType,
      printCenterId: req.printCenterId,
    });

    sendSuccess(res, assignment, 'Assignment retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const updateAssignmentStatus = async (req, res, next) => {
  try {
    const updated = await printOrderAssignmentService.updateAssignmentStatus({
      id: req.params.id,
      status: req.body.status,
      notes: req.body.notes,
      userType: req.userType,
      printCenterId: req.printCenterId,
      io: req.app.get('io'),
    });

    sendSuccess(res, updated, 'Assignment status updated successfully');
  } catch (error) {
    next(error);
  }
};

const trackOrder = async (req, res, next) => {
  try {
    const assignment = await printOrderAssignmentService.trackOrder({
      orderId: req.params.orderId,
    });

    sendSuccess(res, assignment, 'Assignment retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getAssignmentByOrderId = async (req, res, next) => {
  try {
    const assignment = await printOrderAssignmentService.getAssignmentByOrderId({
      orderId: req.params.orderId,
      userId: req.userId,
      printCenterId: req.printCenterId,
      userType: req.userType,
    });

    sendSuccess(res, assignment, 'Assignment retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getDeliveryTracking = async (req, res, next) => {
  try {
    const tracking = await printOrderAssignmentService.getDeliveryTracking({
      id: req.params.id,
      userType: req.userType,
      printCenterId: req.printCenterId,
    });

    if (tracking.hasDelivery) {
      sendSuccess(res, tracking, 'Delivery tracking retrieved successfully');
    } else {
      sendSuccess(res, tracking, 'No delivery assigned');
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyAssignments,
  getAllAssignments,
  getAssignmentById,
  getAssignmentByOrderId,
  updateAssignmentStatus,
  trackOrder,
  getDeliveryTracking,
};
