const prisma = require('../config/database');

const findOnboardingItems = () =>
  prisma.onboarding.findMany({
    orderBy: { order: 'asc' },
  });

const findOnboardingItemById = (id) =>
  prisma.onboarding.findUnique({
    where: { id },
  });

const createOnboardingItem = (data) =>
  prisma.onboarding.create({
    data,
  });

const updateOnboardingItem = (id, data) =>
  prisma.onboarding.update({
    where: { id },
    data,
  });

const deleteOnboardingItem = (id) =>
  prisma.onboarding.delete({
    where: { id },
  });

module.exports = {
  findOnboardingItems,
  findOnboardingItemById,
  createOnboardingItem,
  updateOnboardingItem,
  deleteOnboardingItem,
};
