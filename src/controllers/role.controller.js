/**
 * Role Controller
 * Handles role-related HTTP requests (Admin only)
 */

const roleService = require('../services/roleService');
const { sendSuccess, sendPaginated } = require('../utils/response');

const getRoles = async (req, res, next) => {
  try {
    const result = await roleService.getRoles(req.query);
    sendPaginated(res, result.data, result.pagination, 'Roles retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getRoleById = async (req, res, next) => {
  try {
    const role = await roleService.getRoleById({
      id: req.params.id,
    });

    sendSuccess(res, role, 'Role retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const createRole = async (req, res, next) => {
  try {
    const role = await roleService.createRole(req.body);
    sendSuccess(res, role, 'Role created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const updateRole = async (req, res, next) => {
  try {
    const role = await roleService.updateRole({
      id: req.params.id,
      ...req.body,
    });

    sendSuccess(res, role, 'Role updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteRole = async (req, res, next) => {
  try {
    await roleService.deleteRole({
      id: req.params.id,
    });

    sendSuccess(res, null, 'Role deleted successfully', 204);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
};
