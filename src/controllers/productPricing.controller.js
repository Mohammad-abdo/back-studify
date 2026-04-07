/**
 * Product Pricing Controller
 * Handles product pricing-related HTTP requests
 */

const prisma = require('../config/database');
const { sendSuccess, sendPaginated, getPaginationParams, buildPagination } = require('../utils/response');
const { NotFoundError } = require('../utils/errors');
const { sanitizeProduct, sanitizeProductPricing } = require('../utils/legacyApiShape');

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
    const shaped = pricings.map((row) => ({
      ...sanitizeProductPricing(row),
      product: row.product,
    }));
    sendPaginated(res, shaped, pagination, 'Product pricings retrieved successfully');
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

    sendSuccess(
      res,
      {
        ...sanitizeProductPricing(pricing),
        product: pricing.product ? sanitizeProduct(pricing.product) : pricing.product,
      },
      'Product pricing retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Create product pricing tier
 * Supports maxQuantity, fixedPrice, discountPercent for institute tier pricing.
 */
const createProductPricing = async (req, res, next) => {
  try {
    const { productId, minQuantity, maxQuantity, price, fixedPrice, discountPercent } = req.body;

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
        maxQuantity: maxQuantity ?? null,
        price,
        fixedPrice: fixedPrice ?? null,
        discountPercent: discountPercent ?? null,
      },
      include: {
        product: true,
      },
    });

    sendSuccess(
      res,
      { ...pricing, product: pricing.product },
      'Product pricing created successfully',
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Update product pricing tier
 * Supports maxQuantity, fixedPrice, discountPercent.
 */
const updateProductPricing = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { minQuantity, maxQuantity, price, fixedPrice, discountPercent } = req.body;

    const existingPricing = await prisma.productPricing.findUnique({
      where: { id },
    });

    if (!existingPricing) {
      throw new NotFoundError('Product pricing not found');
    }

    const updateData = {};
    if (minQuantity !== undefined) updateData.minQuantity = minQuantity;
    if (maxQuantity !== undefined) updateData.maxQuantity = maxQuantity;
    if (price !== undefined) updateData.price = price;
    if (fixedPrice !== undefined) updateData.fixedPrice = fixedPrice;
    if (discountPercent !== undefined) updateData.discountPercent = discountPercent;

    const pricing = await prisma.productPricing.update({
      where: { id },
      data: updateData,
      include: {
        product: true,
      },
    });

    sendSuccess(
      res,
      { ...pricing, product: pricing.product },
      'Product pricing updated successfully'
    );
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


