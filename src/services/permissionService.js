const permissionRepository = require('../repositories/permissionRepository');
const { buildPagination, getPaginationParams } = require('../utils/response');
const { NotFoundError, ConflictError } = require('../utils/errors');

const getPermissions = async ({ page, limit, search }) => {
  const paginationParams = getPaginationParams(page, limit);
  const where = {
    ...(search && {
      key: { contains: search },
    }),
  };

  const [permissions, total] = await Promise.all([
    permissionRepository.findPermissions({
      where,
      skip: paginationParams.skip,
      take: paginationParams.limit,
    }),
    permissionRepository.countPermissions(where),
  ]);

  return {
    data: permissions,
    pagination: buildPagination(paginationParams.page, paginationParams.limit, total),
  };
};

const getPermissionById = async ({ id }) => {
  const permission = await permissionRepository.findPermissionById(id);

  if (!permission) {
    throw new NotFoundError('Permission not found');
  }

  return permission;
};

const createPermission = async ({ key }) => {
  const existingPermission = await permissionRepository.findPermissionByKey(key);

  if (existingPermission) {
    throw new ConflictError('Permission with this key already exists');
  }

  return permissionRepository.createPermission({ key });
};

const updatePermission = async ({ id, key }) => {
  const existingPermission = await permissionRepository.findPermissionBasicById(id);

  if (!existingPermission) {
    throw new NotFoundError('Permission not found');
  }

  if (key && key !== existingPermission.key) {
    const keyConflict = await permissionRepository.findPermissionByKey(key);

    if (keyConflict) {
      throw new ConflictError('Permission with this key already exists');
    }
  }

  return permissionRepository.updatePermission(id, { key });
};

const deletePermission = async ({ id }) => {
  const existingPermission = await permissionRepository.findPermissionBasicById(id);

  if (!existingPermission) {
    throw new NotFoundError('Permission not found');
  }

  await permissionRepository.deletePermission(id);
};

module.exports = {
  getPermissions,
  getPermissionById,
  createPermission,
  updatePermission,
  deletePermission,
};
