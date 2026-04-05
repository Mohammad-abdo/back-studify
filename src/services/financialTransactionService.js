const financialTransactionRepository = require('../repositories/financialTransactionRepository');
const { buildPagination, getPaginationParams } = require('../utils/response');
const { NotFoundError } = require('../utils/errors');

const getFinancialTransactions = async ({ page, limit, type, status, deliveryId, orderId, startDate, endDate }) => {
  const paginationParams = getPaginationParams(page, limit);
  const where = {
    ...(type && { type }),
    ...(status && { status }),
    ...(deliveryId && { deliveryId }),
    ...(orderId && { orderId }),
    ...(startDate || endDate
      ? {
          createdAt: {
            ...(startDate && { gte: new Date(startDate) }),
            ...(endDate && { lte: new Date(endDate) }),
          },
        }
      : {}),
  };

  const [transactions, total] = await Promise.all([
    financialTransactionRepository.findFinancialTransactions({
      where,
      skip: paginationParams.skip,
      take: paginationParams.limit,
    }),
    financialTransactionRepository.countFinancialTransactions(where),
  ]);

  return {
    data: transactions,
    pagination: buildPagination(paginationParams.page, paginationParams.limit, total),
  };
};

const getFinancialTransactionById = async ({ id }) => {
  const transaction = await financialTransactionRepository.findFinancialTransactionById(id);

  if (!transaction) {
    throw new NotFoundError('Financial transaction not found');
  }

  return transaction;
};

const createFinancialTransaction = ({ type, amount, status, description, deliveryId, orderId, metadata }) =>
  financialTransactionRepository.createFinancialTransaction({
    type,
    amount,
    status: status || 'PENDING',
    description,
    deliveryId: deliveryId || null,
    orderId: orderId || null,
    metadata: metadata || null,
  });

const updateFinancialTransaction = async ({ id, status, description, metadata }) => {
  const existingTransaction = await financialTransactionRepository.findFinancialTransactionBasicById(id);

  if (!existingTransaction) {
    throw new NotFoundError('Financial transaction not found');
  }

  const updateData = {};
  if (status !== undefined) {
    updateData.status = status;
    if (status === 'COMPLETED' && !existingTransaction.completedAt) {
      updateData.completedAt = new Date();
    }
  }
  if (description !== undefined) updateData.description = description;
  if (metadata !== undefined) updateData.metadata = metadata;

  return financialTransactionRepository.updateFinancialTransaction(id, updateData);
};

const deleteFinancialTransaction = async ({ id }) => {
  const existingTransaction = await financialTransactionRepository.findFinancialTransactionBasicById(id);

  if (!existingTransaction) {
    throw new NotFoundError('Financial transaction not found');
  }

  await financialTransactionRepository.deleteFinancialTransaction(id);
};

module.exports = {
  getFinancialTransactions,
  getFinancialTransactionById,
  createFinancialTransaction,
  updateFinancialTransaction,
  deleteFinancialTransaction,
};
