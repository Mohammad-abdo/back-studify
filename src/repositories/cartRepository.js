const prisma = require('../config/database');

const findCartByUserId = (userId) =>
  prisma.cart.findUnique({
    where: { userId },
    include: {
      items: true,
    },
  });

const createCart = (userId) =>
  prisma.cart.create({
    data: { userId },
    include: {
      items: true,
    },
  });

const findBookReference = (id) =>
  prisma.book.findUnique({
    where: { id },
    include: {
      category: true,
      doctor: {
        include: {
          user: {
            select: {
              id: true,
              phone: true,
              avatarUrl: true,
            },
          },
        },
      },
      pricing: true,
    },
  });

const findProductReference = (id) =>
  prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      pricing: true,
    },
  });

const findMaterialReference = (id) =>
  prisma.material.findUnique({
    where: { id },
    include: {
      category: true,
      doctor: {
        include: {
          user: {
            select: {
              id: true,
              phone: true,
              avatarUrl: true,
            },
          },
        },
      },
      pricing: true,
    },
  });

const findPrintOptionReference = (id) =>
  prisma.printOption.findUnique({
    where: { id },
    include: {
      book: {
        include: {
          category: true,
          doctor: {
            include: {
              user: {
                select: {
                  id: true,
                  phone: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      },
    },
  });

const findCartItemByComposite = ({ cartId, referenceType, referenceId }) =>
  prisma.cartItem.findUnique({
    where: {
      cartId_referenceType_referenceId: {
        cartId,
        referenceType,
        referenceId,
      },
    },
  });

const createCartItem = (data) =>
  prisma.cartItem.create({ data });

const findCartItemById = (id) =>
  prisma.cartItem.findUnique({
    where: { id },
    include: {
      cart: true,
    },
  });

const updateCartItem = (id, data) =>
  prisma.cartItem.update({
    where: { id },
    data,
  });

const deleteCartItem = (id) =>
  prisma.cartItem.delete({
    where: { id },
  });

const deleteCartItemsByCartId = (cartId) =>
  prisma.cartItem.deleteMany({
    where: { cartId },
  });

module.exports = {
  findCartByUserId,
  createCart,
  findBookReference,
  findProductReference,
  findMaterialReference,
  findPrintOptionReference,
  findCartItemByComposite,
  createCartItem,
  findCartItemById,
  updateCartItem,
  deleteCartItem,
  deleteCartItemsByCartId,
};
