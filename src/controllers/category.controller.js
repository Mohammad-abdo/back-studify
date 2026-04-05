/**
 * Category Controller
 * Handles category-related HTTP requests (Admin only)
 */

const categoryService = require('../services/categoryService');
const { sendSuccess } = require('../utils/response');

const getBookCategories = async (req, res, next) => {
  try {
    const categories = await categoryService.getBookCategories();
    sendSuccess(res, categories, 'Book categories retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const createBookCategory = async (req, res, next) => {
  try {
    const category = await categoryService.createBookCategory(req.body);
    sendSuccess(res, category, 'Book category created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const updateBookCategory = async (req, res, next) => {
  try {
    const category = await categoryService.updateBookCategory({
      id: req.params.id,
      name: req.body.name,
    });

    sendSuccess(res, category, 'Book category updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteBookCategory = async (req, res, next) => {
  try {
    await categoryService.deleteBookCategory({
      id: req.params.id,
    });

    sendSuccess(res, null, 'Book category deleted successfully');
  } catch (error) {
    next(error);
  }
};

const getProductCategories = async (req, res, next) => {
  try {
    const categories = await categoryService.getProductCategories({
      collegeId: req.query.collegeId,
    });

    sendSuccess(res, categories, 'Product categories retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getMaterialCategories = async (req, res, next) => {
  try {
    const categories = await categoryService.getMaterialCategories({
      collegeId: req.query.collegeId,
    });

    sendSuccess(res, categories, 'Material categories retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const createProductCategory = async (req, res, next) => {
  try {
    const category = await categoryService.createProductCategory(req.body);
    sendSuccess(res, category, 'Product category created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const updateProductCategory = async (req, res, next) => {
  try {
    const category = await categoryService.updateProductCategory({
      id: req.params.id,
      name: req.body.name,
    });

    sendSuccess(res, category, 'Product category updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteProductCategory = async (req, res, next) => {
  try {
    await categoryService.deleteProductCategory({
      id: req.params.id,
    });

    sendSuccess(res, null, 'Product category deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBookCategories,
  createBookCategory,
  updateBookCategory,
  deleteBookCategory,
  getProductCategories,
  createProductCategory,
  updateProductCategory,
  deleteProductCategory,
  getMaterialCategories,
};
