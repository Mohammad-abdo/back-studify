/**
 * Product Controller
 * Handles product-related HTTP requests
 */

const prisma = require('../config/database');
const { sendSuccess, sendPaginated, getPaginationParams, buildPagination } = require('../utils/response');
const { NotFoundError, AuthorizationError, ValidationError } = require('../utils/errors');
const { sanitizeProduct, sanitizeProductPricing } = require('../utils/legacyApiShape');
const { getInstituteProductFilter } = require('../middleware/institute.middleware');
const { getCategoryIdsIncludingDescendants } = require('../utils/productCategoryQuery');
const { USER_TYPES } = require('../utils/constants');
const { createObjectCsvStringifier } = require('csv-writer');
const {
  toBool,
  toNumberOrNull,
  toIntOrNull,
  toJsonArrayStringOrNull,
  parseCsvBuffer,
} = require('../utils/productCsv');

const parseProductImages = (product) => {
  let parsedImageUrls = [];
  if (product.imageUrls) {
    try {
      parsedImageUrls = typeof product.imageUrls === 'string'
        ? JSON.parse(product.imageUrls)
        : product.imageUrls;
      if (!Array.isArray(parsedImageUrls)) parsedImageUrls = [];
    } catch {
      parsedImageUrls = [];
    }
  }
  return { ...product, imageUrls: parsedImageUrls };
};

const shouldExposeInstituteFields = (userType) =>
  userType === USER_TYPES.ADMIN || userType === USER_TYPES.INSTITUTE;

/**
 * Get all products (with filters)
 * Applies institute/retail separation based on user type.
 */
