const userRoleRepository = require('../repositories/userRoleRepository');
const { buildPagination, getPaginationParams } = require('../utils/response');
const { NotFoundError, ConflictError } = require('../utils/errors');

const getUserRoles = async ({ page, limit, userId, roleId }) => {
  const paginationParams = getPaginationParams(page, limit);
  const where = {
    ...(userId && { userId }),
    ...(roleId && { roleId }),
  };

  const [userRoles, total] = await Promise.all([
    userRoleRepository.findUserRoles({
      where,
      skip: paginationParams.skip,
      take: paginationParams.limit,
    }),
    userRoleRepository.countUserRoles(where),
  ]);

  return {
    data: userRoles,
    pagination: buildPagination(paginationParams.page, paginationParams.limit, total),
  };
};

const assignRole = async ({ userId, roleId }) => {
  const [user, role, existingAssignment] = await Promise.all([
    userRoleRepository.findUserById(userId),
    userRoleRepository.findRoleById(roleId),
    userRoleRepository.findUserRoleByKey({ userId, roleId }),
  ]);

  if (!user) {
    throw new NotFoundError('User not found');
  }

  if (!role) {
    throw new NotFoundError('Role not found');
  }

  if (existingAssignment) {
    throw new ConflictError('User already has this role');
  }

  return userRoleRepository.createUserRole({
    userId,
    roleId,
  });
};

const removeRole = async ({ userId, roleId }) => {
  const userRole = await userRoleRepository.findUserRoleByKey({ userId, roleId });

  if (!userRole) {
    throw new NotFoundError('User role assignment not found');
  }

  await userRoleRepository.deleteUserRole({ userId, roleId });
};

const getUserRolesByUserId = async ({ userId }) => {
  const user = await userRoleRepository.findUserById(userId);

  if (!user) {
    throw new NotFoundError('User not found');
  }

  return userRoleRepository.findRolesByUserId(userId);
};

module.exports = {
  getUserRoles,
  assignRole,
  removeRole,
  getUserRolesByUserId,
};
