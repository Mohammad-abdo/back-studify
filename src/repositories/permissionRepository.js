const prisma = require('../config/database');

const findPermissions = ({ where, skip, take }) =>
  prisma.permission.findMany({
    where,
    skip,
    take,
    include: {
      _count: {
        select: {
          rolePermissions: true,
        },
      },
    },
    orderBy: { key: 'asc' },
  });

const countPermissions = (where) =>
  prisma.permission.count({ where });

const findPermissionById = (id) =>
  prisma.permission.findUnique({
    where: { id },
    include: {
      rolePermissions: {
        include: {
          role: true,
        },
      },
    },
  });

const findPermissionBasicById = (id) =>
  prisma.permission.findUnique({
    where: { id },
  });

const findPermissionByKey = (key) =>
  prisma.permission.findUnique({
    where: { key },
  });

const createPermission = (data) =>
  prisma.permission.create({ data });

const updatePermission = (id, data) =>
  prisma.permission.update({
    where: { id },
    data,
  });

const deletePermission = (id) =>
  prisma.permission.delete({
    where: { id },
  });

module.exports = {
  findPermissions,
  countPermissions,
  findPermissionById,
  findPermissionBasicById,
  findPermissionByKey,
  createPermission,
  updatePermission,
  deletePermission,
};
