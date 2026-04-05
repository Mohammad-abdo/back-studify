/**
 * Delivery Location Controller
 * Handles delivery location-related HTTP requests (Admin only for viewing)
 */

const deliveryLocationService = require('../services/deliveryLocationService');
const { sendSuccess, sendPaginated } = require('../utils/response');

const getDeliveryLocations = async (req, res, next) => {
  try {
    const result = await deliveryLocationService.getDeliveryLocations(req.query);
    sendPaginated(res, result.data, result.pagination, 'Delivery locations retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getDeliveryLocationById = async (req, res, next) => {
  try {
    const location = await deliveryLocationService.getDeliveryLocationById({
      id: req.params.id,
    });

    sendSuccess(res, location, 'Delivery location retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const deleteDeliveryLocation = async (req, res, next) => {
  try {
    await deliveryLocationService.deleteDeliveryLocation({
      id: req.params.id,
    });

    sendSuccess(res, null, 'Delivery location deleted successfully', 204);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDeliveryLocations,
  getDeliveryLocationById,
  deleteDeliveryLocation,
};
