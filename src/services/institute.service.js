/**
 * Institute Service
 * Pricing calculation and validation utilities for institute (wholesale) products.
 */

const prisma = require('../config/database');

/**
 * Calculate the unit price for an institute product based on quantity
 * using ProductPricing tiers.
 *
 * Tier matching:
 *  1. Find tier where minQuantity <= quantity <= maxQuantity
 *  2. If no exact match, use the highest tier where quantity >= minQuantity
 *  3. If fixedPrice is set on the tier, return fixedPrice as total (not per-unit)
 *  4. If discountPercent is set, apply discount to tier price
 *
 * @param {number} quantity - ordered quantity
 * @param {Array} pricingTiers - ProductPricing[] (already fetched)
 * @returns {{ unitPrice: number, totalPrice: number, tierId: string } | null}
 */
const calculateInstitutePriceFromTiers = (quantity, pricingTiers) => {
  if (!pricingTiers || pricingTiers.length === 0) return null;

  const sorted = [...pricingTiers].sort((a, b) => a.minQuantity - b.minQuantity);

  let matched = null;

  for (const tier of sorted) {
    if (quantity >= tier.minQuantity && (tier.maxQuantity == null || quantity <= tier.maxQuantity)) {
      matched = tier;
      break;
    }
  }

  if (!matched) {
    for (let i = sorted.length - 1; i >= 0; i--) {
      if (quantity >= sorted[i].minQuantity) {
        matched = sorted[i];
        break;
      }
    }
  }

  if (!matched) {
    matched = sorted[0];
  }

  if (matched.fixedPrice != null) {
    return {
      unitPrice: matched.fixedPrice / quantity,
      totalPrice: matched.fixedPrice,
      tierId: matched.id,
    };
  }

  let unitPrice = matched.price;
  if (matched.discountPercent != null && matched.discountPercent > 0) {
    unitPrice = unitPrice * (1 - matched.discountPercent / 100);
  }

  return {
    unitPrice,
    totalPrice: unitPrice * quantity,
    tierId: matched.id,
  };
};

/**
 * Fetch product with pricing tiers and compute the price for a given quantity.
 *
 * @param {string} productId
 * @param {number} quantity
 * @returns {Promise<{ product, pricing }>}
 */
const getInstitutePriceForProduct = async (productId, quantity) => {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      pricing: { orderBy: { minQuantity: 'asc' } },
      category: true,
    },
  });

  if (!product) return null;
  if (!product.isInstituteProduct) return null;

  const pricing = calculateInstitutePriceFromTiers(quantity, product.pricing);

  return { product, pricing };
};

/**
 * Validate that ALL provided product IDs are institute products.
 *
 * @param {string[]} productIds
 * @returns {Promise<{ valid: boolean, invalidIds: string[] }>}
 */
const validateInstituteProducts = async (productIds) => {
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, isInstituteProduct: true },
  });

  const foundIds = new Set(products.map((p) => p.id));
  const invalidIds = [];

  for (const id of productIds) {
    if (!foundIds.has(id)) {
      invalidIds.push(id);
      continue;
    }
    const prod = products.find((p) => p.id === id);
    if (!prod.isInstituteProduct) {
      invalidIds.push(id);
    }
  }

  return { valid: invalidIds.length === 0, invalidIds };
};

/**
 * Validate that a product has pricing tiers (required for institute products).
 *
 * @param {string} productId
 * @returns {Promise<boolean>}
 */
const hasRequiredPricingTiers = async (productId) => {
  const count = await prisma.productPricing.count({ where: { productId } });
  return count > 0;
};

module.exports = {
  calculateInstitutePriceFromTiers,
  getInstitutePriceForProduct,
  validateInstituteProducts,
  hasRequiredPricingTiers,
};
