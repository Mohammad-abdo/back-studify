const prisma = require('../config/database');

const orderBookInclude = {
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
  category: true,
};

const orderMaterialInclude = {
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
  category: true,
};

const orderProductInclude = {
  category: true,
};

const printOptionBookSelect = {
  id: true,
  title: true,
  totalPages: true,
  description: true,
};

const printOptionMaterialSelect = {
  id: true,
  title: true,
  totalPages: true,
  description: true,
};

const findBooksForOrderItems = (ids) =>
  prisma.book.findMany({
    where: { id: { in: ids } },
    include: orderBookInclude,
  });

const findMaterialsForOrderItems = (ids) =>
  prisma.material.findMany({
    where: { id: { in: ids } },
    include: orderMaterialInclude,
  });

const findProductsForOrderItems = (ids) =>
  prisma.product.findMany({
    where: { id: { in: ids } },
    include: orderProductInclude,
  });

const findBookBasicById = (id) =>
  prisma.book.findUnique({
    where: { id },
    select: { id: true },
  });

const findMaterialBasicById = (id) =>
  prisma.material.findUnique({
    where: { id },
    select: { id: true },
  });

const findBookForPrintOptionById = (id) =>
  prisma.book.findUnique({
    where: { id },
    select: printOptionBookSelect,
  });

const findMaterialForPrintOptionById = (id) =>
  prisma.material.findUnique({
    where: { id },
    select: printOptionMaterialSelect,
  });

const findBookPrintPricing = (bookId) =>
  prisma.bookPricing.findUnique({
    where: {
      bookId_accessType: {
        bookId,
        accessType: 'PRINT',
      },
    },
  });

const findMaterialPrintPricing = (materialId) =>
  prisma.materialPricing.findUnique({
    where: {
      materialId_accessType: {
        materialId,
        accessType: 'PRINT',
      },
    },
  });

const findBooksForPrintAssignment = (ids) =>
  prisma.book.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      title: true,
      fileUrl: true,
    },
  });

const findMaterialsForPrintAssignment = (ids) =>
  prisma.material.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      title: true,
      fileUrl: true,
    },
  });

module.exports = {
  findBooksForOrderItems,
  findMaterialsForOrderItems,
  findProductsForOrderItems,
  findBookBasicById,
  findMaterialBasicById,
  findBookForPrintOptionById,
  findMaterialForPrintOptionById,
  findBookPrintPricing,
  findMaterialPrintPricing,
  findBooksForPrintAssignment,
  findMaterialsForPrintAssignment,
};
