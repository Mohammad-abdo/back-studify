/**
 * User Controller
 * Handles user-related HTTP requests
 */

const prisma = require('../config/database');
const { sendSuccess, sendPaginated, getPaginationParams, buildPagination } = require('../utils/response');
const { NotFoundError } = require('../utils/errors');
const { getFileUrl } = require('../services/fileUpload.service');

/**
 * Get user profile
 */
const getProfile = async (req, res, next) => {
  try {
    const userId = req.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        student: {
          include: {
            college: true,
            department: true,
          },
        },
        doctor: true,
        delivery: {
          include: {
            wallet: true,
          },
        },
        customer: true,
        admin: true,
        userRoles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    // Extract name and username from related profile
    let name = null;
    let username = null;
    if (user.student) {
      name = user.student.name;
      username = user.student.name;
    } else if (user.doctor) {
      name = user.doctor.name;
      username = user.doctor.name;
    } else if (user.delivery) {
      name = user.delivery.name;
      username = user.delivery.name;
    } else if (user.customer) {
      name = user.customer.contactPerson || user.customer.entityName;
      username = user.customer.contactPerson || user.customer.entityName;
    }

    // Build response object, excluding null profile fields
    const responseData = {
      ...userWithoutPassword,
      name,
      username,
      userRole: user.type, // Add userRole as the user type
      // Add boolean flags for user types
      isStudent: user.type === 'STUDENT',
      isDoctor: user.type === 'DOCTOR',
      isDelivery: user.type === 'DELIVERY',
      isCustomer: user.type === 'CUSTOMER',
      isAdmin: user.type === 'ADMIN',
    };

    // Remove null profile fields
    if (!user.student) delete responseData.student;
    if (!user.doctor) delete responseData.doctor;
    if (!user.delivery) delete responseData.delivery;
    if (!user.customer) delete responseData.customer;
    if (!user.admin) delete responseData.admin;

    sendSuccess(res, responseData, 'Profile retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Update user profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { email, avatarUrl } = req.body;

    const updateData = {};
    if (email !== undefined) updateData.email = email;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        phone: true,
        email: true,
        avatarUrl: true,
        type: true,
        isActive: true,
        createdAt: true,
      },
    });

    sendSuccess(res, user, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Update student profile
 */
const updateStudentProfile = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { name, collegeId, departmentId } = req.body;

    // Check if user is a student
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { student: true },
    });

    if (!user || user.type !== 'STUDENT') {
      throw new NotFoundError('Student profile not found');
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (collegeId !== undefined) updateData.collegeId = collegeId;
    if (departmentId !== undefined) updateData.departmentId = departmentId;

    const student = await prisma.student.update({
      where: { userId },
      data: updateData,
      include: {
        college: true,
        department: true,
      },
    });

    sendSuccess(res, student, 'Student profile updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Update doctor profile
 */
const updateDoctorProfile = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { name, specialization } = req.body;

    // Check if user is a doctor
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { doctor: true },
    });

    if (!user || user.type !== 'DOCTOR') {
      throw new NotFoundError('Doctor profile not found');
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (specialization !== undefined) updateData.specialization = specialization;

    const doctor = await prisma.doctor.update({
      where: { userId },
      data: updateData,
    });

    sendSuccess(res, doctor, 'Doctor profile updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Upload profile image
 */
const uploadProfileImage = async (req, res, next) => {
  try {
    const userId = req.userId;

    if (!req.file) {
      return sendError(res, 'No file uploaded', 400);
    }

    const avatarUrl = getFileUrl(req.file.filename);

    const user = await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
      select: {
        id: true,
        phone: true,
        email: true,
        avatarUrl: true,
        type: true,
      },
    });

    sendSuccess(res, user, 'Profile image uploaded successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete user account
 */
const deleteAccount = async (req, res, next) => {
  try {
    const userId = req.userId;

    // Hard delete user (cascade will remove related data)
    await prisma.user.delete({
      where: { id: userId },
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


