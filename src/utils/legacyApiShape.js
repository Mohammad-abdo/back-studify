/**
 * Strips schema fields added after initial API contract so existing JSON shapes stay stable.
 */

function omitKeys(obj, keys) {
  if (!obj || typeof obj !== 'object') return obj;
  const out = { ...obj };
  for (const k of keys) delete out[k];
  return out;
}

const PRODUCT_SCALAR_EXTRAS = ['isInstituteProduct', 'basePrice', 'pricingStrategy', 'updatedAt'];
const PRODUCT_PRICING_EXTRAS = ['maxQuantity', 'fixedPrice', 'discountPercent'];
const PRODUCT_CATEGORY_EXTRAS = ['isInstituteCategory'];

function sanitizeProductCategory(category) {
  if (!category) return category;
  return omitKeys(category, PRODUCT_CATEGORY_EXTRAS);
}

function sanitizeProductPricing(pricing) {
  if (!pricing) return pricing;
  return omitKeys(pricing, PRODUCT_PRICING_EXTRAS);
}

/**
 * Product + nested category + pricing[] as returned to clients (list/detail/create/update).
 */
function sanitizeProduct(product) {
  if (!product) return product;
  let p = omitKeys(product, PRODUCT_SCALAR_EXTRAS);
  if (p.category) p = { ...p, category: sanitizeProductCategory(p.category) };
  if (Array.isArray(p.pricing)) {
    p = { ...p, pricing: p.pricing.map(sanitizeProductPricing) };
  }
  return p;
}

function sanitizeUserScalars(user) {
  if (!user || typeof user !== 'object') return user;
  return omitKeys(user, ['updatedAt']);
}

/** Wholesale / order payloads with items[].product */
function sanitizeOrderItemsWithProducts(order) {
  if (!order || !Array.isArray(order.items)) return order;
  return {
    ...order,
    items: order.items.map((item) => ({
      ...item,
      product: item.product ? sanitizeProduct(item.product) : item.product,
    })),
  };
}

function sanitizeCustomerWholesaleOrders(customer) {
  if (!customer?.wholesaleOrders) return customer;
  return {
    ...customer,
    wholesaleOrders: customer.wholesaleOrders.map(sanitizeOrderItemsWithProducts),
  };
}

module.exports = {
  sanitizeProduct,
  sanitizeProductCategory,
  sanitizeProductPricing,
  sanitizeUserScalars,
  sanitizeOrderItemsWithProducts,
  sanitizeCustomerWholesaleOrders,
};
