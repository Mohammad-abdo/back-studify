/**
 * Financial Transaction Controller
 * Handles financial transaction-related HTTP requests (Admin only)
 */

const financialTransactionService = require('../services/financialTransactionService');
const { sendSuccess, sendPaginated } = require('../utils/response');

const getFinancialTransactions = async (req, res, next) => {
  try {
    const result = await financialTransactionService.getFinancialTransactions(req.query);
    sendPaginated(res, result.data, result.pagination, 'Financial transactions retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getFinancialTransactionById = async (req, res, next) => {
  try {
    const transaction = await financialTransactionService.getFinancialTransactionById({
      id: req.params.id,
    });

    sendSuccess(res, transaction, 'Financial transaction retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const createFinancialTransaction = async (req, res, next) => {
  try {
    const transaction = await financialTransactionService.createFinancialTransaction(req.body);
    sendSuccess(res, transaction, 'Financial transaction created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const updateFinancialTransaction = async (req, res, next) => {
  try {
    const transaction = await financialTransactionService.updateFinancialTransaction({
      id: req.params.id,
      ...req.body,
    });

    sendSuccess(res, transaction, 'Financial transaction updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteFinancialTransaction = async (req, res, next) => {
  try {
    await financialTransactionService.deleteFinancialTransaction({
      id: req.params.id,
    });

    sendSuccess(res, null, 'Financial transaction deleted successfully', 204);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFinancialTransactions,
  getFinancialTransactionById,
  createFinancialTransaction,
  updateFinancialTransaction,
  deleteFinancialTransaction,
};
