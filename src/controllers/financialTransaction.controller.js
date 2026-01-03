/**
 * Financial Transaction Controller
 * Handles financial transaction-related HTTP requests (Admin only)
 */

const prisma = require('../config/database');
const { sendSuccess, sendPaginated, getPaginationParams, buildPagination } = require('../utils/response');
const { NotFoundError } = require('../utils/errors');

/**
 * Get all financial transactions
 */
const getFinancialTransactions = async (req, res, next) => {
  try {
    const { page, limit } = getPaginationParams(req.query.page, req.query.limit);
    const { type, status, deliveryId, orderId, startDate, endDate } = req.query;

    const where = {
      ...(type && { type }),
      ...(status && { status }),
      ...(deliveryId && { deliveryId }),
      ...(orderId && { orderId }),
      ...(startDate || endDate ? {
        createdAt: {
          ...(startDate && { gte: new Date(startDate) }),
          ...(endDate && { lte: new Date(endDate) }),
        },
      } : {}),
    };

    const [transactions, total] = await Promise.all([
      prisma.financialTransaction.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
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
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.financialTransaction.count({ where }),
    ]);

    const pagination = buildPagination(page, limit, total);
    sendPaginated(res, transactions, pagination, 'Financial transactions retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get financial transaction by ID
 */
const getFinancialTransactionById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const transaction = await prisma.financialTransaction.findUnique({
      where: { id },
      include: {
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
      },
    });

    if (!transaction) {
      throw new NotFoundError('Financial transaction not found');
    }

    sendSuccess(res, transaction, 'Financial transaction retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Create financial transaction (Admin only)
 */
const createFinancialTransaction = async (req, res, next) => {
  try {
    const { type, amount, status, description, deliveryId, orderId, metadata } = req.body;

    const transaction = await prisma.financialTransaction.create({
      data: {
        type,
        amount,
        status: status || 'PENDING',
        description,
        deliveryId: deliveryId || null,
        orderId: orderId || null,
        metadata: metadata || null,
      },
      include: {
        delivery: {
          include: {
            user: {
              select: {
                phone: true,
              },
            },
          },
        },
      },
    });

    sendSuccess(res, transaction, 'Financial transaction created successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Update financial transaction (Admin only)
 */
const updateFinancialTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, description, metadata } = req.body;

    const existingTransaction = await prisma.financialTransaction.findUnique({
      where: { id },
    });

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

    const transaction = await prisma.financialTransaction.update({
      where: { id },
      data: updateData,
      include: {
        delivery: {
          include: {
            user: {
              select: {
                phone: true,
              },
            },
          },
        },
      },
    });

    sendSuccess(res, transaction, 'Financial transaction updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete financial transaction (Admin only)
 */
const deleteFinancialTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingTransaction = await prisma.financialTransaction.findUnique({
      where: { id },
    });

    if (!existingTransaction) {
      throw new NotFoundError('Financial transaction not found');
    }

    await prisma.financialTransaction.delete({
      where: { id },
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


