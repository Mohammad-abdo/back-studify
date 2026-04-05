/**
 * Onboarding Controller
 * Handles onboarding-related HTTP requests (Admin only)
 */

const onboardingService = require('../services/onboardingService');
const { sendSuccess } = require('../utils/response');

const getOnboardingItems = async (req, res, next) => {
  try {
    const items = await onboardingService.getOnboardingItems();
    sendSuccess(res, items, 'Onboarding items retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getOnboardingItemById = async (req, res, next) => {
  try {
    const item = await onboardingService.getOnboardingItemById({
      id: req.params.id,
    });

    sendSuccess(res, item, 'Onboarding item retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const createOnboardingItem = async (req, res, next) => {
  try {
    const item = await onboardingService.createOnboardingItem(req.body);
    sendSuccess(res, item, 'Onboarding item created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const updateOnboardingItem = async (req, res, next) => {
  try {
    const item = await onboardingService.updateOnboardingItem({
      id: req.params.id,
      ...req.body,
    });

    sendSuccess(res, item, 'Onboarding item updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteOnboardingItem = async (req, res, next) => {
  try {
    await onboardingService.deleteOnboardingItem({
      id: req.params.id,
    });

    sendSuccess(res, null, 'Onboarding item deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOnboardingItems,
  getOnboardingItemById,
  createOnboardingItem,
  updateOnboardingItem,
  deleteOnboardingItem,
};
