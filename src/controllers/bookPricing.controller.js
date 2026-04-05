/**
 * Book Pricing Controller
 * Handles book pricing-related HTTP requests
 */

const bookPricingService = require('../services/bookPricingService');
const { sendSuccess, sendPaginated } = require('../utils/response');

const getBookPricings = async (req, res, next) => {
  try {
    const result = await bookPricingService.getBookPricings(req.query);
    sendPaginated(res, result.data, result.pagination, 'Book pricings retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getBookPricingById = async (req, res, next) => {
  try {
    const pricing = await bookPricingService.getBookPricingById({
      id: req.params.id,
    });

    sendSuccess(res, pricing, 'Book pricing retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const createBookPricing = async (req, res, next) => {
  try {
    const pricing = await bookPricingService.createBookPricing(req.body);
    sendSuccess(res, pricing, 'Book pricing created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const updateBookPricing = async (req, res, next) => {
  try {
    const pricing = await bookPricingService.updateBookPricing({
      id: req.params.id,
      ...req.body,
    });

    sendSuccess(res, pricing, 'Book pricing updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteBookPricing = async (req, res, next) => {
  try {
    await bookPricingService.deleteBookPricing({
      id: req.params.id,
    });

    sendSuccess(res, null, 'Book pricing deleted successfully', 204);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBookPricings,
  getBookPricingById,
  createBookPricing,
  updateBookPricing,
  deleteBookPricing,
};
