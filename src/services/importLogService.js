const importLogRepository = require('../repositories/importLogRepository');
const { buildPagination, getPaginationParams } = require('../utils/response');
const { NotFoundError } = require('../utils/errors');

const getImportLogs = async ({ page, limit, type, startDate, endDate }) => {
  const paginationParams = getPaginationParams(page, limit);
  const where = {
    ...(type && { type }),
    ...(startDate || endDate
      ? {
          createdAt: {
            ...(startDate && { gte: new Date(startDate) }),
            ...(endDate && { lte: new Date(endDate) }),
          },
        }
      : {}),
  };

  const [importLogs, total] = await Promise.all([
    importLogRepository.findImportLogs({
      where,
      skip: paginationParams.skip,
      take: paginationParams.limit,
    }),
    importLogRepository.countImportLogs(where),
  ]);

  return {
    data: importLogs,
    pagination: buildPagination(paginationParams.page, paginationParams.limit, total),
  };
};

const getImportLogById = async ({ id }) => {
  const importLog = await importLogRepository.findImportLogById(id);

  if (!importLog) {
    throw new NotFoundError('Import log not found');
  }

  return importLog;
};

const createImportLog = ({ type, fileUrl, success, failed }) =>
  importLogRepository.createImportLog({
    type,
    fileUrl,
    success: success || 0,
    failed: failed || 0,
  });

const deleteImportLog = async ({ id }) => {
  const existingImportLog = await importLogRepository.findImportLogById(id);

  if (!existingImportLog) {
    throw new NotFoundError('Import log not found');
  }

  await importLogRepository.deleteImportLog(id);
};

module.exports = {
  getImportLogs,
  getImportLogById,
  createImportLog,
  deleteImportLog,
};
