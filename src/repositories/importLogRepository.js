const prisma = require('../config/database');

const findImportLogs = ({ where, skip, take }) =>
  prisma.importLog.findMany({
    where,
    skip,
    take,
    orderBy: { createdAt: 'desc' },
  });

const countImportLogs = (where) =>
  prisma.importLog.count({ where });

const findImportLogById = (id) =>
  prisma.importLog.findUnique({
    where: { id },
  });

const createImportLog = (data) =>
  prisma.importLog.create({
    data,
  });

const deleteImportLog = (id) =>
  prisma.importLog.delete({
    where: { id },
  });

module.exports = {
  findImportLogs,
  countImportLogs,
  findImportLogById,
  createImportLog,
  deleteImportLog,
};
