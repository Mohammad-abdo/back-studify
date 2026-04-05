/**
 * Admin Controller
 * Handles admin-related HTTP requests
 */

const adminService = require('../services/adminService');
const { sendSuccess, sendPaginated } = require('../utils/response');

const getRequestMeta = (req) => ({
  ipAddress: req.ip,
  userAgent: req.get('user-agent'),
});

const approveDoctor = async (req, res, next) => {
  try {
    const doctor = await adminService.approveDoctor({
      id: req.params.id,
      adminId: req.user.admin.id,
      requestMeta: getRequestMeta(req),
    });

    sendSuccess(res, doctor, 'Doctor approved successfully');
  } catch (error) {
    next(error);
  }
};

const rejectDoctor = async (req, res, next) => {
  try {
    const doctor = await adminService.rejectDoctor({
      id: req.params.id,
      adminId: req.user.admin.id,
      requestMeta: getRequestMeta(req),
    });

    sendSuccess(res, doctor, 'Doctor rejected successfully');
  } catch (error) {
    next(error);
  }
};

const approveBook = async (req, res, next) => {
  try {
    const book = await adminService.approveBook({
      id: req.params.id,
      adminId: req.user.admin.id,
      requestMeta: getRequestMeta(req),
    });

    sendSuccess(res, book, 'Book approved successfully');
  } catch (error) {
    next(error);
  }
};

const rejectBook = async (req, res, next) => {
  try {
    const book = await adminService.rejectBook({
      id: req.params.id,
      adminId: req.user.admin.id,
      requestMeta: getRequestMeta(req),
    });

    sendSuccess(res, book, 'Book rejected successfully');
  } catch (error) {
    next(error);
  }
};

const getPendingApprovals = async (req, res, next) => {
  try {
    const approvals = await adminService.getPendingApprovals({
      type: req.query.type,
    });

    const message = req.query.type === 'DOCTOR'
      ? 'Pending doctors retrieved successfully'
      : 'Pending books retrieved successfully';

    sendSuccess(res, approvals, message);
  } catch (error) {
    next(error);
  }
};

const getOperationLogs = async (req, res, next) => {
  try {
    const result = await adminService.getOperationLogs(req.query);
    sendPaginated(res, result.data, result.pagination, 'Operation logs retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getUsers = async (req, res, next) => {
  try {
    const result = await adminService.getUsers(req.query);
    sendPaginated(res, result.data, result.pagination, 'Users retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const user = await adminService.getUserById({
      id: req.params.id,
    });

    sendSuccess(res, user, 'User retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const user = await adminService.updateUser({
      id: req.params.id,
      ...req.body,
      adminId: req.userId,
      requestMeta: getRequestMeta(req),
    });

    sendSuccess(res, user, 'User updated successfully');
  } catch (error) {
    next(error);
  }
};

const getDashboardStats = async (req, res, next) => {
  try {
    const stats = await adminService.getDashboardStats();
    sendSuccess(res, stats, 'Dashboard statistics retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getReviews = async (req, res, next) => {
  try {
    const result = await adminService.getReviews(req.query);
    sendPaginated(res, result.data, result.pagination, 'Reviews retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getRecentOrders = async (req, res, next) => {
  try {
    const result = await adminService.getRecentOrders(req.query);
    sendPaginated(res, result.data, result.pagination, 'Orders retrieved successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  approveDoctor,
  rejectDoctor,
  approveBook,
  rejectBook,
  getPendingApprovals,
  getOperationLogs,
  getDashboardStats,
  getUsers,
  getUserById,
  updateUser,
  getReviews,
  getRecentOrders,
};
