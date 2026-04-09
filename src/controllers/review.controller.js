/**
 * Review Controller
 * Handles review-related HTTP requests
 */

const prisma = require('../config/database');
const { sendSuccess, sendPaginated, getPaginationParams, buildPagination } = require('../utils/response');
const { NotFoundError, ConflictError, AuthorizationError, ValidationError } = require('../utils/errors');
const { USER_TYPES } = require('../utils/constants');

/**
 * Institute users may only create/update reviews for products with isInstituteProduct true.
 */
const assertInstituteOwnsInstituteProductReview = async (review) => {
  if (review.targetType !== 'PRODUCT') {
    throw new AuthorizationError('Institute users can only manage reviews for institute products');
  }
  const product = await prisma.product.findUnique({
    where: { id: review.targetId },
    select: { isInstituteProduct: true },
  });
  if (!product || !product.isInstituteProduct) {
    throw new AuthorizationError('Institute users can only manage reviews for institute products');
  }
};

/**
 * Get reviews for a target (book or product)
 */
const getReviews = async (req, res, next) => {
  try {
    const { targetId, targetType } = req.query;
    const { page, limit } = getPaginationParams(req.query.page, req.query.limit);

    if (!targetId || !targetType) {
      throw new ValidationError('targetId and targetType are required');
    }

    const where = {
      targetId,
      targetType,
    };

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              phone: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.review.count({ where }),
    ]);

    const pagination = buildPagination(page, limit, total);

    sendPaginated(res, reviews, pagination, 'Reviews retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Create review
 * - STUDENT: books and retail products only (not institute-only products).
 * - INSTITUTE: institute products (PRODUCT + isInstituteProduct) only.
 */
const createReview = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { targetId, targetType, rating, comment } = req.body;

    const isStudent = req.userType === USER_TYPES.STUDENT;
    const isInstitute = req.userType === USER_TYPES.INSTITUTE;

    if (!isStudent && !isInstitute) {
      throw new AuthorizationError('Only students and institute users can create reviews');
    }

    if (isInstitute && targetType === 'BOOK') {
      throw new AuthorizationError('Institute users can only review institute products');
    }

    if (targetType === 'BOOK') {
      const book = await prisma.book.findUnique({
        where: { id: targetId },
      });

      if (!book) {
        throw new NotFoundError('Book not found');
      }
    } else if (targetType === 'PRODUCT') {
      const product = await prisma.product.findUnique({
        where: { id: targetId },
      });

      if (!product) {
        throw new NotFoundError('Product not found');
      }

      if (isInstitute) {
        if (!product.isInstituteProduct) {
          throw new AuthorizationError('Institute users can only review institute products');
        }
      } else if (isStudent && product.isInstituteProduct) {
        throw new AuthorizationError('Students cannot review institute products');
      }
    }

    // Check if review already exists
    const existingReview = await prisma.review.findUnique({
      where: {
        userId_targetId_targetType: {
          userId,
          targetId,
          targetType,
        },
      },
    });

    if (existingReview) {
      throw new ConflictError('You have already reviewed this item');
    }

    const review = await prisma.review.create({
      data: {
        userId,
        targetId,
        targetType,
        rating,
        comment: comment || null,
      },
      include: {
        user: {
          select: {
            id: true,
            phone: true,
            avatarUrl: true,
          },
        },
      },
    });

    sendSuccess(res, review, 'Review created successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Update review
 */
const updateReview = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { rating, comment } = req.body;

    const existingReview = await prisma.review.findUnique({
      where: { id },
    });

    if (!existingReview) {
      throw new NotFoundError('Review not found');
    }

    if (existingReview.userId !== userId) {
      throw new AuthorizationError('You can only update your own reviews');
    }

    if (req.userType === USER_TYPES.INSTITUTE) {
      await assertInstituteOwnsInstituteProductReview(existingReview);
    }

    const updateData = {};
    if (rating !== undefined) updateData.rating = rating;
    if (comment !== undefined) updateData.comment = comment;

    const review = await prisma.review.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            phone: true,
            avatarUrl: true,
          },
        },
      },
    });

    sendSuccess(res, review, 'Review updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete review
 */
const deleteReview = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const existingReview = await prisma.review.findUnique({
      where: { id },
    });

    if (!existingReview) {
      throw new NotFoundError('Review not found');
    }

    if (existingReview.userId !== userId && req.userType !== 'ADMIN') {
      throw new AuthorizationError('You can only delete your own reviews');
    }

    if (req.userType === USER_TYPES.INSTITUTE && existingReview.userId === userId) {
      await assertInstituteOwnsInstituteProductReview(existingReview);
    }

    await prisma.review.delete({
      where: { id },
    });

    sendSuccess(res, null, 'Review deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getReviews,
  createReview,
  updateReview,
  deleteReview,
};
