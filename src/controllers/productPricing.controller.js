/**
 * Product Pricing Controller
 * Handles product pricing-related HTTP requests
 */

const prisma = require('../config/database');
const { sendSuccess, sendPaginated, getPaginationParams, buildPagination } = require('../utils/response');
const { NotFoundError } = require('../utils/errors');

/**
 * Get all product pricings
 */
const getProductPricings = async (req, res, next) => {
  try {
    const { page, limit } = getPaginationParams(req.query.page, req.query.limit);
    const { productId } = req.query;

    const where = {
      ...(productId && { productId }),
    };

    const [pricings, total] = await Promise.all([
      prisma.productPricing.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          product: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: [
          { productId: 'asc' },
          { minQuantity: 'asc' },
        ],
      }),
      prisma.productPricing.count({ where }),
    ]);

    const pagination = buildPagination(page, limit, total);
    sendPaginated(res, pricings, pagination, 'Product pricings retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get product pricing by ID
 */
const getProductPricingById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const pricing = await prisma.productPricing.findUnique({
      where: { id },
      include: {
        product: true,
      },
    });

    if (!pricing) {
      throw new NotFoundError('Product pricing not found');
    }

    sendSuccess(res, pricing, 'Product pricing retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Create product pricing
 */
const createProductPricing = async (req, res, next) => {
  try {
    const { productId, minQuantity, price } = req.body;

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    const pricing = await prisma.productPricing.create({
      data: {
        productId,
        minQuantity,
        price,
      },
      include: {
        product: true,
      },
    });

    sendSuccess(res, pricing, 'Product pricing created successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Update product pricing
 */
const updateProductPricing = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { minQuantity, price } = req.body;

    const existingPricing = await prisma.productPricing.findUnique({
      where: { id },
    });

    if (!existingPricing) {
      throw new NotFoundError('Product pricing not found');
    }

    const updateData = {};
    if (minQuantity !== undefined) updateData.minQuantity = minQuantity;
    if (price !== undefined) updateData.price = price;

    const pricing = await prisma.productPricing.update({
      where: { id },
      data: updateData,
      include: {
        product: true,
      },
    });

    sendSuccess(res, pricing, 'Product pricing updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete product pricing
 */
const deleteProductPricing = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingPricing = await prisma.productPricing.findUnique({
      where: { id },
    });

    if (!existingPricing) {
      throw new NotFoundError('Product pricing not found');
    }

    await prisma.productPricing.delete({
      where: { id },
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


