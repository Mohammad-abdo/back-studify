/**
 * Role-Based Access Control Middleware
 * Checks if user has required role(s) or permissions
 */

const { AuthorizationError } = require('../utils/errors');
const prisma = require('../config/database');

/**
 * Check if user has one of the required user types
 */
const requireUserType = (...allowedTypes) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        throw new AuthorizationError('Authentication required');
      }

      if (!allowedTypes.includes(req.user.type)) {
        throw new AuthorizationError(
          `Access denied. Required user types: ${allowedTypes.join(', ')}`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Check if user has one of the required roles
 */
const requireRole = (...roleNames) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        throw new AuthorizationError('Authentication required');
      }

      // Get user roles
      const userRoles = await prisma.userRole.findMany({
        where: { userId: req.user.id },
        include: { role: true },
      });

      const userRoleNames = userRoles.map((ur) => ur.role.name);

      const hasRole = roleNames.some((roleName) => userRoleNames.includes(roleName));

      if (!hasRole) {
        throw new AuthorizationError(
          `Access denied. Required roles: ${roleNames.join(', ')}`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Check if user has one of the required permissions
 */
const requirePermission = (...permissionKeys) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        throw new AuthorizationError('Authentication required');
      }

      // Get user permissions through roles
      const userRoles = await prisma.userRole.findMany({
        where: { userId: req.user.id },
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

      // Extract all permission keys
      const userPermissions = new Set();
      userRoles.forEach((userRole) => {
        userRole.role.permissions.forEach((rp) => {
          userPermissions.add(rp.permission.key);
        });
      });

      const hasPermission = permissionKeys.some((key) => userPermissions.has(key));

      if (!hasPermission) {
        throw new AuthorizationError(
          `Access denied. Required permissions: ${permissionKeys.join(', ')}`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = {
  requireUserType,
  requireRole,
  requirePermission,
};

