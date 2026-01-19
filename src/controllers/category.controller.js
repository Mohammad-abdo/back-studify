/**
 * Category Controller
 * Handles category-related HTTP requests (Admin only)
 */

const prisma = require('../config/database');
const { sendSuccess, sendPaginated, getPaginationParams, buildPagination } = require('../utils/response');
const { NotFoundError } = require('../utils/errors');

/**
 * Get book categories
 */
const getBookCategories = async (req, res, next) => {
  try {
    const categories = await prisma.bookCategory.findMany({
      include: {
        _count: {
          select: {
            books: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    sendSuccess(res, categories, 'Book categories retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Create book category (Admin only)
 */
const createBookCategory = async (req, res, next) => {
  try {
    const { name } = req.body;

    const category = await prisma.bookCategory.create({
      data: { name },
    });

    sendSuccess(res, category, 'Book category created successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Update book category (Admin only)
 */
const updateBookCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const existingCategory = await prisma.bookCategory.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      throw new NotFoundError('Book category not found');
    }

    const category = await prisma.bookCategory.update({
      where: { id },
      data: { name },
    });

    sendSuccess(res, category, 'Book category updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete book category (Admin only)
 */
const deleteBookCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingCategory = await prisma.bookCategory.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      throw new NotFoundError('Book category not found');
    }

    await prisma.bookCategory.delete({
      where: { id },
    });

    sendSuccess(res, null, 'Book category deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get product categories
 */
const getProductCategories = async (req, res, next) => {
  try {
    const { collegeId } = req.query;
    const where = {};
    
    if (collegeId) {
      where.collegeId = collegeId;
    }

    const categories = await prisma.productCategory.findMany({
      where,
      include: {
        college: true,
        _count: {
          select: {
            products: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    sendSuccess(res, categories, 'Product categories retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get material categories
 */
const getMaterialCategories = async (req, res, next) => {
  try {
    const { collegeId } = req.query;
    const where = {};
    
    if (collegeId) {
      where.collegeId = collegeId;
    }

    const categories = await prisma.materialCategory.findMany({
      where,
      include: {
        college: true,
        _count: {
          select: {
            materials: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    sendSuccess(res, categories, 'Material categories retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Create product category (Admin only)
 */
const createProductCategory = async (req, res, next) => {
  try {
    const { name } = req.body;

    const category = await prisma.productCategory.create({
      data: { name },
    });

    sendSuccess(res, category, 'Product category created successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Update product category (Admin only)
 */
const updateProductCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const existingCategory = await prisma.productCategory.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      throw new NotFoundError('Product category not found');
    }

    const category = await prisma.productCategory.update({
      where: { id },
      data: { name },
    });

    sendSuccess(res, category, 'Product category updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete product category (Admin only)
 */
const deleteProductCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingCategory = await prisma.productCategory.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      throw new NotFoundError('Product category not found');
    }

    await prisma.productCategory.delete({
      where: { id },
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

