/**
 * Onboarding Controller
 * Handles onboarding-related HTTP requests (Admin only)
 */

const prisma = require('../config/database');
const { sendSuccess, sendPaginated, getPaginationParams, buildPagination } = require('../utils/response');
const { NotFoundError } = require('../utils/errors');

/**
 * Get all onboarding items
 */
const getOnboardingItems = async (req, res, next) => {
  try {
    const items = await prisma.onboarding.findMany({
      orderBy: { order: 'asc' },
    });

    sendSuccess(res, items, 'Onboarding items retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get onboarding item by ID
 */
const getOnboardingItemById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const item = await prisma.onboarding.findUnique({
      where: { id },
    });

    if (!item) {
      throw new NotFoundError('Onboarding item not found');
    }

    sendSuccess(res, item, 'Onboarding item retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Create onboarding item (Admin only)
 */
const createOnboardingItem = async (req, res, next) => {
  try {
    const { imageUrl, title, description, order } = req.body;

    const item = await prisma.onboarding.create({
      data: {
        imageUrl,
        title,
        description,
        order: order || 0,
      },
    });

    sendSuccess(res, item, 'Onboarding item created successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Update onboarding item (Admin only)
 */
const updateOnboardingItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { imageUrl, title, description, order } = req.body;

    const existingItem = await prisma.onboarding.findUnique({
      where: { id },
    });

    if (!existingItem) {
      throw new NotFoundError('Onboarding item not found');
    }

    const updateData = {};
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (order !== undefined) updateData.order = order;

    const item = await prisma.onboarding.update({
      where: { id },
      data: updateData,
    });

    sendSuccess(res, item, 'Onboarding item updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete onboarding item (Admin only)
 */
const deleteOnboardingItem = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingItem = await prisma.onboarding.findUnique({
      where: { id },
    });

    if (!existingItem) {
      throw new NotFoundError('Onboarding item not found');
    }

    await prisma.onboarding.delete({
      where: { id },
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


