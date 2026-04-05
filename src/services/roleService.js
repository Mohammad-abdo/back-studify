const roleRepository = require('../repositories/roleRepository');
const { buildPagination, getPaginationParams } = require('../utils/response');
const { NotFoundError, ConflictError } = require('../utils/errors');

const getRoles = async ({ page, limit, search }) => {
  const paginationParams = getPaginationParams(page, limit);
  const where = {
    ...(search && {
      name: { contains: search },
    }),
  };

  const [roles, total] = await Promise.all([
    roleRepository.findRoles({
      where,
      skip: paginationParams.skip,
      take: paginationParams.limit,
    }),
    roleRepository.countRoles(where),
  ]);

  return {
    data: roles,
    pagination: buildPagination(paginationParams.page, paginationParams.limit, total),
  };
};

const getRoleById = async ({ id }) => {
  const role = await roleRepository.findRoleById(id);

  if (!role) {
    throw new NotFoundError('Role not found');
  }

  return role;
};

const createRole = async ({ name, permissionIds }) => {
  const existingRole = await roleRepository.findRoleByName(name);

  if (existingRole) {
    throw new ConflictError('Role with this name already exists');
  }

  return roleRepository.createRole({
    name,
    permissions: permissionIds && permissionIds.length > 0
      ? {
          create: permissionIds.map((permissionId) => ({
            permissionId,
          })),
        }
      : undefined,
  });
};

const updateRole = async ({ id, name, permissionIds }) => {
  const existingRole = await roleRepository.findRoleBasicById(id);

  if (!existingRole) {
    throw new NotFoundError('Role not found');
  }

  if (name && name !== existingRole.name) {
    const nameConflict = await roleRepository.findRoleByName(name);

    if (nameConflict) {
      throw new ConflictError('Role with this name already exists');
    }
  }

  const updateData = {};
  if (name !== undefined) updateData.name = name;

  await roleRepository.updateRole(id, updateData);

  if (permissionIds !== undefined) {
    await roleRepository.deleteRolePermissions(id);

    if (permissionIds.length > 0) {
      await roleRepository.createRolePermissions(
        permissionIds.map((permissionId) => ({
          roleId: id,
          permissionId,
        })),
      );
    }
  }

  return roleRepository.findRoleWithPermissions(id);
};

const deleteRole = async ({ id }) => {
  const existingRole = await roleRepository.findRoleBasicById(id);

  if (!existingRole) {
    throw new NotFoundError('Role not found');
  }

  await roleRepository.deleteRole(id);
};

module.exports = {
  getRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
};
