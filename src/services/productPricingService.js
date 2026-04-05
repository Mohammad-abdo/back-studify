const productPricingRepository = require('../repositories/productPricingRepository');
const productRepository = require('../repositories/productRepository');
const { buildPagination, getPaginationParams } = require('../utils/response');
const { NotFoundError } = require('../utils/errors');

const getProductPricings = async ({ page, limit, productId }) => {
  const paginationParams = getPaginationParams(page, limit);
  const where = {
    ...(productId && { productId }),
  };

  const [pricings, total] = await Promise.all([
    productPricingRepository.findProductPricings({
      where,
      skip: paginationParams.skip,
      take: paginationParams.limit,
    }),
    productPricingRepository.countProductPricings(where),
  ]);

  return {
    data: pricings,
    pagination: buildPagination(paginationParams.page, paginationParams.limit, total),
  };
};

const getProductPricingById = async ({ id }) => {
  const pricing = await productPricingRepository.findProductPricingById(id);

  if (!pricing) {
    throw new NotFoundError('Product pricing not found');
  }

  return pricing;
};

const createProductPricing = async ({ productId, minQuantity, price }) => {
  const product = await productRepository.findProductBasicById(productId);

  if (!product) {
    throw new NotFoundError('Product not found');
  }

  return productPricingRepository.createProductPricing({
    productId,
    minQuantity,
    price,
  });
};

const updateProductPricing = async ({ id, minQuantity, price }) => {
  const existingPricing = await productPricingRepository.findProductPricingBasicById(id);

  if (!existingPricing) {
    throw new NotFoundError('Product pricing not found');
  }

  const updateData = {};
  if (minQuantity !== undefined) updateData.minQuantity = minQuantity;
  if (price !== undefined) updateData.price = price;

  return productPricingRepository.updateProductPricing(id, updateData);
};

const deleteProductPricing = async ({ id }) => {
  const existingPricing = await productPricingRepository.findProductPricingBasicById(id);

  if (!existingPricing) {
    throw new NotFoundError('Product pricing not found');
  }

  await productPricingRepository.deleteProductPricing(id);
};

module.exports = {
  getProductPricings,
  getProductPricingById,
  createProductPricing,
  updateProductPricing,
  deleteProductPricing,
};
