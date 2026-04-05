const prisma = require('../config/database');

const bookDetailsInclude = {
  category: true,
  doctor: {
    include: {
      user: {
        select: {
          id: true,
          phone: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
  },
  college: true,
  department: true,
  pricing: true,
};

const findBooks = ({ where, skip, take }) =>
  prisma.book.findMany({
    where,
    skip,
    take,
    include: bookDetailsInclude,
    orderBy: { createdAt: 'desc' },
  });

const countBooks = (where) =>
  prisma.book.count({ where });

const findBookByIdWithDetails = (id) =>
  prisma.book.findUnique({
    where: { id },
    include: bookDetailsInclude,
  });

const findBookById = (id) =>
  prisma.book.findUnique({
    where: { id },
  });

const findDoctorByUserId = (userId) =>
  prisma.doctor.findUnique({
    where: { userId },
  });

const createBook = (data) =>
  prisma.book.create({
    data,
    include: {
      category: true,
      doctor: true,
      college: true,
      department: true,
    },
  });

const updateBook = (id, data) =>
  prisma.book.update({
    where: { id },
    data,
    include: {
      category: true,
      doctor: true,
      college: true,
      department: true,
    },
  });

const deleteBook = (id) =>
  prisma.book.delete({
    where: { id },
  });

const upsertBookPricing = ({ bookId, accessType, price, approvalStatus }) =>
  prisma.bookPricing.upsert({
    where: {
      bookId_accessType: {
        bookId,
        accessType,
      },
    },
    update: {
      price,
      approvalStatus,
    },
    create: {
      bookId,
      accessType,
      price,
      approvalStatus,
    },
  });

module.exports = {
  findBooks,
  countBooks,
  findBookByIdWithDetails,
  findBookById,
  findDoctorByUserId,
  createBook,
  updateBook,
  deleteBook,
  upsertBookPricing,
};
