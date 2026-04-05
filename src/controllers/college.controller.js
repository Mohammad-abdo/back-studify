/**
 * College Controller
 * Handles college-related HTTP requests (Admin only)
 */

const collegeService = require('../services/collegeService');
const { sendSuccess, sendPaginated } = require('../utils/response');

const getColleges = async (req, res, next) => {
  try {
    const result = await collegeService.getColleges(req.query);
    sendPaginated(res, result.data, result.pagination, 'Colleges retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getCollegeById = async (req, res, next) => {
  try {
    const college = await collegeService.getCollegeById({
      id: req.params.id,
    });

    sendSuccess(res, college, 'College retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const createCollege = async (req, res, next) => {
  try {
    const college = await collegeService.createCollege(req.body);
    sendSuccess(res, college, 'College created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const updateCollege = async (req, res, next) => {
  try {
    const college = await collegeService.updateCollege({
      id: req.params.id,
      name: req.body.name,
    });

    sendSuccess(res, college, 'College updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteCollege = async (req, res, next) => {
  try {
    await collegeService.deleteCollege({
      id: req.params.id,
    });

    sendSuccess(res, null, 'College deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getColleges,
  getCollegeById,
  createCollege,
  updateCollege,
  deleteCollege,
};
