const categoryRepository = require('../repositories/categoryRepository');
const { NotFoundError } = require('../utils/errors');

const getBookCategories = async () =>
  categoryRepository.findBookCategories();

const createBookCategory = async ({ name }) =>
  categoryRepository.createBookCategory({ name });

const updateBookCategory = async ({ id, name }) => {
  const existingCategory = await categoryRepository.findBookCategoryById(id);

  if (!existingCategory) {
    throw new NotFoundError('Book category not found');
  }

  return categoryRepository.updateBookCategory(id, { name });
};

const deleteBookCategory = async ({ id }) => {
  const existingCategory = await categoryRepository.findBookCategoryById(id);

  if (!existingCategory) {
    throw new NotFoundError('Book category not found');
  }

  await categoryRepository.deleteBookCategory(id);
};

const getProductCategories = async ({ collegeId }) => {
  const where = {};
  if (collegeId) {
    where.collegeId = collegeId;
  }

  return categoryRepository.findProductCategories(where);
};

const getMaterialCategories = async ({ collegeId }) => {
  const where = {};
  if (collegeId) {
    where.collegeId = collegeId;
  }

  return categoryRepository.findMaterialCategories(where);
};

const createProductCategory = async ({ name }) =>
  categoryRepository.createProductCategory({ name });

const updateProductCategory = async ({ id, name }) => {
  const existingCategory = await categoryRepository.findProductCategoryById(id);

  if (!existingCategory) {
    throw new NotFoundError('Product category not found');
  }

  return categoryRepository.updateProductCategory(id, { name });
};

const deleteProductCategory = async ({ id }) => {
  const existingCategory = await categoryRepository.findProductCategoryById(id);

  if (!existingCategory) {
    throw new NotFoundError('Product category not found');
  }

  await categoryRepository.deleteProductCategory(id);
};

module.exports = {
  getBookCategories,
  createBookCategory,
  updateBookCategory,
  deleteBookCategory,
  getProductCategories,
  getMaterialCategories,
  createProductCategory,
  updateProductCategory,
  deleteProductCategory,
};
