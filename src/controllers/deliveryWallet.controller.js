/**
 * Delivery Wallet Controller
 * Handles delivery wallet-related HTTP requests (Admin only for CRUD)
 */

const deliveryWalletService = require('../services/deliveryWalletService');
const { sendSuccess, sendPaginated } = require('../utils/response');

const getDeliveryWallets = async (req, res, next) => {
  try {
    const result = await deliveryWalletService.getDeliveryWallets(req.query);
    sendPaginated(res, result.data, result.pagination, 'Delivery wallets retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getDeliveryWalletById = async (req, res, next) => {
  try {
    const wallet = await deliveryWalletService.getDeliveryWalletById({
      id: req.params.id,
    });

    sendSuccess(res, wallet, 'Delivery wallet retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const updateDeliveryWallet = async (req, res, next) => {
  try {
    const wallet = await deliveryWalletService.updateDeliveryWallet({
      id: req.params.id,
      balance: req.body.balance,
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
