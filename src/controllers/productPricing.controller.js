/**
 * Product Pricing Controller
 * Handles product pricing-related HTTP requests
 */

const productPricingService = require('../services/productPricingService');
const { sendSuccess, sendPaginated } = require('../utils/response');

const getProductPricings = async (req, res, next) => {
  try {
    const result = await productPricingService.getProductPricings(req.query);
    sendPaginated(res, result.data, result.pagination, 'Product pricings retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getProductPricingById = async (req, res, next) => {
  try {
    const pricing = await productPricingService.getProductPricingById({
      id: req.params.id,
    });

    sendSuccess(res, pricing, 'Product pricing retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const createProductPricing = async (req, res, next) => {
  try {
    const pricing = await productPricingService.createProductPricing(req.body);
    sendSuccess(res, pricing, 'Product pricing created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const updateProductPricing = async (req, res, next) => {
  try {
    const pricing = await productPricingService.updateProductPricing({
      id: req.params.id,
      ...req.body,
    });

    sendSuccess(res, pricing, 'Product pricing updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteProductPricing = async (req, res, next) => {
  try {
    await productPricingService.deleteProductPricing({
      id: req.params.id,
    });

    sendSuccess(res, null, 'Product pricing deleted successfully', 204);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProductPricings,
  getProductPricingById,
  createProductPricing,
  updateProductPricing,
  deleteProductPricing,
};
