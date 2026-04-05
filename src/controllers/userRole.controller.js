/**
 * User Role Controller
 * Handles user role assignment (Admin only)
 */

const userRoleService = require('../services/userRoleService');
const { sendSuccess, sendPaginated } = require('../utils/response');

const getUserRoles = async (req, res, next) => {
  try {
    const result = await userRoleService.getUserRoles(req.query);
    sendPaginated(res, result.data, result.pagination, 'User roles retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const assignRole = async (req, res, next) => {
  try {
    const userRole = await userRoleService.assignRole(req.body);
    sendSuccess(res, userRole, 'Role assigned successfully', 201);
  } catch (error) {
    next(error);
  }
};

const removeRole = async (req, res, next) => {
  try {
    await userRoleService.removeRole({
      userId: req.params.userId,
      roleId: req.params.roleId,
    });

    sendSuccess(res, null, 'Role removed successfully', 204);
  } catch (error) {
    next(error);
  }
};

const getUserRolesByUserId = async (req, res, next) => {
  try {
    const userRoles = await userRoleService.getUserRolesByUserId({
      userId: req.params.userId,
    });

    sendSuccess(res, userRoles, 'User roles retrieved successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserRoles,
  assignRole,
  removeRole,
  getUserRolesByUserId,
};
