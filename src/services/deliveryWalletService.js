const deliveryWalletRepository = require('../repositories/deliveryWalletRepository');
const { buildPagination, getPaginationParams } = require('../utils/response');
const { NotFoundError } = require('../utils/errors');

const getDeliveryWallets = async ({ page, limit, deliveryId }) => {
  const paginationParams = getPaginationParams(page, limit);
  const where = {
    ...(deliveryId && { deliveryId }),
  };

  const [wallets, total] = await Promise.all([
    deliveryWalletRepository.findDeliveryWallets({
      where,
      skip: paginationParams.skip,
      take: paginationParams.limit,
    }),
    deliveryWalletRepository.countDeliveryWallets(where),
  ]);

  return {
    data: wallets,
    pagination: buildPagination(paginationParams.page, paginationParams.limit, total),
  };
};

const getDeliveryWalletById = async ({ id }) => {
  const wallet = await deliveryWalletRepository.findDeliveryWalletById(id);

  if (!wallet) {
    throw new NotFoundError('Delivery wallet not found');
  }

  return wallet;
};

const updateDeliveryWallet = async ({ id, balance }) => {
  const existingWallet = await deliveryWalletRepository.findDeliveryWalletBasicById(id);

  if (!existingWallet) {
    throw new NotFoundError('Delivery wallet not found');
  }

  return deliveryWalletRepository.updateDeliveryWallet(id, {
    balance: balance !== undefined ? balance : existingWallet.balance,
  });
};

module.exports = {
  getDeliveryWallets,
  getDeliveryWalletById,
  updateDeliveryWallet,
};
