/**
 * Category Controller
 * Handles category-related HTTP requests (Admin only)
 */

const prisma = require('../config/database');
const { sanitizeProductCategory } = require('../utils/legacyApiShape');
const { sendSuccess, sendPaginated, getPaginationParams, buildPagination } = require('../utils/response');
const { NotFoundError } = require('../utils/errors');
const { getInstituteCategoryFilter } = require('../middleware/institute.middleware');
const { USER_TYPES } = require('../utils/constants');
const { isDirectChildCategoryName } = require('../utils/productCategoryQuery');

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
 * Applies institute/retail separation based on user type.
 */
const getProductCategories = async (req, res, next) => {
  try {
    const { collegeId } = req.query;
    const userType = req.user?.type;

    let instituteFilter = getInstituteCategoryFilter(userType);
    if (userType === USER_TYPES.ADMIN && req.query.isInstituteCategory !== undefined) {
      instituteFilter = req.query.isInstituteCategory === 'true';
    } else if (
      userType !== USER_TYPES.INSTITUTE &&
      userType !== USER_TYPES.ADMIN &&
      req.query.isInstituteCategory !== undefined
    ) {
      instituteFilter = req.query.isInstituteCategory === 'true';
    }

    const where = {
      ...(instituteFilter !== undefined && { isInstituteCategory: instituteFilter }),
      ...(collegeId && { collegeId }),
    };

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

    // Hierarchy via names "Main / Sub" only (no schema parentId). Scoped per isInstituteCategory.
    const withBranchCounts = categories.map((c) => {
      const children = categories
        .filter(
          (o) =>
            o.id !== c.id &&
            o.isInstituteCategory === c.isInstituteCategory &&
            isDirectChildCategoryName(c.name, o.name)
        )
        .sort((a, b) => a.name.localeCompare(b.name, 'ar'))
        .map((ch) => ({
          id: ch.id,
          name: ch.name,
          isInstituteCategory: ch.isInstituteCategory,
          collegeId: ch.collegeId,
          createdAt: ch.createdAt,
          _count: ch._count,
        }));

      const direct = c._count?.products ?? 0;
      const inChildren = children.reduce((sum, ch) => sum + (ch._count?.products ?? 0), 0);

      return {
        ...c,
        children,
        productCount: direct + inChildren,
      };
    });

    const exposeInstitute = userType === USER_TYPES.ADMIN || userType === USER_TYPES.INSTITUTE;
    sendSuccess(
      res,
      exposeInstitute ? withBranchCounts : withBranchCounts.map(sanitizeProductCategory),
      'Product categories retrieved successfully'
    );
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
 * Supports isInstituteCategory and collegeId.
 */
const createProductCategory = async (req, res, next) => {
  try {
    const { name, isInstituteCategory = false, collegeId } = req.body;

    const category = await prisma.productCategory.create({
      data: {
        name,
        isInstituteCategory: !!isInstituteCategory,
        ...(collegeId && { collegeId }),
      },
      include: { college: true },
    });

    sendSuccess(res, category, 'Product category created successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Update product category (Admin only)
 * Supports isInstituteCategory and collegeId.
 */
const updateProductCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, isInstituteCategory, collegeId } = req.body;

    const existingCategory = await prisma.productCategory.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      throw new NotFoundError('Product category not found');
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (isInstituteCategory !== undefined) updateData.isInstituteCategory = !!isInstituteCategory;
    if (collegeId !== undefined) updateData.collegeId = collegeId;

    const category = await prisma.productCategory.update({
      where: { id },
      data: updateData,
      include: { college: true },
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

