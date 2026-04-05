/**
 * Report Controller
 * Handles report-related HTTP requests (Admin only)
 */

const reportService = require('../services/reportService');
const { sendSuccess, sendPaginated } = require('../utils/response');

const getReports = async (req, res, next) => {
  try {
    const result = await reportService.getReports(req.query);
    sendPaginated(res, result.data, result.pagination, 'Reports retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getReportById = async (req, res, next) => {
  try {
    const report = await reportService.getReportById({
      id: req.params.id,
    });

    sendSuccess(res, report, 'Report retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const createReport = async (req, res, next) => {
  try {
    const report = await reportService.createReport(req.body);
    sendSuccess(res, report, 'Report created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const updateReport = async (req, res, next) => {
  try {
    const report = await reportService.updateReport({
      id: req.params.id,
      ...req.body,
    });

    sendSuccess(res, report, 'Report updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteReport = async (req, res, next) => {
  try {
    await reportService.deleteReport({
      id: req.params.id,
    });

    sendSuccess(res, null, 'Report deleted successfully', 204);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getReports,
  getReportById,
  createReport,
  updateReport,
  deleteReport,
};
