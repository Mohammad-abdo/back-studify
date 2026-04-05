/**
 * Review Controller
 * Handles review-related HTTP requests
 */

const reviewService = require('../services/reviewService');
const { sendSuccess, sendPaginated } = require('../utils/response');

const getReviews = async (req, res, next) => {
  try {
    const result = await reviewService.getReviews(req.query);
    sendPaginated(res, result.data, result.pagination, 'Reviews retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const createReview = async (req, res, next) => {
  try {
    const review = await reviewService.createReview({
      userId: req.userId,
      userType: req.userType,
      ...req.body,
    });

    sendSuccess(res, review, 'Review created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const updateReview = async (req, res, next) => {
  try {
    const review = await reviewService.updateReview({
      id: req.params.id,
      userId: req.userId,
      ...req.body,
    });

    sendSuccess(res, review, 'Review updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteReview = async (req, res, next) => {
  try {
    await reviewService.deleteReview({
      id: req.params.id,
      userId: req.userId,
      userType: req.userType,
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
