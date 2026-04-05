const prisma = require('../config/database');

const findRoles = ({ where, skip, take }) =>
  prisma.role.findMany({
    where,
    skip,
    take,
    include: {
      _count: {
        select: {
          userRoles: true,
          permissions: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  });

const countRoles = (where) =>
  prisma.role.count({ where });

const findRoleById = (id) =>
  prisma.role.findUnique({
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

const findRoleBasicById = (id) =>
  prisma.role.findUnique({
    where: { id },
  });

const findRoleByName = (name) =>
  prisma.role.findUnique({
    where: { name },
  });

const createRole = (data) =>
  prisma.role.create({
    data,
    include: {
      permissions: {
        include: {
          permission: true,
        },
      },
    },
  });

const updateRole = (id, data) =>
  prisma.role.update({
    where: { id },
    data,
  });

const deleteRolePermissions = (roleId) =>
  prisma.rolePermission.deleteMany({
    where: { roleId },
  });

const createRolePermissions = (data) =>
  prisma.rolePermission.createMany({
    data,
  });

const findRoleWithPermissions = (id) =>
  prisma.role.findUnique({
    where: { id },
    include: {
      permissions: {
        include: {
          permission: true,
        },
      },
    },
  });

const deleteRole = (id) =>
  prisma.role.delete({
    where: { id },
  });

module.exports = {
  findRoles,
  countRoles,
  findRoleById,
  findRoleBasicById,
  findRoleByName,
  createRole,
  updateRole,
  deleteRolePermissions,
  createRolePermissions,
  findRoleWithPermissions,
  deleteRole,
};
