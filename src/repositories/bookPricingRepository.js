const prisma = require('../config/database');

const findBookPricings = ({ where, skip, take }) =>
  prisma.bookPricing.findMany({
    where,
    skip,
    take,
    include: {
      book: {
        select: {
          id: true,
          title: true,
        },
      },
    },
    orderBy: { bookId: 'asc' },
  });

const countBookPricings = (where) =>
  prisma.bookPricing.count({ where });

const findBookPricingById = (id) =>
  prisma.bookPricing.findUnique({
    where: { id },
    include: {
      book: true,
    },
  });

const findBookById = (id) =>
  prisma.book.findUnique({
    where: { id },
  });

const findBookPricingByComposite = ({ bookId, accessType }) =>
  prisma.bookPricing.findUnique({
    where: {
      bookId_accessType: {
        bookId,
        accessType,
      },
    },
  });

const createBookPricing = (data) =>
  prisma.bookPricing.create({
    data,
    include: {
      book: true,
    },
  });

const updateBookPricing = (id, data) =>
  prisma.bookPricing.update({
    where: { id },
    data,
    include: {
      book: true,
    },
  });

const deleteBookPricing = (id) =>
  prisma.bookPricing.delete({
    where: { id },
  });

module.exports = {
  findBookPricings,
  countBookPricings,
  findBookPricingById,
  findBookById,
  findBookPricingByComposite,
  createBookPricing,
  updateBookPricing,
  deleteBookPricing,
};
