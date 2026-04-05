const prisma = require('../config/database');

const findUserRoles = ({ where, skip, take }) =>
  prisma.userRole.findMany({
    where,
    skip,
    take,
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
  });

const countUserRoles = (where) =>
  prisma.userRole.count({ where });

const findUserById = (userId) =>
  prisma.user.findUnique({
    where: { id: userId },
  });

const findRoleById = (roleId) =>
  prisma.role.findUnique({
    where: { id: roleId },
  });

const findUserRoleByKey = ({ userId, roleId }) =>
  prisma.userRole.findUnique({
    where: {
      userId_roleId: {
        userId,
        roleId,
      },
    },
  });

const createUserRole = (data) =>
  prisma.userRole.create({
    data,
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

const deleteUserRole = ({ userId, roleId }) =>
  prisma.userRole.delete({
    where: {
      userId_roleId: {
        userId,
        roleId,
      },
    },
  });

const findRolesByUserId = (userId) =>
  prisma.userRole.findMany({
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

module.exports = {
  findUserRoles,
  countUserRoles,
  findUserById,
  findRoleById,
  findUserRoleByKey,
  createUserRole,
  deleteUserRole,
  findRolesByUserId,
};