const getProducts = async (req, res, next) => {
  try {
    const { page, limit } = getPaginationParams(req.query.page, req.query.limit);
    const { categoryId, collegeId } = req.query;
    const search =
      typeof req.query.search === 'string' && req.query.search.trim() !== ''
        ? req.query.search.trim()
        : undefined;

    // INSTITUTE → only isInstituteProduct true (see getInstituteProductFilter). Use userType from auth / optionalAuthenticate.
    const userType = req.user?.type ?? req.userType;

    // Admin: optional explicit filter. INSTITUTE: always wholesale catalogue only.
    // Everyone else (incl. guest): type-based default, unless `isInstituteProduct` is set explicitly (Postman / public catalogue).
    let instituteFilter = getInstituteProductFilter(userType);
    if (userType === USER_TYPES.ADMIN && req.query.isInstituteProduct !== undefined) {
      instituteFilter = req.query.isInstituteProduct === 'true';
    } else if (
      userType !== USER_TYPES.INSTITUTE &&
      userType !== USER_TYPES.ADMIN &&
      req.query.isInstituteProduct !== undefined
    ) {
      instituteFilter = req.query.isInstituteProduct === 'true';
    }

    let categoryIdIn = undefined;
    if (categoryId) {
      const root = await prisma.productCategory.findUnique({
        where: { id: categoryId },
        select: { id: true },
      });
      if (!root) {
        throw new NotFoundError('Category not found');
      }
      const branchIds = await getCategoryIdsIncludingDescendants(prisma, categoryId);
      categoryIdIn = { in: branchIds };
    }

    const where = {
      ...(instituteFilter !== undefined && { isInstituteProduct: instituteFilter }),
      ...(categoryIdIn && { categoryId: categoryIdIn }),
      ...(collegeId && {
        category: {
          collegeId: collegeId,
        },
      }),
      ...(search && {
        OR: [
          { name: { contains: search } },
          { description: { contains: search } },
        ],
      }),
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          category: {
            include: {
              college: true,
            },
          },
          pricing: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);

    const exposeInstitute = shouldExposeInstituteFields(userType);

    const productsWithParsedImages = products.map(product => {
      const parsed = parseProductImages(product);
      return exposeInstitute ? parsed : sanitizeProduct(parsed);
    });

    const pagination = buildPagination(page, limit, total);

    sendPaginated(res, productsWithParsedImages, pagination, 'Products retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get product by ID
 * Access is enforced by checkProductAccess middleware on the route layer.
 */
const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userType = req.user?.type ?? req.userType;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        pricing: {
          orderBy: { minQuantity: 'asc' },
        },
      },
    });

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    // Runtime access guard (belt-and-suspenders alongside middleware)
    if (userType !== USER_TYPES.ADMIN) {
      if (product.isInstituteProduct && userType !== USER_TYPES.INSTITUTE) {
        throw new AuthorizationError(
          'This product is part of the government/wholesale catalogue. Sign in with an institute account.'
        );
      }
      if (!product.isInstituteProduct && userType === USER_TYPES.INSTITUTE) {
        throw new AuthorizationError(
          'Institute accounts only use the wholesale catalogue. Open a retail-category product while signed in as a retail customer.'
        );
      }
    }

    const parsed = parseProductImages(product);
    const exposeInstitute = shouldExposeInstituteFields(userType);
    const parsedProduct = exposeInstitute ? parsed : sanitizeProduct(parsed);

    const reviews = await prisma.review.findMany({
      where: {
        targetId: id,
        targetType: 'PRODUCT',
      },
      include: {
        user: {
          select: {
            id: true,
            phone: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    sendSuccess(res, { ...parsedProduct, reviews }, 'Product retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Create product (Admin only)
 * Supports isInstituteProduct, basePrice, pricingStrategy.
 * When isInstituteProduct is true, pricing tiers can be supplied inline.
 */
const createProduct = async (req, res, next) => {
  try {
    const {
      name, description, categoryId, imageUrls,
      isInstituteProduct = false, basePrice, pricingStrategy,
      pricingTiers,
    } = req.body;

    const imageUrlsJson = imageUrls && Array.isArray(imageUrls) && imageUrls.length > 0
      ? JSON.stringify(imageUrls)
      : null;

    if (isInstituteProduct && (!pricingTiers || pricingTiers.length === 0) && basePrice == null) {
      throw new ValidationError(
        'Institute products require at least one pricing tier or a basePrice'
      );
    }

    const productData = {
      name,
      description,
      imageUrls: imageUrlsJson,
      categoryId,
      isInstituteProduct: !!isInstituteProduct,
      ...(basePrice != null && { basePrice }),
      ...(pricingStrategy && { pricingStrategy }),
    };

    if (isInstituteProduct && pricingTiers && pricingTiers.length > 0) {
      productData.pricing = {
        create: pricingTiers.map((t) => ({
          minQuantity: t.minQuantity,
          maxQuantity: t.maxQuantity ?? null,
          price: t.price,
          fixedPrice: t.fixedPrice ?? null,
          discountPercent: t.discountPercent ?? null,
        })),
      };
    }

    const product = await prisma.product.create({
      data: productData,
      include: {
        category: true,
        pricing: true,
      },
    });

    sendSuccess(res, parseProductImages(product), 'Product created successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Update product (Admin only)
 * Supports isInstituteProduct, basePrice, pricingStrategy, and pricingTiers replacement.
 */
const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name, description, categoryId, imageUrls,
      isInstituteProduct, basePrice, pricingStrategy,
      pricingTiers,
    } = req.body;

    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      throw new NotFoundError('Product not found');
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (imageUrls !== undefined) {
      updateData.imageUrls = Array.isArray(imageUrls) && imageUrls.length > 0
        ? JSON.stringify(imageUrls)
        : null;
    }
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (isInstituteProduct !== undefined) updateData.isInstituteProduct = !!isInstituteProduct;
    if (basePrice !== undefined) updateData.basePrice = basePrice;
    if (pricingStrategy !== undefined) updateData.pricingStrategy = pricingStrategy;

    if (pricingTiers && Array.isArray(pricingTiers)) {
      updateData.pricing = {
        deleteMany: {},
        create: pricingTiers.map((t) => ({
          minQuantity: t.minQuantity,
          maxQuantity: t.maxQuantity ?? null,
          price: t.price,
          fixedPrice: t.fixedPrice ?? null,
          discountPercent: t.discountPercent ?? null,
        })),
      };
    }

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        pricing: true,
      },
    });

    sendSuccess(res, parseProductImages(product), 'Product updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete product (Admin only)
 */
const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      throw new NotFoundError('Product not found');
    }

    await prisma.product.delete({
      where: { id },
    });

    sendSuccess(res, null, 'Product deleted successfully');
  } catch (error) {
    next(error);
  }
};

// Note: Product categories moved to category controller

/**
 * Add product pricing tier
 * Supports maxQuantity, fixedPrice, discountPercent for institute tier pricing.
 */
const addProductPricing = async (req, res, next) => {
  try {
    const productId = req.params.id || req.body.productId;
    const { minQuantity, maxQuantity, price, fixedPrice, discountPercent } = req.body;

    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!existingProduct) {
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

    sendSuccess(res, {
      ...pricing,
      product: parseProductImages(pricing.product),
    }, 'Pricing added successfully', 201);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  addProductPricing,
  exportProductsCsv: async (req, res, next) => {
    try {
      const { categoryId, collegeId } = req.query;
      const search =
        typeof req.query.search === 'string' && req.query.search.trim() !== ''
          ? req.query.search.trim()
          : undefined;

      let categoryIdIn = undefined;
      if (categoryId) {
        const root = await prisma.productCategory.findUnique({
          where: { id: categoryId },
          select: { id: true },
        });
        if (!root) {
          throw new NotFoundError('Category not found');
        }
        const branchIds = await getCategoryIdsIncludingDescendants(prisma, categoryId);
        categoryIdIn = { in: branchIds };
      }

      const where = {
        ...(categoryIdIn && { categoryId: categoryIdIn }),
        ...(collegeId && {
          category: {
            collegeId: collegeId,
          },
        }),
        ...(search && {
          OR: [
            { name: { contains: search } },
            { description: { contains: search } },
          ],
        }),
      };

      if (req.query.isInstituteProduct !== undefined) {
        where.isInstituteProduct = req.query.isInstituteProduct === 'true';
      }

      const products = await prisma.product.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });

      const csvStringifier = createObjectCsvStringifier({
        header: [
          { id: 'id', title: 'id' },
          { id: 'name', title: 'name' },
          { id: 'description', title: 'description' },
          { id: 'categoryId', title: 'categoryId' },
          { id: 'isInstituteProduct', title: 'isInstituteProduct' },
          { id: 'basePrice', title: 'basePrice' },
          { id: 'pricingStrategy', title: 'pricingStrategy' },
          { id: 'imageUrls', title: 'imageUrls' },
        ],
      });

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="products.csv"');

      res.write(csvStringifier.getHeaderString());

      for (const p of products) {
        const record = {
          id: p.id,
          name: p.name,
          description: p.description,
          categoryId: p.categoryId,
          isInstituteProduct: p.isInstituteProduct ? 'true' : 'false',
          basePrice: p.basePrice ?? '',
          pricingStrategy: p.pricingStrategy ?? '',
          imageUrls: p.imageUrls ?? '',
        };
        res.write(csvStringifier.stringifyRecords([record]));
      }
      res.end();
    } catch (error) {
      next(error);
    }
  },

  exportProductPricingCsv: async (req, res, next) => {
    try {
      const tiers = await prisma.productPricing.findMany({
        orderBy: [{ productId: 'asc' }, { minQuantity: 'asc' }],
      });

      const csvStringifier = createObjectCsvStringifier({
        header: [
          { id: 'id', title: 'id' },
          { id: 'productId', title: 'productId' },
          { id: 'minQuantity', title: 'minQuantity' },
          { id: 'maxQuantity', title: 'maxQuantity' },
          { id: 'price', title: 'price' },
          { id: 'fixedPrice', title: 'fixedPrice' },
          { id: 'discountPercent', title: 'discountPercent' },
        ],
      });

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="product_pricing.csv"');
      res.write(csvStringifier.getHeaderString());

      for (const t of tiers) {
        const record = {
          id: t.id,
          productId: t.productId,
          minQuantity: t.minQuantity,
          maxQuantity: t.maxQuantity ?? '',
          price: t.price,
          fixedPrice: t.fixedPrice ?? '',
          discountPercent: t.discountPercent ?? '',
        };
        res.write(csvStringifier.stringifyRecords([record]));
      }
      res.end();
    } catch (error) {
      next(error);
    }
  },

  importProductsCsv: async (req, res, next) => {
    try {
      if (!req.file?.buffer) {
        throw new ValidationError('CSV file is required');
      }

      const rows = await parseCsvBuffer(req.file.buffer);
      const errors = [];
      let createdCount = 0;
      let updatedCount = 0;
      let skippedCount = 0;

      for (let i = 0; i < rows.length; i++) {
        const rowNumber = i + 2; // header is row 1
        const r = rows[i] || {};

        const id = (r.id ?? '').trim();
        const name = (r.name ?? '').trim();
        const description = (r.description ?? '').trim();
        const categoryId = (r.categoryId ?? '').trim();
        const isInstituteProduct = toBool(r.isInstituteProduct) ?? false;
        const basePrice = toNumberOrNull(r.basePrice);
        const pricingStrategyRaw = (r.pricingStrategy ?? '').trim();
        const pricingStrategy =
          pricingStrategyRaw === '' ? null : pricingStrategyRaw;
        const imageUrls = toJsonArrayStringOrNull(r.imageUrls);

        if (!name || !description || !categoryId) {
          skippedCount++;
          errors.push({ row: rowNumber, message: 'Missing required fields: name, description, categoryId' });
          continue;
        }

        if (isInstituteProduct && basePrice == null) {
          // Allow institute products without basePrice so pricing tiers can be imported separately.
          // Enforce at least pricingStrategy presence to avoid ambiguous pricing.
          if (!pricingStrategy) {
            skippedCount++;
            errors.push({
              row: rowNumber,
              message: 'Institute product requires basePrice or pricingStrategy (tiers imported separately).',
            });
            continue;
          }
        }

        const data = {
          name,
          description,
          categoryId,
          isInstituteProduct: !!isInstituteProduct,
          basePrice: basePrice,
          pricingStrategy: pricingStrategy,
          imageUrls: imageUrls,
        };

        try {
          if (id) {
            const existing = await prisma.product.findUnique({ where: { id } });
            if (existing) {
              await prisma.product.update({ where: { id }, data });
              updatedCount++;
            } else {
              await prisma.product.create({ data: { id, ...data } });
              createdCount++;
            }
          } else {
            await prisma.product.create({ data });
            createdCount++;
          }
        } catch (e) {
          skippedCount++;
          errors.push({ row: rowNumber, message: e.message || 'Failed to import row' });
        }
      }

      sendSuccess(
        res,
        { createdCount, updatedCount, skippedCount, errors },
        'Products CSV import processed'
      );
    } catch (error) {
      next(error);
    }
  },

  importProductPricingCsv: async (req, res, next) => {
    try {
      if (!req.file?.buffer) {
        throw new ValidationError('CSV file is required');
      }

      const replace = req.query.replace === 'true';
      const rows = await parseCsvBuffer(req.file.buffer);
      const errors = [];
      let createdCount = 0;
      let updatedCount = 0;
      let skippedCount = 0;

      if (replace) {
        const productIds = Array.from(
          new Set(
            rows
              .map((r) => (r.productId ?? '').trim())
              .filter(Boolean)
          )
        );
        if (productIds.length === 0) {
          throw new ValidationError('productId is required for replace mode');
        }

        await prisma.productPricing.deleteMany({
          where: { productId: { in: productIds } },
        });

        for (let i = 0; i < rows.length; i++) {
          const rowNumber = i + 2;
          const r = rows[i] || {};
          const productId = (r.productId ?? '').trim();
          const minQuantity = toIntOrNull(r.minQuantity);
          const maxQuantity = toIntOrNull(r.maxQuantity);
          const price = toNumberOrNull(r.price);
          const fixedPrice = toNumberOrNull(r.fixedPrice);
          const discountPercent = toNumberOrNull(r.discountPercent);

          if (!productId || !minQuantity || price == null) {
            skippedCount++;
            errors.push({ row: rowNumber, message: 'Missing required fields: productId, minQuantity, price' });
            continue;
          }

          try {
            await prisma.productPricing.create({
              data: {
                productId,
                minQuantity,
                maxQuantity: maxQuantity ?? null,
                price,
                fixedPrice: fixedPrice ?? null,
                discountPercent: discountPercent ?? null,
              },
            });
            createdCount++;
          } catch (e) {
            skippedCount++;
            errors.push({ row: rowNumber, message: e.message || 'Failed to import row' });
          }
        }

        sendSuccess(
          res,
          { createdCount, updatedCount, skippedCount, errors },
          'Product pricing CSV import processed'
        );
        return;
      }

      for (let i = 0; i < rows.length; i++) {
        const rowNumber = i + 2;
        const r = rows[i] || {};

        const id = (r.id ?? '').trim();
        const productId = (r.productId ?? '').trim();
        const minQuantity = toIntOrNull(r.minQuantity);
        const maxQuantity = toIntOrNull(r.maxQuantity);
        const price = toNumberOrNull(r.price);
        const fixedPrice = toNumberOrNull(r.fixedPrice);
        const discountPercent = toNumberOrNull(r.discountPercent);

        if (!productId || !minQuantity || price == null) {
          skippedCount++;
          errors.push({ row: rowNumber, message: 'Missing required fields: productId, minQuantity, price' });
          continue;
        }

        const data = {
          productId,
          minQuantity,
          maxQuantity: maxQuantity ?? null,
          price,
          fixedPrice: fixedPrice ?? null,
          discountPercent: discountPercent ?? null,
        };

        try {
          if (id) {
            const existing = await prisma.productPricing.findUnique({ where: { id } });
            if (existing) {
              await prisma.productPricing.update({ where: { id }, data });
              updatedCount++;
            } else {
              await prisma.productPricing.create({ data: { id, ...data } });
              createdCount++;
            }
          } else {
            await prisma.productPricing.create({ data });
            createdCount++;
          }
        } catch (e) {
          skippedCount++;
          errors.push({ row: rowNumber, message: e.message || 'Failed to import row' });
        }
      }

      sendSuccess(
        res,
        { createdCount, updatedCount, skippedCount, errors },
        'Product pricing CSV import processed'
      );
    } catch (error) {
      next(error);
    }
  },

  downloadProductsCsvTemplate: async (req, res, next) => {
    try {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="products_template.csv"');
      res.end(
        [
          'id,name,description,categoryId,isInstituteProduct,basePrice,pricingStrategy,imageUrls',
          ',Example Product,Example description,00000000-0000-0000-0000-000000000000,false,10.5,,["https://example.com/image.png"]',
        ].join('\n')
      );
    } catch (error) {
      next(error);
    }
  },

  downloadProductPricingCsvTemplate: async (req, res, next) => {
    try {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="product_pricing_template.csv"');
      res.end(
        [
          'id,productId,minQuantity,maxQuantity,price,fixedPrice,discountPercent',
          ',00000000-0000-0000-0000-000000000000,1,9,100,,,',
          ',00000000-0000-0000-0000-000000000000,10,,95,,,',
        ].join('\n')
      );
    } catch (error) {
      next(error);
    }
  },
};
