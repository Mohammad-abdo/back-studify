const prisma = require('../config/database');

const findProductPricings = ({ where, skip, take }) =>
  prisma.productPricing.findMany({
    where,
    skip,
    take,
    include: {
      product: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: [
      { productId: 'asc' },
      { minQuantity: 'asc' },
    ],
  });

const countProductPricings = (where) =>
  prisma.productPricing.count({ where });

const findProductPricingById = (id) =>
  prisma.productPricing.findUnique({
    where: { id },
    include: {
      product: true,
    },
  });

const findProductPricingBasicById = (id) =>
  prisma.productPricing.findUnique({
    where: { id },
  });

const createProductPricing = (data) =>
  prisma.productPricing.create({
    data,
    include: {
      product: true,
    },
  });

const updateProductPricing = (id, data) =>
  prisma.productPricing.update({
    where: { id },
    data,
    include: {
      product: true,
    },
  });

const deleteProductPricing = (id) =>
  prisma.productPricing.delete({
    where: { id },
  });

module.exports = {
  findProductPricings,
  countProductPricings,
  findProductPricingById,
  findProductPricingBasicById,
  createProductPricing,
  updateProductPricing,
  deleteProductPricing,
};
