/**
 * Auth Controller
 * Handles authentication-related HTTP requests
 */

const authService = require('../services/auth.service');
const { sendSuccess, sendError } = require('../utils/response');
const { HTTP_STATUS } = require('../utils/constants');

/**
 * Register new user
 */
const register = async (req, res, next) => {
  try {
    const { phone, password, type, email, name, nameAr, nameEn, collegeId, departmentId } = req.body;

    // Use nameEn if provided, otherwise name, otherwise nameAr
    const finalName = nameEn || name || nameAr || '';

    const user = await authService.register(phone, password, type, email, finalName, collegeId, departmentId);

    sendSuccess(res, user, 'Registration successful. Please verify your OTP.', HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 */
const login = async (req, res, next) => {
  try {
    const { phone, password } = req.body;

    const result = await authService.login(phone, password);

    sendSuccess(res, result, 'Login successful');
  } catch (error) {
    next(error);
  }
};

/**
 * Verify OTP
 */
const verifyOTP = async (req, res, next) => {
  try {
    const { userId, code } = req.body;

    await authService.verifyOTP(userId, code);

    sendSuccess(res, null, 'OTP verified successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Resend OTP
 */
const resendOTP = async (req, res, next) => {
  try {
    const { userId } = req.body;

    await authService.resendOTP(userId);

    sendSuccess(res, null, 'OTP sent successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Forgot password
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { phone } = req.body;

    const result = await authService.forgotPassword(phone);

    sendSuccess(res, result, result.message || 'OTP sent to your phone');
  } catch (error) {
    next(error);
  }
};

/**
 * Reset password
 */
const resetPassword = async (req, res, next) => {
  try {
    const { userId, code, newPassword } = req.body;

    await authService.resetPassword(userId, code, newPassword);

    sendSuccess(res, null, 'Password reset successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Change password
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.userId;

    await authService.changePassword(userId, currentPassword, newPassword);

    sendSuccess(res, null, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user profile
 */
const getProfile = async (req, res, next) => {
  try {
    const user = req.user;

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    // Extract name and username from related profile
    let name = null;
    let username = null;
    if (user.student) {
      name = user.student?.name;
      username = user.student?.name;
    } else if (user.doctor) {
      name = user.doctor?.name;
      username = user.doctor?.name;
    } else if (user.delivery) {
      name = user.delivery?.name;
      username = user.delivery?.name;
    } else if (user.customer) {
      name = user.customer?.contactPerson || user.customer?.entityName;
      username = user.customer?.contactPerson || user.customer?.entityName;
    }

    // Add name and username to user object
    const userWithProfile = {
      ...userWithoutPassword,
      name,
      username,
    };

    sendSuccess(res, userWithProfile, 'Profile retrieved successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  verifyOTP,
  resendOTP,
  forgotPassword,
  resetPassword,
  changePassword,
  getProfile,
};

