const prisma = require('../config/database');

const fullUserInclude = {
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
};

const findUserProfileById = (id) =>
  prisma.user.findUnique({
    where: { id },
    include: fullUserInclude,
  });

const createStudentProfile = (data) =>
  prisma.student.create({
    data,
  });

const updateUserProfile = (id, data) =>
  prisma.user.update({
    where: { id },
    data,
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

const findUserWithStudentById = (id) =>
  prisma.user.findUnique({
    where: { id },
    include: { student: true },
  });

const updateStudentByUserId = (userId, data) =>
  prisma.student.update({
    where: { userId },
    data,
    include: {
      college: true,
      department: true,
    },
  });

const findUserWithDoctorById = (id) =>
  prisma.user.findUnique({
    where: { id },
    include: { doctor: true },
  });

const updateDoctorByUserId = (userId, data) =>
  prisma.doctor.update({
    where: { userId },
    data,
    include: {
      college: true,
      department: true,
    },
  });

const updateUserAvatar = (id, avatarUrl) =>
  prisma.user.update({
    where: { id },
    data: { avatarUrl },
    select: {
      id: true,
      phone: true,
      email: true,
      avatarUrl: true,
      type: true,
    },
  });

const deleteUser = (id) =>
  prisma.user.delete({
    where: { id },
  });

module.exports = {
  findUserProfileById,
  createStudentProfile,
  updateUserProfile,
  findUserWithStudentById,
  updateStudentByUserId,
  findUserWithDoctorById,
  updateDoctorByUserId,
  updateUserAvatar,
  deleteUser,
};
