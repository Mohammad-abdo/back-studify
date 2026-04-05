/**
 * Customer Controller
 * Handles customer-related HTTP requests (Admin only)
 */

const customerService = require('../services/customerService');
const { sendSuccess, sendPaginated } = require('../utils/response');

const getCustomers = async (req, res, next) => {
  try {
    const result = await customerService.getCustomers(req.query);
    sendPaginated(res, result.data, result.pagination, 'Customers retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getCustomerById = async (req, res, next) => {
  try {
    const customer = await customerService.getCustomerById({
      id: req.params.id,
    });

    sendSuccess(res, customer, 'Customer retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const updateCustomer = async (req, res, next) => {
  try {
    const customer = await customerService.updateCustomer({
      id: req.params.id,
      ...req.body,
    });

    sendSuccess(res, customer, 'Customer updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteCustomer = async (req, res, next) => {
  try {
    await customerService.deleteCustomer({
      id: req.params.id,
    });

    sendSuccess(res, null, 'Customer deleted successfully', 204);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
};
