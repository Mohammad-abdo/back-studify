/**
 * Product Controller
 * Handles product-related HTTP requests
 */

const productService = require('../services/productService');
const { sendSuccess, sendPaginated } = require('../utils/response');

const getProducts = async (req, res, next) => {
  try {
    const result = await productService.getProducts(req.query);
    sendPaginated(res, result.data, result.pagination, 'Products retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getProductById = async (req, res, next) => {
  try {
    const product = await productService.getProductById({
      id: req.params.id,
    });

    sendSuccess(res, product, 'Product retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const createProduct = async (req, res, next) => {
  try {
    const product = await productService.createProduct(req.body);
    sendSuccess(res, product, 'Product created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const product = await productService.updateProduct({
      id: req.params.id,
      ...req.body,
    });

    sendSuccess(res, product, 'Product updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    await productService.deleteProduct({
      id: req.params.id,
    });

    sendSuccess(res, null, 'Product deleted successfully');
  } catch (error) {
    next(error);
  }
};

const addProductPricing = async (req, res, next) => {
  try {
    const pricing = await productService.addProductPricing(req.body);
    sendSuccess(res, pricing, 'Pricing added successfully', 201);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  addProductPricing,
};
