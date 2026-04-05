const prisma = require('../config/database');

const productListInclude = {
  category: {
    include: {
      college: true,
    },
  },
  pricing: true,
};

const productDetailInclude = {
  category: true,
  pricing: {
    orderBy: { minQuantity: 'asc' },
  },
};

const findProducts = ({ where, skip, take }) =>
  prisma.product.findMany({
    where,
    skip,
    take,
    include: productListInclude,
    orderBy: { createdAt: 'desc' },
  });

const countProducts = (where) =>
  prisma.product.count({ where });

const findProductById = (id) =>
  prisma.product.findUnique({
    where: { id },
    include: productDetailInclude,
  });

const findProductBasicById = (id) =>
  prisma.product.findUnique({
    where: { id },
  });

const createProduct = (data) =>
  prisma.product.create({
    data,
    include: {
      category: true,
    },
  });

const updateProduct = (id, data) =>
  prisma.product.update({
    where: { id },
    data,
    include: {
      category: true,
    },
  });

const deleteProduct = (id) =>
  prisma.product.delete({
    where: { id },
  });

const findProductReviews = (targetId) =>
  prisma.review.findMany({
    where: {
      targetId,
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

const createProductPricing = (data) =>
  prisma.productPricing.create({
    data,
    include: {
      product: true,
    },
  });

module.exports = {
  findProducts,
  countProducts,
  findProductById,
  findProductBasicById,
  createProduct,
  updateProduct,
  deleteProduct,
  findProductReviews,
  createProductPricing,
};
