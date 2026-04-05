const prisma = require('../config/database');

const findDeliveryLocations = ({ where, skip, take, orderDirection }) =>
  prisma.deliveryLocation.findMany({
    where,
    skip,
    take,
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
    orderBy: { createdAt: orderDirection },
  });

const countDeliveryLocations = (where) =>
  prisma.deliveryLocation.count({ where });

const findDeliveryLocationByIdWithDetails = (id) =>
  prisma.deliveryLocation.findUnique({
    where: { id },
    include: {
      delivery: {
        include: {
          user: true,
        },
      },
    },
  });

const findDeliveryLocationById = (id) =>
  prisma.deliveryLocation.findUnique({
    where: { id },
  });

const deleteDeliveryLocation = (id) =>
  prisma.deliveryLocation.delete({
    where: { id },
  });

module.exports = {
  findDeliveryLocations,
  countDeliveryLocations,
  findDeliveryLocationByIdWithDetails,
  findDeliveryLocationById,
  deleteDeliveryLocation,
};
