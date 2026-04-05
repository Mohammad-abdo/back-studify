/**
 * Permission Controller
 * Handles permission-related HTTP requests (Admin only)
 */

const permissionService = require('../services/permissionService');
const { sendSuccess, sendPaginated } = require('../utils/response');

const getPermissions = async (req, res, next) => {
  try {
    const result = await permissionService.getPermissions(req.query);
    sendPaginated(res, result.data, result.pagination, 'Permissions retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getPermissionById = async (req, res, next) => {
  try {
    const permission = await permissionService.getPermissionById({
      id: req.params.id,
    });

    sendSuccess(res, permission, 'Permission retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const createPermission = async (req, res, next) => {
  try {
    const permission = await permissionService.createPermission(req.body);
    sendSuccess(res, permission, 'Permission created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const updatePermission = async (req, res, next) => {
  try {
    const permission = await permissionService.updatePermission({
      id: req.params.id,
      key: req.body.key,
    });

    sendSuccess(res, permission, 'Permission updated successfully');
  } catch (error) {
    next(error);
  }
};

const deletePermission = async (req, res, next) => {
  try {
    await permissionService.deletePermission({
      id: req.params.id,
    });

    sendSuccess(res, null, 'Permission deleted successfully', 204);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPermissions,
  getPermissionById,
  createPermission,
  updatePermission,
  deletePermission,
};
