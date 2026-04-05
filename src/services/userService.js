const userRepository = require('../repositories/userRepository');
const { NotFoundError, ValidationError, BadRequestError } = require('../utils/errors');
const { getFileUrl } = require('./fileUpload.service');

const buildProfileResponse = (user) => {
  const { password: _password, ...userWithoutPassword } = user;

  let name = null;
  let username = null;
  if (user.student) {
    name = user.student.name || '';
    username = user.student.name || '';
  } else if (user.doctor) {
    name = user.doctor.name || '';
    username = user.doctor.name || '';
  } else if (user.delivery) {
    name = user.delivery.name || '';
    username = user.delivery.name || '';
  } else if (user.customer) {
    name = user.customer.contactPerson || user.customer.entityName || '';
    username = user.customer.contactPerson || user.customer.entityName || '';
  }

  return {
    ...userWithoutPassword,
    name,
    username,
    userRole: user.type,
    isStudent: user.type === 'STUDENT',
    isDoctor: user.type === 'DOCTOR',
    isDelivery: user.type === 'DELIVERY',
    isCustomer: user.type === 'CUSTOMER',
    isAdmin: user.type === 'ADMIN',
  };
};

const getProfile = async ({ userId }) => {
  let user = await userRepository.findUserProfileById(userId);

  if (!user) {
    throw new NotFoundError('User not found');
  }

  if (user.type === 'STUDENT' && !user.student) {
    await userRepository.createStudentProfile({
      userId: user.id,
      name: '',
    });

    user = await userRepository.findUserProfileById(user.id);
  }

  return buildProfileResponse(user);
};

const updateProfile = ({ userId, email, avatarUrl }) => {
  const updateData = {};
  if (email !== undefined) updateData.email = email;
  if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;

  return userRepository.updateUserProfile(userId, updateData);
};

const updateStudentProfile = async ({ userId, name, collegeId, departmentId }) => {
  const user = await userRepository.findUserWithStudentById(userId);

  if (!user || user.type !== 'STUDENT' || !user.student) {
    throw new NotFoundError('Student profile not found');
  }

  const updateData = {};
  if (name !== undefined) updateData.name = name;

  if (collegeId !== undefined && collegeId !== user.student.collegeId) {
    if (user.student.collegeUpdateCount >= 2) {
      throw new ValidationError('College can only be updated 2 times. This limit has been reached.');
    }
    updateData.collegeId = collegeId;
    updateData.collegeUpdateCount = user.student.collegeUpdateCount + 1;
  }

  if (departmentId !== undefined && departmentId !== user.student.departmentId) {
    if (user.student.departmentUpdateCount >= 2) {
      throw new ValidationError('Department can only be updated 2 times. This limit has been reached.');
    }
    updateData.departmentId = departmentId;
    updateData.departmentUpdateCount = user.student.departmentUpdateCount + 1;
  }

  return userRepository.updateStudentByUserId(userId, updateData);
};

const updateDoctorProfile = async ({ userId, name, specialization, collegeId, departmentId }) => {
  const user = await userRepository.findUserWithDoctorById(userId);

  if (!user || user.type !== 'DOCTOR') {
    throw new NotFoundError('Doctor profile not found');
  }

  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (specialization !== undefined) updateData.specialization = specialization;
  if (collegeId !== undefined) updateData.collegeId = collegeId;
  if (departmentId !== undefined) updateData.departmentId = departmentId;

  return userRepository.updateDoctorByUserId(userId, updateData);
};

const uploadProfileImage = async ({ userId, file }) => {
  if (!file) {
    throw new BadRequestError('No file uploaded');
  }

  return userRepository.updateUserAvatar(userId, getFileUrl(file.filename));
};

const deleteAccount = async ({ userId }) => {
  await userRepository.deleteUser(userId);
};

module.exports = {
  getProfile,
  updateProfile,
  updateStudentProfile,
  updateDoctorProfile,
  uploadProfileImage,
  deleteAccount,
};
