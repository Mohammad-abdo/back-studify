/**
 * Print Center Controller
 * Handles print center-related HTTP requests
 */

const printCenterService = require('../services/printCenterService');
const { sendSuccess, sendPaginated } = require('../utils/response');

const getPrintCenters = async (req, res, next) => {
  try {
    const result = await printCenterService.getPrintCenters(req.query);
    sendPaginated(res, result.data, result.pagination, 'Print centers retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const createPrintCenter = async (req, res, next) => {
  try {
    const center = await printCenterService.createPrintCenter(req.body);
    sendSuccess(res, center, 'Print center created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const getPrintCenterById = async (req, res, next) => {
  try {
    const center = await printCenterService.getPrintCenterById({
      id: req.params.id,
    });

    sendSuccess(res, center, 'Print center retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const updatePrintCenter = async (req, res, next) => {
  try {
    const center = await printCenterService.updatePrintCenter({
      id: req.params.id,
      ...req.body,
    });

    sendSuccess(res, center, 'Print center updated successfully');
  } catch (error) {
    next(error);
  }
};

const deletePrintCenter = async (req, res, next) => {
  try {
    await printCenterService.deletePrintCenter({
      id: req.params.id,
    });

    sendSuccess(res, null, 'Print center deleted successfully', 204);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPrintCenters,
  getPrintCenterById,
  createPrintCenter,
  updatePrintCenter,
  deletePrintCenter,
};
