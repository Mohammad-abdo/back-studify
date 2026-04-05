const prisma = require('../config/database');

const financialTransactionListInclude = {
  delivery: {
    select: {
      id: true,
      name: true,
      user: {
        select: {
          phone: true,
        },
      },
    },
  },
};

const financialTransactionDetailInclude = {
  delivery: {
    include: {
      user: {
        select: {
          id: true,
          phone: true,
          email: true,
        },
      },
    },
  },
};

const financialTransactionWriteInclude = {
  delivery: {
    include: {
      user: {
        select: {
          phone: true,
        },
      },
    },
  },
};

const findFinancialTransactions = ({ where, skip, take }) =>
  prisma.financialTransaction.findMany({
    where,
    skip,
    take,
    include: financialTransactionListInclude,
    orderBy: { createdAt: 'desc' },
  });

const countFinancialTransactions = (where) =>
  prisma.financialTransaction.count({ where });

const findFinancialTransactionById = (id) =>
  prisma.financialTransaction.findUnique({
    where: { id },
    include: financialTransactionDetailInclude,
  });

const findFinancialTransactionBasicById = (id) =>
  prisma.financialTransaction.findUnique({
    where: { id },
  });

const createFinancialTransaction = (data) =>
  prisma.financialTransaction.create({
    data,
    include: financialTransactionWriteInclude,
  });

const updateFinancialTransaction = (id, data) =>
  prisma.financialTransaction.update({
    where: { id },
    data,
    include: financialTransactionWriteInclude,
  });

const deleteFinancialTransaction = (id) =>
  prisma.financialTransaction.delete({
    where: { id },
  });

module.exports = {
  findFinancialTransactions,
  countFinancialTransactions,
  findFinancialTransactionById,
  findFinancialTransactionBasicById,
  createFinancialTransaction,
  updateFinancialTransaction,
  deleteFinancialTransaction,
};
