/**
 * Role Controller
 * Handles role-related HTTP requests (Admin only)
 */

const prisma = require('../config/database');
const { sendSuccess, sendPaginated, getPaginationParams, buildPagination } = require('../utils/response');
const { NotFoundError, ConflictError } = require('../utils/errors');

/**
 * Get all roles
 */
const getRoles = async (req, res, next) => {
  try {
    const { page, limit } = getPaginationParams(req.query.page, req.query.limit);
    const { search } = req.query;

    const where = {
      ...(search && {
        name: { contains: search },
      }),
    };

    const [roles, total] = await Promise.all([
      prisma.role.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: {
            select: {
              userRoles: true,
              permissions: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.role.count({ where }),
    ]);

    const pagination = buildPagination(page, limit, total);
    sendPaginated(res, roles, pagination, 'Roles retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get role by ID
 */
const getRoleById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        userRoles: {
          include: {
            user: {
              select: {
                id: true,
                phone: true,
                email: true,
                type: true,
              },
            },
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundError('Role not found');
    }

    sendSuccess(res, role, 'Role retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Create role
 */
const createRole = async (req, res, next) => {
  try {
    const { name, permissionIds } = req.body;

    // Check if role already exists
    const existingRole = await prisma.role.findUnique({
      where: { name },
    });

    if (existingRole) {
      throw new ConflictError('Role with this name already exists');
    }

    const role = await prisma.role.create({
      data: {
        name,
        permissions: permissionIds && permissionIds.length > 0
          ? {
              create: permissionIds.map(permissionId => ({
                permissionId,
              })),
            }
          : undefined,
      },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    sendSuccess(res, role, 'Role created successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Update role
 */
const updateRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, permissionIds } = req.body;

    const existingRole = await prisma.role.findUnique({
      where: { id },
    });

    if (!existingRole) {
      throw new NotFoundError('Role not found');
    }

    // Check name conflict if name is being changed
    if (name && name !== existingRole.name) {
      const nameConflict = await prisma.role.findUnique({
        where: { name },
      });

      if (nameConflict) {
        throw new ConflictError('Role with this name already exists');
      }
    }

    // Update role
    const updateData = {};
    if (name !== undefined) updateData.name = name;

    const role = await prisma.role.update({
      where: { id },
      data: updateData,
    });

    // Update permissions if provided
    if (permissionIds !== undefined) {
      // Delete existing permissions
      await prisma.rolePermission.deleteMany({
        where: { roleId: id },
      });

      // Add new permissions
      if (permissionIds.length > 0) {
        await prisma.rolePermission.createMany({
          data: permissionIds.map(permissionId => ({
            roleId: id,
            permissionId,
          })),
        });
      }
    }

    const updatedRole = await prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    sendSuccess(res, updatedRole, 'Role updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete role
 */
const deleteRole = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingRole = await prisma.role.findUnique({
      where: { id },
    });

    if (!existingRole) {
      throw new NotFoundError('Role not found');
    }

    await prisma.role.delete({
      where: { id },
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


