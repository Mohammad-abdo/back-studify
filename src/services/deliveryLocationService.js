const deliveryLocationRepository = require('../repositories/deliveryLocationRepository');
const { buildPagination, getPaginationParams } = require('../utils/response');
const { NotFoundError } = require('../utils/errors');

const getDeliveryLocations = async ({ page, limit, deliveryId, startDate, endDate, order }) => {
  const paginationParams = getPaginationParams(page, limit);
  const orderDirection = order === 'asc' ? 'asc' : 'desc';
  const where = {
    ...(deliveryId && { deliveryId }),
    ...(startDate || endDate
      ? {
          createdAt: {
            ...(startDate && { gte: new Date(startDate) }),
            ...(endDate && { lte: new Date(endDate) }),
          },
        }
      : {}),
  };

  const [locations, total] = await Promise.all([
    deliveryLocationRepository.findDeliveryLocations({
      where,
      skip: paginationParams.skip,
      take: paginationParams.limit,
      orderDirection,
    }),
    deliveryLocationRepository.countDeliveryLocations(where),
  ]);

  return {
    data: locations,
    pagination: buildPagination(paginationParams.page, paginationParams.limit, total),
  };
};

const getDeliveryLocationById = async ({ id }) => {
  const location = await deliveryLocationRepository.findDeliveryLocationByIdWithDetails(id);

  if (!location) {
    throw new NotFoundError('Delivery location not found');
  }

  return location;
};

const deleteDeliveryLocation = async ({ id }) => {
  const existingLocation = await deliveryLocationRepository.findDeliveryLocationById(id);

  if (!existingLocation) {
    throw new NotFoundError('Delivery location not found');
  }

  await deliveryLocationRepository.deleteDeliveryLocation(id);
};

module.exports = {
  getDeliveryLocations,
  getDeliveryLocationById,
  deleteDeliveryLocation,
};
