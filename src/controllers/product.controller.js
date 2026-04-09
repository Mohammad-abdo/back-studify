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
    const { categoryId, collegeId, search } = req.query;

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
};
