/**
 * Import Log Controller
 * Handles import log-related HTTP requests (Admin only)
 */

const importLogService = require('../services/importLogService');
const { sendSuccess, sendPaginated } = require('../utils/response');

const getImportLogs = async (req, res, next) => {
  try {
    const result = await importLogService.getImportLogs(req.query);
    sendPaginated(res, result.data, result.pagination, 'Import logs retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getImportLogById = async (req, res, next) => {
  try {
    const importLog = await importLogService.getImportLogById({
      id: req.params.id,
    });

    sendSuccess(res, importLog, 'Import log retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const createImportLog = async (req, res, next) => {
  try {
    const importLog = await importLogService.createImportLog(req.body);
    sendSuccess(res, importLog, 'Import log created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const deleteImportLog = async (req, res, next) => {
  try {
    await importLogService.deleteImportLog({
      id: req.params.id,
    });

    sendSuccess(res, null, 'Import log deleted successfully', 204);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getImportLogs,
  getImportLogById,
  createImportLog,
  deleteImportLog,
};
