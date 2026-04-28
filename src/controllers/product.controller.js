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
const ExcelJS = require('exceljs');
const productXlsx = require('../utils/productXlsx');

/**
 * Upsert pricing tiers from plain row objects (same shape as csv-parser rows).
 * @param {Array<Record<string,string>>} rows
 * @param {boolean} replace
 * @param {(n:number,m:string)=>void} pushError
 * @param {(i:number)=>number} rowNumberForIndex
 */
const importProductPricingFromParsedRows = async (
  rows,
  replace,
  pushError,
  rowNumberForIndex = (i) => i + 2
) => {
  const errors = [];
  let createdCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;

  if (replace) {
    const productIds = Array.from(
      new Set(rows.map((r) => (r.productId ?? '').trim()).filter(Boolean))
    );
    if (productIds.length === 0) {
      throw new ValidationError('productId is required for replace mode');
    }
    await prisma.productPricing.deleteMany({
      where: { productId: { in: productIds } },
    });
    for (let i = 0; i < rows.length; i++) {
      const rowNumber = rowNumberForIndex(i);
      const r = rows[i] || {};
      const productId = (r.productId ?? '').trim();
      const minQuantity = toIntOrNull(r.minQuantity);
      const maxQuantity = toIntOrNull(r.maxQuantity);
      const price = toNumberOrNull(r.price);
      const fixedPrice = toNumberOrNull(r.fixedPrice);
      const discountPercent = toNumberOrNull(r.discountPercent);
      if (!productId || !minQuantity || price == null) {
        skippedCount++;
        const msg = 'Missing required fields: productId, minQuantity, price';
        errors.push({ row: rowNumber, message: msg });
        if (pushError) pushError(rowNumber, msg);
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
        if (pushError) pushError(rowNumber, e.message || 'Failed to import row');
      }
    }
    return { createdCount, updatedCount, skippedCount, errors };
  }

  for (let i = 0; i < rows.length; i++) {
    const rowNumber = rowNumberForIndex(i);
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
      const msg = 'Missing required fields: productId, minQuantity, price';
      errors.push({ row: rowNumber, message: msg });
      if (pushError) pushError(rowNumber, msg);
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
      if (pushError) pushError(rowNumber, e.message || 'Failed to import row');
    }
  }
  return { createdCount, updatedCount, skippedCount, errors };
};

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
      const { createdCount, updatedCount, skippedCount, errors } =
        await importProductPricingFromParsedRows(rows, replace, null, (i) => i + 2);

      sendSuccess(
        res,
        { createdCount, updatedCount, skippedCount, errors },
        'Product pricing CSV import processed'
      );
    } catch (error) {
      next(error);
    }
  },

  exportProductsXlsx: async (req, res, next) => {
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

      const [products, tiers] = await Promise.all([
        prisma.product.findMany({
          where,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.productPricing.findMany({
          orderBy: [{ productId: 'asc' }, { minQuantity: 'asc' }],
        }),
      ]);

      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Studify';
      const wsProducts = workbook.addWorksheet(productXlsx.SHEET_PRODUCTS);
      const wsPricing = workbook.addWorksheet(productXlsx.SHEET_PRICING);
      productXlsx.buildProductsSheet(wsProducts, products);
      productXlsx.buildPricingSheet(wsPricing, tiers);
      await productXlsx.embedLocalImagesOnProductsSheet(workbook, wsProducts, products);

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader('Content-Disposition', 'attachment; filename="products_export.xlsx"');
      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      next(error);
    }
  },

  importProductsXlsx: async (req, res, next) => {
    try {
      if (!req.file?.buffer) {
        throw new ValidationError('Excel file is required');
      }

      const replace = req.query.replace === 'true';
      const workbook = await productXlsx.parseWorkbookFromBuffer(req.file.buffer);
      const productsWs = workbook.getWorksheet(productXlsx.SHEET_PRODUCTS);
      if (!productsWs) {
        throw new ValidationError(`Missing worksheet "${productXlsx.SHEET_PRODUCTS}"`);
      }

      const categories = await prisma.productCategory.findMany({
        select: { id: true, name: true },
      });
      const categoryMap = new Map();
      const categoryDuplicates = new Set();
      for (const c of categories) {
        const key = (c.name || '').trim().toLowerCase();
        if (!key) continue;
        if (categoryMap.has(key)) {
          categoryDuplicates.add(key);
          continue;
        }
        categoryMap.set(key, c.id);
      }

      const allProductsForMap = await prisma.product.findMany({
        select: { id: true, name: true },
      });
      const productMap = new Map();
      const productDuplicates = new Set();
      for (const p of allProductsForMap) {
        const key = (p.name || '').trim().toLowerCase();
        if (!key) continue;
        if (productMap.has(key)) {
          productDuplicates.add(key);
          continue;
        }
        productMap.set(key, p.id);
      }

      const imageErrors = [];
      const embeddedByRow = await productXlsx.extractEmbeddedImagesByRow(
        workbook,
        productsWs,
        imageErrors
      );

      const productRowObjs = productXlsx.readRowsAsObjects(productsWs, [
        ...productXlsx.PRODUCT_HEADERS,
        'categoryName',
        'productName',
      ]);

      const errors = [];
      let createdCount = 0;
      let updatedCount = 0;
      let skippedCount = 0;

      for (const { sheetRow, data: r } of productRowObjs) {
        let id = (r.id ?? '').trim();
        const productName = (r.productName ?? '').trim();
        const name = (r.name ?? '').trim();
        const description = (r.description ?? '').trim();
        let categoryId = (r.categoryId ?? '').trim();
        const categoryName = (r.categoryName ?? '').trim();
        const isInstituteProduct = toBool(r.isInstituteProduct) ?? false;
        const basePrice = toNumberOrNull(r.basePrice);
        const pricingStrategyRaw = (r.pricingStrategy ?? '').trim();
        const pricingStrategy = pricingStrategyRaw === '' ? null : pricingStrategyRaw;
        const embeddedUrls = embeddedByRow.get(sheetRow) || [];
        const imageUrls = productXlsx.mergeImageUrlsCellAndEmbedded(
          r.imageUrls,
          embeddedUrls
        );

        if (!id && productName) {
          const key = productName.toLowerCase();
          if (productDuplicates.has(key)) {
            skippedCount++;
            errors.push({
              row: sheetRow,
              message: `Duplicate product name "${productName}" found in system. Use id instead.`,
            });
            continue;
          }
          const mapped = productMap.get(key);
          if (!mapped) {
            skippedCount++;
            errors.push({
              row: sheetRow,
              message: `Product "${productName}" not found.`,
            });
            continue;
          }
          id = mapped;
        }

        if (!categoryId && categoryName) {
          const key = categoryName.toLowerCase();
          if (categoryDuplicates.has(key)) {
            skippedCount++;
            errors.push({
              row: sheetRow,
              message: `Duplicate category name "${categoryName}" found in system. Use categoryId instead.`,
            });
            continue;
          }
          const mapped = categoryMap.get(key);
          if (!mapped) {
            skippedCount++;
            errors.push({
              row: sheetRow,
              message: `Category "${categoryName}" not found.`,
            });
            continue;
          }
          categoryId = mapped;
        }

        if (!name || !description || !categoryId) {
          skippedCount++;
          errors.push({
            row: sheetRow,
            message: 'Missing required fields: name, description, categoryId',
          });
          continue;
        }

        if (isInstituteProduct && basePrice == null) {
          if (!pricingStrategy) {
            skippedCount++;
            errors.push({
              row: sheetRow,
              message:
                'Institute product requires basePrice or pricingStrategy (tiers on ProductPricing sheet).',
            });
            continue;
          }
        }

        const data = {
          name,
          description,
          categoryId,
          isInstituteProduct: !!isInstituteProduct,
          basePrice,
          pricingStrategy,
          imageUrls,
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
          errors.push({ row: sheetRow, message: e.message || 'Failed to import row' });
        }
      }

      const pricingWs = workbook.getWorksheet(productXlsx.SHEET_PRICING);
      let pricingSummary = null;
      if (pricingWs) {
        const pricingRowObjs = productXlsx.readRowsAsObjects(
          pricingWs,
          [...productXlsx.PRICING_HEADERS, 'productName']
        );
        const pricingRows = pricingRowObjs.map((o) => o.data);

        // Map productName -> productId when productId is empty (for both existing and newly created products).
        const productMap = new Map();
        const productDupes = new Set();
        const allProducts = await prisma.product.findMany({ select: { id: true, name: true } });
        for (const p of allProducts) {
          const key = (p.name || '').trim().toLowerCase();
          if (!key) continue;
          if (productMap.has(key)) {
            productDupes.add(key);
            continue;
          }
          productMap.set(key, p.id);
        }

        for (let i = 0; i < pricingRowObjs.length; i++) {
          const row = pricingRows[i];
          const hasId = (row.productId ?? '').trim();
          const nameRaw = (row.productName ?? '').trim();
          if (hasId || !nameRaw) continue;
          const key = nameRaw.toLowerCase();
          if (productDupes.has(key)) {
            // Let the downstream importer flag missing productId; we keep productName for context.
            continue;
          }
          const mapped = productMap.get(key);
          if (mapped) row.productId = mapped;
        }

        pricingSummary = await importProductPricingFromParsedRows(
          pricingRows,
          replace,
          null,
          (i) => pricingRowObjs[i].sheetRow
        );
      }

      sendSuccess(
        res,
        {
          products: { createdCount, updatedCount, skippedCount, errors },
          pricing: pricingSummary,
          images: { errors: imageErrors },
        },
        'Products XLSX import processed'
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

  downloadProductsImportXlsxTemplate: async (req, res, next) => {
    try {
      const categories = await prisma.productCategory.findMany({
        select: { name: true },
        orderBy: { name: 'asc' },
      });
      const products = await prisma.product.findMany({
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      });

      const names = categories
        .map((c) => (c.name || '').trim())
        .filter(Boolean);
      const productPairs = products
        .map((p) => ({
          name: (p.name || '').trim(),
          id: p.id,
        }))
        .filter((p) => p.name && p.id);

      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Studify';

      const wsProducts = workbook.addWorksheet('Products');
      const wsPricing = workbook.addWorksheet('ProductPricing');
      const wsLists = workbook.addWorksheet('Lists');
      wsLists.state = 'veryHidden';
      const maxRow = 1000;

      // Lists sheet: categories (A) + existing products (C:D) + combined products list (E)
      for (let i = 0; i < names.length; i++) {
        wsLists.getCell(i + 1, 1).value = names[i];
      }
      for (let i = 0; i < productPairs.length; i++) {
        wsLists.getCell(i + 1, 3).value = productPairs[i].name; // C
        wsLists.getCell(i + 1, 4).value = productPairs[i].id;   // D
      }
      // Combined list in column E:
      // - rows 1..existingCount: existing product names (Lists!C)
      // - rows existingCount+1..existingCount+999: Products sheet names (Products!C2:C1000)
      const existingCount = Math.max(productPairs.length, 1);
      const combinedCount = existingCount + (maxRow - 1);
      for (let i = 1; i <= combinedCount; i++) {
        if (i <= existingCount) {
          wsLists.getCell(i, 5).value = { formula: `C${i}` };
        } else {
          const prodRow = i - existingCount + 1; // maps 2..1000
          wsLists.getCell(i, 5).value = { formula: `Products!$C$${prodRow}` };
        }
      }

      // Products sheet headers
      // - productName: dropdown to pick an existing product (optional)
      // - id: auto-filled by VLOOKUP when productName selected; can be left empty for new products
      const headers = [
        'productName',
        'id',
        'name',
        'description',
        'categoryName',
        'isInstituteProduct',
        'basePrice',
        'pricingStrategy',
        'imageUrls',
      ];
      wsProducts.addRow(headers);
      wsProducts.getRow(1).font = { bold: true };
      wsProducts.columns = [
        { key: 'productName', width: 28 },
        { key: 'id', width: 40 },
        { key: 'name', width: 28 },
        { key: 'description', width: 50 },
        { key: 'categoryName', width: 28 },
        { key: 'isInstituteProduct', width: 18 },
        { key: 'basePrice', width: 12 },
        { key: 'pricingStrategy', width: 18 },
        { key: 'imageUrls', width: 40 },
      ];

      // Example row
      wsProducts.addRow([
        '',
        '',
        'Example Product',
        'Example description (10+ chars)',
        names[0] || '',
        'FALSE',
        10.5,
        '',
        '[]',
      ]);

      // Existing product dropdown on Products!A2:A1000 referencing Lists!C
      const lastProductRow = Math.max(productPairs.length, 1);
      const productNameFormula = `=Lists!$C$1:$C$${lastProductRow}`;
      for (let r = 2; r <= maxRow; r++) {
        wsProducts.getCell(r, 1).dataValidation = {
          type: 'list',
          allowBlank: true,
          showErrorMessage: true,
          errorStyle: 'error',
          errorTitle: 'Invalid product',
          error: 'Choose a product from the dropdown list.',
          formulae: [productNameFormula],
        };
        // Auto-fill id based on productName (column B)
        wsProducts.getCell(r, 2).value = {
          formula: `IFERROR(VLOOKUP(A${r},Lists!$C$1:$D$${lastProductRow},2,FALSE),\"\")`,
        };
      }

      // Lock Products.id column (B). Everything else stays editable.
      // 1) Unlock A1:I1000
      for (let r = 1; r <= maxRow; r++) {
        for (let c = 1; c <= headers.length; c++) {
          wsProducts.getCell(r, c).protection = { locked: false };
        }
      }
      // 2) Lock column B (id)
      for (let r = 1; r <= maxRow; r++) {
        wsProducts.getCell(r, 2).protection = { locked: true };
      }
      // 3) Protect sheet (no password prompt)
      await wsProducts.protect('', {
        selectLockedCells: true,
        selectUnlockedCells: true,
        formatCells: true,
        formatColumns: true,
        formatRows: true,
        insertRows: false,
        insertColumns: false,
        deleteRows: false,
        deleteColumns: false,
        sort: false,
        autoFilter: true,
      });

      // Apply dropdown validation to categoryName column (E) rows 2..1000
      const lastListRow = Math.max(names.length, 1);
      const formula = `=Lists!$A$1:$A$${lastListRow}`;
      for (let r = 2; r <= maxRow; r++) {
        wsProducts.getCell(r, 5).dataValidation = {
          type: 'list',
          allowBlank: false,
          showErrorMessage: true,
          errorStyle: 'error',
          errorTitle: 'Invalid category',
          error: 'Choose a category from the dropdown list.',
          formulae: [formula],
        };
      }

      // Pricing sheet headers (no `id` column — create-only template)
      // - productName: dropdown for existing + newly typed products
      const pricingHeaders = [
        'productName',
        'productId',
        'minQuantity',
        'maxQuantity',
        'price',
        'fixedPrice',
        'discountPercent',
      ];
      wsPricing.addRow(pricingHeaders);
      wsPricing.getRow(1).font = { bold: true };
      wsPricing.columns = [
        { key: 'productName', width: 28 },
        { key: 'productId', width: 40 },
        { key: 'minQuantity', width: 14 },
        { key: 'maxQuantity', width: 14 },
        { key: 'price', width: 12 },
        { key: 'fixedPrice', width: 12 },
        { key: 'discountPercent', width: 16 },
      ];

      // Example pricing row
      wsPricing.addRow([
        productPairs[0]?.name || '',
        '',
        1,
        9,
        100,
        '',
        '',
      ]);

      // Product dropdown on ProductPricing!A2:A1000 referencing Lists!E (existing + Products sheet names).
      const productNameFormulaPricing = `=Lists!$E$1:$E$${combinedCount}`;
      for (let r = 2; r <= maxRow; r++) {
        wsPricing.getCell(r, 1).dataValidation = {
          type: 'list',
          allowBlank: true,
          showErrorMessage: true,
          errorStyle: 'error',
          errorTitle: 'Invalid product',
          error: 'Choose a product from the dropdown list.',
          formulae: [productNameFormulaPricing],
        };

        // Auto-fill productId based on productName
        // B2 formula: VLOOKUP(productName, Lists!C:D, 2, FALSE) for existing products.
        // For newly typed products (from Products sheet), id will be assigned on import; backend maps by name.
        wsPricing.getCell(r, 2).value = {
          formula: `IFERROR(VLOOKUP(A${r},Lists!$C$1:$D$${existingCount},2,FALSE),\"\")`,
        };
      }

      // Lock only ProductPricing.productId (column B). Everything else stays editable.
      // Excel uses "locked" flag + worksheet protection.
      // 1) Unlock the full used range (A1:G1000)
      for (let r = 1; r <= maxRow; r++) {
        for (let c = 1; c <= pricingHeaders.length; c++) {
          wsPricing.getCell(r, c).protection = { locked: false };
        }
      }
      // 2) Lock column B (productId) for rows 1..1000
      for (let r = 1; r <= maxRow; r++) {
        wsPricing.getCell(r, 2).protection = { locked: true };
      }
      // 3) Protect the sheet (no password prompt)
      await wsPricing.protect('', {
        selectLockedCells: true,
        selectUnlockedCells: true,
        formatCells: true,
        formatColumns: true,
        formatRows: true,
        insertRows: false,
        insertColumns: false,
        deleteRows: false,
        deleteColumns: false,
        sort: false,
        autoFilter: true,
      });

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="products_import.xlsx"'
      );
      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      next(error);
    }
  },
};
