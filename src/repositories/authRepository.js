const prisma = require('../config/database');

const authUserInclude = {
  student: {
    include: {
      college: true,
      department: true,
    },
  },
  doctor: {
    include: {
      college: true,
      department: true,
    },
  },
  delivery: {
    include: {
      wallet: true,
    },
  },
  customer: true,
  admin: true,
  printCenter: true,
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

const findUserByPhone = (phone) =>
  prisma.user.findUnique({
    where: { phone },
  });

const findUserByEmail = (email) =>
  prisma.user.findUnique({
    where: { email },
  });

const createUser = (data) =>
  prisma.user.create({
    data,
    select: {
      id: true,
      phone: true,
      email: true,
      type: true,
      isActive: true,
      createdAt: true,
    },
  });

const createStudentProfile = (data) =>
  prisma.student.create({ data });

const createDoctorProfile = (data) =>
  prisma.doctor.create({ data });

const createDeliveryProfile = (data) =>
  prisma.delivery.create({ data });

const createCustomerProfile = (data) =>
  prisma.customer.create({ data });

const createPrintCenterProfile = (data) =>
  prisma.printCenter.create({ data });

const createOtpVerification = (data) =>
  prisma.oTPVerification.create({ data });

const findUserForLoginByPhone = (phone) =>
  prisma.user.findUnique({
    where: { phone },
    include: authUserInclude,
  });

const findUserForDeliveryLoginByPhone = (phone) =>
  prisma.user.findUnique({
    where: { phone },
    include: {
      delivery: {
        include: {
          wallet: true,
        },
      },
    },
  });

const findLatestUnusedOtp = (userId, code) =>
  prisma.oTPVerification.findFirst({
    where: {
      userId,
      code,
      isUsed: false,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

const markOtpUsed = (id) =>
  prisma.oTPVerification.update({
    where: { id },
    data: { isUsed: true },
  });

const activateUser = (userId) =>
  prisma.user.update({
    where: { id: userId },
    data: { isActive: true },
  });

const findUserById = (id) =>
  prisma.user.findUnique({
    where: { id },
  });

const updateUserPassword = (id, password) =>
  prisma.user.update({
    where: { id },
    data: { password },
  });

module.exports = {
  findUserByPhone,
  findUserByEmail,
  createUser,
  createStudentProfile,
  createDoctorProfile,
  createDeliveryProfile,
  createCustomerProfile,
  createPrintCenterProfile,
  createOtpVerification,
  findUserForLoginByPhone,
  findUserForDeliveryLoginByPhone,
  findLatestUnusedOtp,
  markOtpUsed,
  activateUser,
  findUserById,
  updateUserPassword,
};
