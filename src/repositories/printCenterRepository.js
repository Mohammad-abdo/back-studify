const prisma = require('../config/database');

const printCenterListInclude = {
  user: {
    select: {
      id: true,
      phone: true,
      email: true,
      avatarUrl: true,
      isActive: true,
    },
  },
};

const printCenterDetailInclude = {
  user: {
    select: {
      id: true,
      phone: true,
      email: true,
      avatarUrl: true,
      isActive: true,
    },
  },
  printAssignments: {
    include: {
      order: {
        include: {
          user: {
            select: {
              id: true,
              phone: true,
              email: true,
              student: { select: { name: true } },
              doctor: { select: { name: true } },
              customer: { select: { contactPerson: true, entityName: true } },
            },
          },
          items: true,
        },
      },
    },
    orderBy: { assignedAt: 'desc' },
    take: 100,
  },
};

const findPrintCenters = ({ where, skip, take }) =>
  prisma.printCenter.findMany({
    where,
    skip,
    take,
    include: printCenterListInclude,
    orderBy: { createdAt: 'desc' },
  });

const countPrintCenters = (where) =>
  prisma.printCenter.count({ where });

const findUserByPhone = (phone) =>
  prisma.user.findUnique({
    where: { phone },
  });

const findUserByEmail = (email) =>
  prisma.user.findUnique({
    where: { email },
  });

const createPrintCenterWithUser = ({ userData, printCenterData }) =>
  prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: userData,
    });

    return tx.printCenter.create({
      data: {
        ...printCenterData,
        userId: user.id,
      },
      include: printCenterListInclude,
    });
  });

const findPrintCenterById = (id) =>
  prisma.printCenter.findUnique({
    where: { id },
    include: printCenterDetailInclude,
  });

const findPrintCenterBasicById = (id) =>
  prisma.printCenter.findUnique({
    where: { id },
  });

const aggregatePrintAssignmentCount = (printCenterId) =>
  prisma.printOrderAssignment.aggregate({
    where: { printCenterId },
    _count: { id: true },
  });

const groupPrintAssignmentsByStatus = (printCenterId) =>
  prisma.printOrderAssignment.groupBy({
    by: ['status'],
    where: { printCenterId },
    _count: { id: true },
  });

const updatePrintCenter = (id, data) =>
  prisma.printCenter.update({
    where: { id },
    data,
  });

const deleteUser = (id) =>
  prisma.user.delete({
    where: { id },
  });

module.exports = {
  findPrintCenters,
  countPrintCenters,
  findUserByPhone,
  findUserByEmail,
  createPrintCenterWithUser,
  findPrintCenterById,
  findPrintCenterBasicById,
  aggregatePrintAssignmentCount,
  groupPrintAssignmentsByStatus,
  updatePrintCenter,
  deleteUser,
};
