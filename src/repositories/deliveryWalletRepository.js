const prisma = require('../config/database');

const deliveryWalletListInclude = {
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

const deliveryWalletDetailInclude = {
  delivery: {
    include: {
      user: true,
    },
  },
};

const findDeliveryWallets = ({ where, skip, take }) =>
  prisma.deliveryWallet.findMany({
    where,
    skip,
    take,
    include: deliveryWalletListInclude,
    orderBy: { updatedAt: 'desc' },
  });

const countDeliveryWallets = (where) =>
  prisma.deliveryWallet.count({ where });

const findDeliveryWalletById = (id) =>
  prisma.deliveryWallet.findUnique({
    where: { id },
    include: deliveryWalletDetailInclude,
  });

const findDeliveryWalletBasicById = (id) =>
  prisma.deliveryWallet.findUnique({
    where: { id },
  });

const updateDeliveryWallet = (id, data) =>
  prisma.deliveryWallet.update({
    where: { id },
    data,
    include: deliveryWalletListInclude,
  });

module.exports = {
  findDeliveryWallets,
  countDeliveryWallets,
  findDeliveryWalletById,
  findDeliveryWalletBasicById,
  updateDeliveryWallet,
};
