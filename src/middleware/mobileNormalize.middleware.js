/**
 * Mobile Response Normalizer Middleware
 *
 * Transforms backend response shapes into mobile-friendly flat structures:
 *   - Flattens Prisma `_count` → `{key}Count` (e.g. _count.products → productsCount)
 *   - Ensures `imageUrls` is always an array (never null / string)
 *   - Adds `imageUrl` (singular, first image) convenience field
 *   - Adds top-level `price` on products (first pricing tier)
 */

function normalizeObject(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return obj;
  if (Array.isArray(obj)) return obj.map(normalizeObject);

  const out = {};

  for (const [key, value] of Object.entries(obj)) {
    if (key === '_count' && value && typeof value === 'object' && !Array.isArray(value)) {
      for (const [countKey, countVal] of Object.entries(value)) {
        out[`${countKey}Count`] = typeof countVal === 'number' ? countVal : 0;
      }
      continue;
    }
    out[key] = normalizeObject(value);
  }

  if ('imageUrls' in out) {
    if (!Array.isArray(out.imageUrls)) {
      out.imageUrls = out.imageUrls ? [out.imageUrls] : [];
    }
    if (!out.imageUrl) {
      out.imageUrl = out.imageUrls[0] || null;
    }
  }

  if (Array.isArray(out.pricing) && out.pricing.length > 0 && out.price === undefined) {
    const cheapest = out.pricing.reduce(
      (min, t) => (t.price < min.price ? t : min),
      out.pricing[0],
    );
    out.price = cheapest.price;
  }

  return out;
}

const mobileNormalizeMiddleware = (_req, res, next) => {
  const originalJson = res.json.bind(res);

  res.json = function (body) {
    if (body && typeof body === 'object') {
      if (body.data !== undefined) {
        body = { ...body, data: normalizeObject(body.data) };
      }
    }
    return originalJson(body);
  };

  next();
};

module.exports = { mobileNormalizeMiddleware };
