const prisma = require('../config/database');

const findReports = ({ where, skip, take }) =>
  prisma.report.findMany({
    where,
    skip,
    take,
    orderBy: { createdAt: 'desc' },
  });

const countReports = (where) =>
  prisma.report.count({ where });

const findReportById = (id) =>
  prisma.report.findUnique({
    where: { id },
  });

const createReport = (data) =>
  prisma.report.create({
    data,
  });

const updateReport = (id, data) =>
  prisma.report.update({
    where: { id },
    data,
  });

const deleteReport = (id) =>
  prisma.report.delete({
    where: { id },
  });

module.exports = {
  findReports,
  countReports,
  findReportById,
  createReport,
  updateReport,
  deleteReport,
};
