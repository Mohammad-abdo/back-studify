const prisma = require('../config/database');

const reviewUserInclude = {
  user: {
    select: {
      id: true,
      phone: true,
      avatarUrl: true,
    },
  },
};

const findReviews = ({ where, skip, take }) =>
  prisma.review.findMany({
    where,
    skip,
    take,
    include: reviewUserInclude,
    orderBy: { createdAt: 'desc' },
  });

const countReviews = (where) =>
  prisma.review.count({ where });

const findReviewByUniqueKey = ({ userId, targetId, targetType }) =>
  prisma.review.findUnique({
    where: {
      userId_targetId_targetType: {
        userId,
        targetId,
        targetType,
      },
    },
  });

const createReview = (data) =>
  prisma.review.create({
    data,
    include: reviewUserInclude,
  });

const findReviewBasicById = (id) =>
  prisma.review.findUnique({
    where: { id },
  });

const updateReview = (id, data) =>
  prisma.review.update({
    where: { id },
    data,
    include: reviewUserInclude,
  });

const deleteReview = (id) =>
  prisma.review.delete({
    where: { id },
  });

module.exports = {
  findReviews,
  countReviews,
  findReviewByUniqueKey,
  createReview,
  findReviewBasicById,
  updateReview,
  deleteReview,
};
