const bookPricingRepository = require('../repositories/bookPricingRepository');
const { buildPagination, getPaginationParams } = require('../utils/response');
const { NotFoundError, ConflictError } = require('../utils/errors');
const { APPROVAL_STATUS } = require('../utils/constants');

const getBookPricings = async ({ page, limit, bookId, approvalStatus }) => {
  const paginationParams = getPaginationParams(page, limit);
  const where = {
    ...(bookId && { bookId }),
    ...(approvalStatus && { approvalStatus }),
  };

  const [pricings, total] = await Promise.all([
    bookPricingRepository.findBookPricings({
      where,
      skip: paginationParams.skip,
      take: paginationParams.limit,
    }),
    bookPricingRepository.countBookPricings(where),
  ]);

  return {
    data: pricings,
    pagination: buildPagination(paginationParams.page, paginationParams.limit, total),
  };
};

const getBookPricingById = async ({ id }) => {
  const pricing = await bookPricingRepository.findBookPricingById(id);

  if (!pricing) {
    throw new NotFoundError('Book pricing not found');
  }

  return pricing;
};

const createBookPricing = async ({ bookId, accessType, price }) => {
  const book = await bookPricingRepository.findBookById(bookId);

  if (!book) {
    throw new NotFoundError('Book not found');
  }

  const existingPricing = await bookPricingRepository.findBookPricingByComposite({ bookId, accessType });
  if (existingPricing) {
    throw new ConflictError(`Pricing for ${accessType} already exists for this book`);
  }

  return bookPricingRepository.createBookPricing({
    bookId,
    accessType,
    price,
    approvalStatus: APPROVAL_STATUS.PENDING,
  });
};

const updateBookPricing = async ({ id, price, approvalStatus }) => {
  const existingPricing = await bookPricingRepository.findBookPricingById(id);

  if (!existingPricing) {
    throw new NotFoundError('Book pricing not found');
  }

  const updateData = {};
  if (price !== undefined) updateData.price = price;
  if (approvalStatus !== undefined) updateData.approvalStatus = approvalStatus;

  return bookPricingRepository.updateBookPricing(id, updateData);
};

const deleteBookPricing = async ({ id }) => {
  const existingPricing = await bookPricingRepository.findBookPricingById(id);

  if (!existingPricing) {
    throw new NotFoundError('Book pricing not found');
  }

  await bookPricingRepository.deleteBookPricing(id);
};

module.exports = {
  getBookPricings,
  getBookPricingById,
  createBookPricing,
  updateBookPricing,
  deleteBookPricing,
};
