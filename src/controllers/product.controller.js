/**
 * Product Controller
 * Handles product-related HTTP requests
 */

const prisma = require('../config/database');
const { sendSuccess, sendPaginated, getPaginationParams, buildPagination } = require('../utils/response');
const { NotFoundError, AuthorizationError } = require('../utils/errors');

/**
 * Get all products (with filters)
 */
const getProducts = async (req, res, next) => {
  try {
    const { page, limit } = getPaginationParams(req.query.page, req.query.limit);
    const { categoryId, collegeId, search } = req.query;

    const where = {
      ...(categoryId && { categoryId }),
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

    // Parse imageUrls JSON for each product (with error handling)
    const productsWithParsedImages = products.map(product => {
      let parsedImageUrls = [];
      if (product.imageUrls) {
        try {
          parsedImageUrls = typeof product.imageUrls === 'string' 
            ? JSON.parse(product.imageUrls) 
            : product.imageUrls;
          // Ensure it's an array
          if (!Array.isArray(parsedImageUrls)) {
            parsedImageUrls = [];
          }
        } catch (error) {
          // If JSON parsing fails, default to empty array
          console.error('Error parsing imageUrls for product', product.id, error);
          parsedImageUrls = [];
        }
      }
      return {
        ...product,
        imageUrls: parsedImageUrls,
      };
    });

    const pagination = buildPagination(page, limit, total);

    sendPaginated(res, productsWithParsedImages, pagination, 'Products retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get product by ID
 */
const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;

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

    // Parse imageUrls JSON (with error handling)
    let parsedImageUrls = [];
    if (product.imageUrls) {
      try {
        parsedImageUrls = typeof product.imageUrls === 'string' 
          ? JSON.parse(product.imageUrls) 
          : product.imageUrls;
        // Ensure it's an array
        if (!Array.isArray(parsedImageUrls)) {
          parsedImageUrls = [];
        }
      } catch (error) {
        // If JSON parsing fails, default to empty array
        console.error('Error parsing imageUrls for product', product.id, error);
        parsedImageUrls = [];
      }
    }

    const parsedProduct = {
      ...product,
      imageUrls: parsedImageUrls,
    };

    // Get reviews for this product (polymorphic relation)
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
 */
const createProduct = async (req, res, next) => {
  try {
    const { name, description, categoryId, imageUrls } = req.body;

    // Convert imageUrls array to JSON string (optional field)
    const imageUrlsJson = imageUrls && Array.isArray(imageUrls) && imageUrls.length > 0 
      ? JSON.stringify(imageUrls) 
      : null;

    const product = await prisma.product.create({
      data: {
        name,
        description,
        imageUrls: imageUrlsJson,
        categoryId,
      },
      include: {
        category: true,
      },
    });

    sendSuccess(res, product, 'Product created successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Update product (Admin only)
 */
const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, categoryId, imageUrls } = req.body;

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

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
      },
    });

    sendSuccess(res, product, 'Product updated successfully');
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
 * Add product pricing
 */
const addProductPricing = async (req, res, next) => {
  try {
    const { productId, minQuantity, price } = req.body;

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
        price,
      },
      include: {
        product: true,
      },
    });

    sendSuccess(res, pricing, 'Pricing added successfully', 201);
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
