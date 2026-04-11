/**
 * Shared wholesale order creation (institute catalogue).
 * Used by POST /api/wholesale-orders and POST /api/orders (institute + PRODUCT-only cart).
 */

const prisma = require('../config/database');
const { ORDER_STATUS } = require('../utils/constants');
const { AuthorizationError, ValidationError } = require('../utils/errors');
const { validateInstituteProducts, calculateInstitutePriceFromTiers } = require('./institute.service');

/**
 * @param {string} userId
 * @param {{ productId: string, quantity: number, price?: number }[]} items
 * @param {string|undefined|null} address
 */
async function createWholesaleOrderCore(userId, items, address) {
  const customer = await prisma.customer.findUnique({
    where: { userId },
  });

  if (!customer) {
    throw new AuthorizationError(
      'No customer profile found. Wholesale orders require a customer profile (institute accounts should have one linked).'
    );
  }

  const productIds = items.map((i) => i.productId);
  const { valid, invalidIds } = await validateInstituteProducts(productIds);
  if (!valid) {
    throw new ValidationError(
      `The following products are not institute products or do not exist: ${invalidIds.join(', ')}`
    );
  }

  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    include: { pricing: { orderBy: { minQuantity: 'asc' } } },
  });
  const productMap = new Map(products.map((p) => [p.id, p]));

  const resolvedItems = items.map((item) => {
    const product = productMap.get(item.productId);

    if (item.price != null && item.price > 0) {
      return {
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
      };
    }

    if (product.pricing && product.pricing.length > 0) {
      const calc = calculateInstitutePriceFromTiers(item.quantity, product.pricing);
      if (calc) {
        return {
          productId: item.productId,
          quantity: item.quantity,
          price: calc.unitPrice,
        };
      }
    }

    if (product.basePrice != null) {
      return {
        productId: item.productId,
        quantity: item.quantity,
        price: product.basePrice,
      };
    }

    throw new ValidationError(
      `No pricing available for product "${product.name}" (${product.id}). Add pricing tiers or a base price.`
    );
  });

  const total = resolvedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return prisma.wholesaleOrder.create({
    data: {
      customerId: customer.id,
      total,
      status: ORDER_STATUS.CREATED,
      address,
      items: {
        create: resolvedItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        })),
      },
    },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });
}

module.exports = {
  createWholesaleOrderCore,
};
