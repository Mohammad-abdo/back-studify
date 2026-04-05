/**
 * User Controller
 * Handles user-related HTTP requests
 */

const userService = require('../services/userService');
const { sendSuccess } = require('../utils/response');

const getProfile = async (req, res, next) => {
  try {
    const user = await userService.getProfile({
      userId: req.userId,
    });

    sendSuccess(res, user, 'Profile retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const user = await userService.updateProfile({
      userId: req.userId,
      ...req.body,
    });

    sendSuccess(res, user, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
};

const updateStudentProfile = async (req, res, next) => {
  try {
    const student = await userService.updateStudentProfile({
      userId: req.userId,
      ...req.body,
    });

    sendSuccess(res, student, 'Student profile updated successfully');
  } catch (error) {
    next(error);
  }
};

const updateDoctorProfile = async (req, res, next) => {
  try {
    const doctor = await userService.updateDoctorProfile({
      userId: req.userId,
      ...req.body,
    });

    sendSuccess(res, doctor, 'Doctor profile updated successfully');
  } catch (error) {
    next(error);
  }
};

const uploadProfileImage = async (req, res, next) => {
  try {
    const user = await userService.uploadProfileImage({
      userId: req.userId,
      file: req.file,
    });

    sendSuccess(res, user, 'Profile image uploaded successfully');
  } catch (error) {
    next(error);
  }
};

const deleteAccount = async (req, res, next) => {
  try {
    await userService.deleteAccount({
      userId: req.userId,
    });

    sendSuccess(res, null, 'Account deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  updateStudentProfile,
  updateDoctorProfile,
  uploadProfileImage,
  deleteAccount,
};
