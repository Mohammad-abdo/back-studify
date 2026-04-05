/**
 * Print Option Controller
 * Handles print option-related HTTP requests
 */

const printOptionService = require('../services/printOptionService');
const { sendSuccess, sendPaginated } = require('../utils/response');

const getPrintOptions = async (req, res, next) => {
  try {
    const result = await printOptionService.getPrintOptions(req.query);
    sendPaginated(res, result.data, result.pagination, 'Print options retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getPrintOptionsByContentId = async (req, res, next) => {
  try {
    const result = await printOptionService.getPrintOptionsByContentId({
      id: req.params.id,
      ...req.query,
    });

    sendPaginated(res, result.data, result.pagination, 'Print options retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getPrintOptionById = async (req, res, next) => {
  try {
    const printOption = await printOptionService.getPrintOptionById({
      id: req.params.id,
    });

    sendSuccess(res, printOption, 'Print option retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const createPrintOption = async (req, res, next) => {
  try {
    const printOption = await printOptionService.createPrintOption(req.body);
    sendSuccess(res, printOption, 'Print option created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const createPrintOptionWithUpload = async (req, res, next) => {
  try {
    const printOption = await printOptionService.createPrintOptionWithUpload({
      file: req.file,
      ...req.body,
    });

    sendSuccess(res, printOption, 'Print option created successfully with uploaded file', 201);
  } catch (error) {
    next(error);
  }
};

const updatePrintOption = async (req, res, next) => {
  try {
    const printOption = await printOptionService.updatePrintOption({
      id: req.params.id,
      ...req.body,
    });

    sendSuccess(res, printOption, 'Print option updated successfully');
  } catch (error) {
    next(error);
  }
};

const deletePrintOption = async (req, res, next) => {
  try {
    await printOptionService.deletePrintOption({
      id: req.params.id,
    });

    sendSuccess(res, null, 'Print option deleted successfully', 204);
  } catch (error) {
    next(error);
  }
};

const getPrintQuote = async (req, res, next) => {
  try {
    const quote = await printOptionService.getPrintQuote({
      id: req.params.id,
    });

    sendSuccess(res, quote, 'Print quote calculated successfully');
  } catch (error) {
    next(error);
  }
};

const createPrintOrder = async (req, res, next) => {
  try {
    const order = await printOptionService.createPrintOrder({
      id: req.params.id,
      userId: req.userId,
      address: req.body?.address,
    });

    sendSuccess(res, order, 'Print order created successfully', 201);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPrintOptions,
  getPrintOptionsByContentId,
  getPrintOptionById,
  createPrintOption,
  createPrintOptionWithUpload,
  updatePrintOption,
  deletePrintOption,
  getPrintQuote,
  createPrintOrder,
};
