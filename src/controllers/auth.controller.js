/**
 * Auth Controller
 * Handles authentication-related HTTP requests
 */

const authService = require('../services/authService');
const { sendSuccess } = require('../utils/response');
const { HTTP_STATUS } = require('../utils/constants');

const register = async (req, res, next) => {
  try {
    const user = await authService.register(req.body);
    sendSuccess(res, user, 'Registration successful. Please verify your OTP.', HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    sendSuccess(res, result, 'Login successful');
  } catch (error) {
    next(error);
  }
};

const deliveryLogin = async (req, res, next) => {
  try {
    const result = await authService.deliveryLogin(req.body);
    sendSuccess(res, result, 'Profile retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const verifyOTP = async (req, res, next) => {
  try {
    await authService.verifyOTP(req.body);
    sendSuccess(res, null, 'OTP verified successfully');
  } catch (error) {
    next(error);
  }
};

const resendOTP = async (req, res, next) => {
  try {
    await authService.resendOTP(req.body);
    sendSuccess(res, null, 'OTP sent successfully');
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const result = await authService.forgotPassword(req.body);
    sendSuccess(res, result, result.message || 'OTP sent to your phone');
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    await authService.resetPassword(req.body);
    sendSuccess(res, null, 'Password reset successfully');
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    await authService.changePassword({
      userId: req.userId,
      currentPassword: req.body.currentPassword,
      newPassword: req.body.newPassword,
    });

    sendSuccess(res, null, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
};

const getProfile = async (req, res, next) => {
  try {
    const userProfile = await authService.getProfile({
      user: req.user,
    });

    sendSuccess(res, userProfile, 'Profile retrieved successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  deliveryLogin,
  verifyOTP,
  resendOTP,
  forgotPassword,
  resetPassword,
  changePassword,
  getProfile,
};
