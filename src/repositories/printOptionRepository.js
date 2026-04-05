const prisma = require('../config/database');

const printOptionListInclude = {
  book: {
    select: {
      id: true,
      title: true,
      totalPages: true,
    },
  },
  material: {
    select: {
      id: true,
      title: true,
      totalPages: true,
    },
  },
};

const printOptionDetailInclude = {
  book: {
    select: {
      id: true,
      title: true,
      totalPages: true,
      description: true,
    },
  },
  material: {
    select: {
      id: true,
      title: true,
      totalPages: true,
      description: true,
    },
  },
};

const findPrintOptions = ({ where, skip, take }) =>
  prisma.printOption.findMany({
    where,
    skip,
    take,
    include: printOptionListInclude,
    orderBy: { createdAt: 'desc' },
  });

const countPrintOptions = (where) =>
  prisma.printOption.count({ where });

const findPrintOptionById = (id) =>
  prisma.printOption.findUnique({
    where: { id },
    include: printOptionDetailInclude,
  });

const findPrintOptionBasicById = (id) =>
  prisma.printOption.findUnique({
    where: { id },
  });

const createPrintOption = (data, include = null) =>
  prisma.printOption.create({
    data,
    ...(include ? { include } : {}),
  });

const updatePrintOption = (id, data) =>
  prisma.printOption.update({
    where: { id },
    data,
    include: printOptionListInclude,
  });

const deletePrintOption = (id) =>
  prisma.printOption.delete({
    where: { id },
  });

module.exports = {
  findPrintOptions,
  countPrintOptions,
  findPrintOptionById,
  findPrintOptionBasicById,
  createPrintOption,
  updatePrintOption,
  deletePrintOption,
  printOptionListInclude,
};
