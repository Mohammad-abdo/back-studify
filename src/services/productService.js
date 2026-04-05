const productRepository = require('../repositories/productRepository');
const { buildPagination, getPaginationParams } = require('../utils/response');
const { NotFoundError } = require('../utils/errors');

const parseImageUrls = (product) => {
  let parsedImageUrls = [];

  if (product.imageUrls) {
    try {
      parsedImageUrls = typeof product.imageUrls === 'string'
        ? JSON.parse(product.imageUrls)
        : product.imageUrls;

      if (!Array.isArray(parsedImageUrls)) {
        parsedImageUrls = [];
      }
    } catch (error) {
      console.error('Error parsing imageUrls for product', product.id, error);
      parsedImageUrls = [];
    }
  }

  return {
    ...product,
    imageUrls: parsedImageUrls,
  };
};

const getProducts = async ({ page, limit, categoryId, collegeId, search }) => {
  const paginationParams = getPaginationParams(page, limit);
  const where = {
    ...(categoryId && { categoryId }),
    ...(collegeId && {
      category: {
        collegeId,
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
    productRepository.findProducts({
      where,
      skip: paginationParams.skip,
      take: paginationParams.limit,
    }),
    productRepository.countProducts(where),
  ]);

  return {
    data: products.map(parseImageUrls),
    pagination: buildPagination(paginationParams.page, paginationParams.limit, total),
  };
};

const getProductById = async ({ id }) => {
  const product = await productRepository.findProductById(id);

  if (!product) {
    throw new NotFoundError('Product not found');
  }

  const reviews = await productRepository.findProductReviews(id);

  return {
    ...parseImageUrls(product),
    reviews,
  };
};

const createProduct = ({ name, description, categoryId, imageUrls }) =>
  productRepository.createProduct({
    name,
    description,
    imageUrls: imageUrls && Array.isArray(imageUrls) && imageUrls.length > 0
      ? JSON.stringify(imageUrls)
      : null,
    categoryId,
  });

const updateProduct = async ({ id, name, description, categoryId, imageUrls }) => {
  const existingProduct = await productRepository.findProductBasicById(id);

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

  return productRepository.updateProduct(id, updateData);
};

const deleteProduct = async ({ id }) => {
  const existingProduct = await productRepository.findProductBasicById(id);

  if (!existingProduct) {
    throw new NotFoundError('Product not found');
  }

  await productRepository.deleteProduct(id);
};

const addProductPricing = async ({ productId, minQuantity, price }) => {
  const existingProduct = await productRepository.findProductBasicById(productId);

  if (!existingProduct) {
    throw new NotFoundError('Product not found');
  }

  return productRepository.createProductPricing({
    productId,
    minQuantity,
    price,
  });
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  addProductPricing,
};
