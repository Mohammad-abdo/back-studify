const reviewRepository = require('../repositories/reviewRepository');
const contentRepository = require('../repositories/contentRepository');
const { buildPagination, getPaginationParams } = require('../utils/response');
const { NotFoundError, ConflictError, AuthorizationError, ValidationError } = require('../utils/errors');

const getReviews = async ({ targetId, targetType, page, limit }) => {
  if (!targetId || !targetType) {
    throw new ValidationError('targetId and targetType are required');
  }

  const paginationParams = getPaginationParams(page, limit);
  const where = { targetId, targetType };

  const [reviews, total] = await Promise.all([
    reviewRepository.findReviews({
      where,
      skip: paginationParams.skip,
      take: paginationParams.limit,
    }),
    reviewRepository.countReviews(where),
  ]);

  return {
    data: reviews,
    pagination: buildPagination(paginationParams.page, paginationParams.limit, total),
  };
};

const createReview = async ({ userId, userType, targetId, targetType, rating, comment }) => {
  if (userType !== 'STUDENT') {
    throw new AuthorizationError('Only students can create reviews');
  }

  if (targetType === 'BOOK') {
    const book = await contentRepository.findBookBasicById(targetId);
    if (!book) {
      throw new NotFoundError('Book not found');
    }
  } else if (targetType === 'PRODUCT') {
    const product = await contentRepository.findProductsForOrderItems([targetId]);
    if (!product.length) {
      throw new NotFoundError('Product not found');
    }
  }

  const existingReview = await reviewRepository.findReviewByUniqueKey({
    userId,
    targetId,
    targetType,
  });

  if (existingReview) {
    throw new ConflictError('You have already reviewed this item');
  }

  return reviewRepository.createReview({
    userId,
    targetId,
    targetType,
    rating,
    comment: comment || null,
  });
};

const updateReview = async ({ id, userId, rating, comment }) => {
  const existingReview = await reviewRepository.findReviewBasicById(id);

  if (!existingReview) {
    throw new NotFoundError('Review not found');
  }

  if (existingReview.userId !== userId) {
    throw new AuthorizationError('You can only update your own reviews');
  }

  const updateData = {};
  if (rating !== undefined) updateData.rating = rating;
  if (comment !== undefined) updateData.comment = comment;

  return reviewRepository.updateReview(id, updateData);
};

const deleteReview = async ({ id, userId, userType }) => {
  const existingReview = await reviewRepository.findReviewBasicById(id);

  if (!existingReview) {
    throw new NotFoundError('Review not found');
  }

  if (existingReview.userId !== userId && userType !== 'ADMIN') {
    throw new AuthorizationError('You can only delete your own reviews');
  }

  await reviewRepository.deleteReview(id);
};

module.exports = {
  getReviews,
  createReview,
  updateReview,
  deleteReview,
};
