/**
 * Material Controller
 * Handles material-related HTTP requests
 */

const materialService = require('../services/materialService');
const { sendSuccess, sendPaginated } = require('../utils/response');

const getMaterials = async (req, res, next) => {
  try {
    const result = await materialService.getMaterials(req.query);
    sendPaginated(res, result.data, result.pagination, 'Materials retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getMaterialById = async (req, res, next) => {
  try {
    const material = await materialService.getMaterialById({
      id: req.params.id,
    });

    sendSuccess(res, material, 'Material retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const createMaterial = async (req, res, next) => {
  try {
    const material = await materialService.createMaterial({
      user: req.user,
      ...req.body,
    });

    sendSuccess(res, material, 'Material created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const updateMaterial = async (req, res, next) => {
  try {
    const material = await materialService.updateMaterial({
      id: req.params.id,
      user: req.user,
      ...req.body,
    });

    sendSuccess(res, material, 'Material updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteMaterial = async (req, res, next) => {
  try {
    await materialService.deleteMaterial({
      id: req.params.id,
      user: req.user,
    });

    sendSuccess(res, null, 'Material deleted successfully');
  } catch (error) {
    next(error);
  }
};

const addMaterialPricing = async (req, res, next) => {
  try {
    const pricing = await materialService.addMaterialPricing({
      user: req.user,
      ...req.body,
    });

    sendSuccess(res, pricing, 'Pricing added successfully', 201);
  } catch (error) {
    next(error);
  }
};

const incrementDownloads = async (req, res, next) => {
  try {
    const downloads = await materialService.incrementDownloads({
      id: req.params.id,
    });

    sendSuccess(res, downloads, 'Downloads incremented successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMaterials,
  getMaterialById,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  addMaterialPricing,
  incrementDownloads,
};
