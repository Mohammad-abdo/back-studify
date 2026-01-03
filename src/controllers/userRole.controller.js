/**
 * User Role Controller
 * Handles user role assignment (Admin only)
 */

const prisma = require('../config/database');
const { sendSuccess, sendPaginated, getPaginationParams, buildPagination } = require('../utils/response');
const { NotFoundError, ConflictError } = require('../utils/errors');

/**
 * Get all user roles
 */
const getUserRoles = async (req, res, next) => {
  try {
    const { page, limit } = getPaginationParams(req.query.page, req.query.limit);
    const { userId, roleId } = req.query;

    const where = {
      ...(userId && { userId }),
      ...(roleId && { roleId }),
    };

    const [userRoles, total] = await Promise.all([
      prisma.userRole.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              phone: true,
              email: true,
              type: true,
            },
          },
          role: {
            include: {
              permissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
        orderBy: { id: 'desc' },
      }),
      prisma.userRole.count({ where }),
    ]);

    const pagination = buildPagination(page, limit, total);
    sendPaginated(res, userRoles, pagination, 'User roles retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Assign role to user
 */
const assignRole = async (req, res, next) => {
  try {
    const { userId, roleId } = req.body;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Check if role exists
    const role = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundError('Role not found');
    }

    // Check if assignment already exists
    const existingAssignment = await prisma.userRole.findUnique({
      where: {
        userId_roleId: {
          userId,
          roleId,
        },
      },
    });

    if (existingAssignment) {
      throw new ConflictError('User already has this role');
    }

    const userRole = await prisma.userRole.create({
      data: {
        userId,
        roleId,
      },
      include: {
        user: {
          select: {
            id: true,
            phone: true,
            email: true,
            type: true,
          },
        },
        role: true,
      },
    });

    sendSuccess(res, userRole, 'Role assigned successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Remove role from user
 */
const removeRole = async (req, res, next) => {
  try {
    const { userId, roleId } = req.params;

    const userRole = await prisma.userRole.findUnique({
      where: {
        userId_roleId: {
          userId,
          roleId,
        },
      },
    });

    if (!userRole) {
      throw new NotFoundError('User role assignment not found');
    }

    await prisma.userRole.delete({
      where: {
        userId_roleId: {
          userId,
          roleId,
        },
      },
    });

    sendSuccess(res, null, 'Role removed successfully', 204);
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's roles
 */
const getUserRolesByUserId = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const userRoles = await prisma.userRole.findMany({
      where: { userId },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
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


