/**
 * Permission Controller
 * Handles permission-related HTTP requests (Admin only)
 */

const prisma = require('../config/database');
const { sendSuccess, sendPaginated, getPaginationParams, buildPagination } = require('../utils/response');
const { NotFoundError, ConflictError } = require('../utils/errors');

/**
 * Get all permissions
 */
const getPermissions = async (req, res, next) => {
  try {
    const { page, limit } = getPaginationParams(req.query.page, req.query.limit);
    const { search } = req.query;

    const where = {
      ...(search && {
        key: { contains: search },
      }),
    };

    const [permissions, total] = await Promise.all([
      prisma.permission.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: {
            select: {
              rolePermissions: true,
            },
          },
        },
        orderBy: { key: 'asc' },
      }),
      prisma.permission.count({ where }),
    ]);

    const pagination = buildPagination(page, limit, total);
    sendPaginated(res, permissions, pagination, 'Permissions retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get permission by ID
 */
const getPermissionById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const permission = await prisma.permission.findUnique({
      where: { id },
      include: {
        rolePermissions: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!permission) {
      throw new NotFoundError('Permission not found');
    }

    sendSuccess(res, permission, 'Permission retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Create permission
 */
const createPermission = async (req, res, next) => {
  try {
    const { key } = req.body;

    // Check if permission already exists
    const existingPermission = await prisma.permission.findUnique({
      where: { key },
    });

    if (existingPermission) {
      throw new ConflictError('Permission with this key already exists');
    }

    const permission = await prisma.permission.create({
      data: { key },
    });

    sendSuccess(res, permission, 'Permission created successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Update permission
 */
const updatePermission = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { key } = req.body;

    const existingPermission = await prisma.permission.findUnique({
      where: { id },
    });

    if (!existingPermission) {
      throw new NotFoundError('Permission not found');
    }

    // Check key conflict if key is being changed
    if (key && key !== existingPermission.key) {
      const keyConflict = await prisma.permission.findUnique({
        where: { key },
      });

      if (keyConflict) {
        throw new ConflictError('Permission with this key already exists');
      }
    }

    const permission = await prisma.permission.update({
      where: { id },
      data: { key },
    });

    sendSuccess(res, permission, 'Permission updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete permission
 */
const deletePermission = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingPermission = await prisma.permission.findUnique({
      where: { id },
    });

    if (!existingPermission) {
      throw new NotFoundError('Permission not found');
    }

    await prisma.permission.delete({
      where: { id },
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


