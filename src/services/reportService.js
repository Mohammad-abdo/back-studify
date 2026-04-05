const reportRepository = require('../repositories/reportRepository');
const { buildPagination, getPaginationParams } = require('../utils/response');
const { NotFoundError } = require('../utils/errors');

const getReports = async ({ page, limit, search }) => {
  const paginationParams = getPaginationParams(page, limit);
  const where = {
    ...(search && {
      OR: [{ name: { contains: search } }],
    }),
  };

  const [reports, total] = await Promise.all([
    reportRepository.findReports({
      where,
      skip: paginationParams.skip,
      take: paginationParams.limit,
    }),
    reportRepository.countReports(where),
  ]);

  return {
    data: reports,
    pagination: buildPagination(paginationParams.page, paginationParams.limit, total),
  };
};

const getReportById = async ({ id }) => {
  const report = await reportRepository.findReportById(id);

  if (!report) {
    throw new NotFoundError('Report not found');
  }

  return report;
};

const createReport = ({ name, fileUrl }) =>
  reportRepository.createReport({
    name,
    fileUrl,
  });

const updateReport = async ({ id, name, fileUrl }) => {
  const existingReport = await reportRepository.findReportById(id);

  if (!existingReport) {
    throw new NotFoundError('Report not found');
  }

  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (fileUrl !== undefined) updateData.fileUrl = fileUrl;

  return reportRepository.updateReport(id, updateData);
};

const deleteReport = async ({ id }) => {
  const existingReport = await reportRepository.findReportById(id);

  if (!existingReport) {
    throw new NotFoundError('Report not found');
  }

  await reportRepository.deleteReport(id);
};

module.exports = {
  getReports,
  getReportById,
  createReport,
  updateReport,
  deleteReport,
};
