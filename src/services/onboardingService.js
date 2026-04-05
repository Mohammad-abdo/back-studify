const onboardingRepository = require('../repositories/onboardingRepository');
const { NotFoundError } = require('../utils/errors');

const getOnboardingItems = async () =>
  onboardingRepository.findOnboardingItems();

const getOnboardingItemById = async ({ id }) => {
  const item = await onboardingRepository.findOnboardingItemById(id);

  if (!item) {
    throw new NotFoundError('Onboarding item not found');
  }

  return item;
};

const createOnboardingItem = ({ imageUrl, title, description, order }) =>
  onboardingRepository.createOnboardingItem({
    imageUrl,
    title,
    description,
    order: order || 0,
  });

const updateOnboardingItem = async ({ id, imageUrl, title, description, order }) => {
  const existingItem = await onboardingRepository.findOnboardingItemById(id);

  if (!existingItem) {
    throw new NotFoundError('Onboarding item not found');
  }

  const updateData = {};
  if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (order !== undefined) updateData.order = order;

  return onboardingRepository.updateOnboardingItem(id, updateData);
};

const deleteOnboardingItem = async ({ id }) => {
  const existingItem = await onboardingRepository.findOnboardingItemById(id);

  if (!existingItem) {
    throw new NotFoundError('Onboarding item not found');
  }

  await onboardingRepository.deleteOnboardingItem(id);
};

module.exports = {
  getOnboardingItems,
  getOnboardingItemById,
  createOnboardingItem,
  updateOnboardingItem,
  deleteOnboardingItem,
};
