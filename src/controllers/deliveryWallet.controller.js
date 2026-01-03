/**
 * Delivery Wallet Controller
 * Handles delivery wallet-related HTTP requests (Admin only for CRUD)
 */

const prisma = require('../config/database');
const { sendSuccess, sendPaginated, getPaginationParams, buildPagination } = require('../utils/response');
const { NotFoundError } = require('../utils/errors');

/**
 * Get all delivery wallets
 */
const getDeliveryWallets = async (req, res, next) => {
  try {
    const { page, limit } = getPaginationParams(req.query.page, req.query.limit);
    const { deliveryId } = req.query;

    const where = {
      ...(deliveryId && { deliveryId }),
    };

    const [wallets, total] = await Promise.all([
      prisma.deliveryWallet.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
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
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.deliveryWallet.count({ where }),
    ]);

    const pagination = buildPagination(page, limit, total);
    sendPaginated(res, wallets, pagination, 'Delivery wallets retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get delivery wallet by ID
 */
const getDeliveryWalletById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const wallet = await prisma.deliveryWallet.findUnique({
      where: { id },
      include: {
        delivery: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!wallet) {
      throw new NotFoundError('Delivery wallet not found');
    }

    sendSuccess(res, wallet, 'Delivery wallet retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Update delivery wallet balance (Admin only)
 */
const updateDeliveryWallet = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { balance } = req.body;

    const existingWallet = await prisma.deliveryWallet.findUnique({
      where: { id },
    });

    if (!existingWallet) {
      throw new NotFoundError('Delivery wallet not found');
    }

    const wallet = await prisma.deliveryWallet.update({
      where: { id },
      data: {
        balance: balance !== undefined ? balance : existingWallet.balance,
      },
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

    sendSuccess(res, wallet, 'Delivery wallet updated successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDeliveryWallets,
  getDeliveryWalletById,
  updateDeliveryWallet,
};


