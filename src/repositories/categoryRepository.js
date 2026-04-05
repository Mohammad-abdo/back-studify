const prisma = require('../config/database');

const findBookCategories = () =>
  prisma.bookCategory.findMany({
    include: {
      _count: {
        select: {
          books: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  });

const createBookCategory = (data) =>
  prisma.bookCategory.create({ data });

const findBookCategoryById = (id) =>
  prisma.bookCategory.findUnique({
    where: { id },
  });

const updateBookCategory = (id, data) =>
  prisma.bookCategory.update({
    where: { id },
    data,
  });

const deleteBookCategory = (id) =>
  prisma.bookCategory.delete({
    where: { id },
  });

const findProductCategories = (where) =>
  prisma.productCategory.findMany({
    where,
    include: {
      college: true,
      _count: {
        select: {
          products: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  });

const findMaterialCategories = (where) =>
  prisma.materialCategory.findMany({
    where,
    include: {
      college: true,
      _count: {
        select: {
          materials: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  });

const createProductCategory = (data) =>
  prisma.productCategory.create({ data });

const findProductCategoryById = (id) =>
  prisma.productCategory.findUnique({
    where: { id },
  });

const updateProductCategory = (id, data) =>
  prisma.productCategory.update({
    where: { id },
    data,
  });

const deleteProductCategory = (id) =>
  prisma.productCategory.delete({
    where: { id },
  });

module.exports = {
  findBookCategories,
  createBookCategory,
  findBookCategoryById,
  updateBookCategory,
  deleteBookCategory,
  findProductCategories,
  findMaterialCategories,
  createProductCategory,
  findProductCategoryById,
  updateProductCategory,
  deleteProductCategory,
};
