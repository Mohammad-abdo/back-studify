const authRepository = require('../repositories/authRepository');
const { hashPassword, comparePassword, generateOTP, formatPhoneNumber } = require('../utils/helpers');
const { generateToken, generateRefreshToken, generateTokenPayload } = require('../utils/jwt');
const { sendOTPSMS } = require('./sms.service');
const { sendOTPEmail } = require('./email.service');
const {
  ConflictError,
  NotFoundError,
  InvalidCredentialsError,
  OTPExpiredError,
  OTPInvalidError,
  AuthorizationError,
} = require('../utils/errors');
const config = require('../config/env');

const buildUserProfile = (user) => {
  const { password: _, ...userWithoutPassword } = user;

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
  } else if (user.printCenter) {
    name = user.printCenter.name;
    username = user.printCenter.name;
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
    isPrintCenter: user.type === 'PRINT_CENTER',
    printCenterId: user.printCenter?.id || null,
  };
};

const createAndSendOtp = async (userId, phone, email) => {
  const otpCode = generateOTP();
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + config.otpExpirationMinutes);

  await authRepository.createOtpVerification({
    userId,
    code: otpCode,
    expiresAt,
  });

  await sendOTPSMS(phone, otpCode);

  if (email) {
    try {
      await sendOTPEmail(email, otpCode);
    } catch (error) {
      console.error('Failed to send OTP email:', error);
    }
  }
};

const register = async ({ phone, password, type, email = null, name = null, nameAr = null, nameEn = null, collegeId = null, departmentId = null }) => {
  const formattedPhone = formatPhoneNumber(phone);
  const finalName = nameEn || name || nameAr || '';

  const existingUser = await authRepository.findUserByPhone(formattedPhone);
  if (existingUser) {
    throw new ConflictError(
      'This phone number is already registered. Use the correct app to sign in (student, doctor, delivery, etc.). Phone is unique per account.'
    );
  }

  if (email) {
    const existingEmail = await authRepository.findUserByEmail(email);
    if (existingEmail) {
      throw new ConflictError('Email already registered');
    }
  }

  const passwordHash = await hashPassword(password);
  const user = await authRepository.createUser({
    phone: formattedPhone,
    password: passwordHash,
    email: email || null,
    type,
  });

  if (type === 'STUDENT') {
    await authRepository.createStudentProfile({
      userId: user.id,
      name: (finalName && finalName.trim()) || '',
      collegeId: collegeId || null,
      departmentId: departmentId || null,
    });
  } else if (type === 'DOCTOR') {
    await authRepository.createDoctorProfile({
      userId: user.id,
      name: finalName || '',
      specialization: '',
      collegeId: collegeId || null,
      departmentId: departmentId || null,
    });
  } else if (type === 'DELIVERY' && finalName) {
    await authRepository.createDeliveryProfile({
      userId: user.id,
      name: finalName,
      vehicleType: '',
    });
  } else if (type === 'CUSTOMER' && finalName) {
    await authRepository.createCustomerProfile({
      userId: user.id,
      entityName: finalName,
      contactPerson: finalName,
      phone: formattedPhone,
    });
  } else if (type === 'PRINT_CENTER' && finalName) {
    await authRepository.createPrintCenterProfile({
      userId: user.id,
      name: finalName,
    });
  }

  await createAndSendOtp(user.id, formattedPhone, email);

  return {
    ...user,
    name: finalName || null,
  };
};

const login = async ({ phone, password, clientType = null }) => {
  const formattedPhone = formatPhoneNumber(phone);
  const user = await authRepository.findUserForLoginByPhone(formattedPhone);

  if (!user) {
    throw new InvalidCredentialsError('Invalid phone number or password');
  }

  if (!user.isActive) {
    throw new InvalidCredentialsError('Account is inactive. Please contact support.');
  }

  const isPasswordValid = await comparePassword(password, user.password);
  if (!isPasswordValid) {
    throw new InvalidCredentialsError('Invalid phone number or password');
  }

  if (clientType && user.type !== clientType) {
    throw new AuthorizationError(
      `This phone and password are registered as ${user.type}. Use the ${user.type} app. Phone and account type are linked.`
    );
  }

  const payload = generateTokenPayload(user);

  return {
    user: buildUserProfile(user),
    token: generateToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
};

const deliveryLogin = async ({ phone, password }) => {
  const formattedPhone = formatPhoneNumber(phone);
  const user = await authRepository.findUserForDeliveryLoginByPhone(formattedPhone);

  if (!user || user.type !== 'DELIVERY') {
    throw new InvalidCredentialsError('Invalid phone number or password');
  }

  if (!user.isActive) {
    throw new InvalidCredentialsError('Account is inactive. Please contact support.');
  }

  const isPasswordValid = await comparePassword(password, user.password);
  if (!isPasswordValid) {
    throw new InvalidCredentialsError('Invalid phone number or password');
  }

  const delivery = user.delivery;
  if (!delivery) {
    throw new NotFoundError('Delivery profile not found');
  }

  const payload = generateTokenPayload(user);

  return {
    id: delivery.id,
    userId: delivery.userId,
    name: delivery.name,
    vehicleType: delivery.vehicleType,
    vehiclePlateNumber: delivery.vehiclePlateNumber,
    status: delivery.status,
    createdAt: delivery.createdAt,
    user: {
      id: user.id,
      phone: user.phone,
      email: user.email,
      avatarUrl: user.avatarUrl,
    },
    wallet: delivery.wallet ? {
      id: delivery.wallet.id,
      deliveryId: delivery.wallet.deliveryId,
      balance: delivery.wallet.balance,
      updatedAt: delivery.wallet.updatedAt,
    } : null,
    token: generateToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
};

const verifyOTP = async ({ userId, code }) => {
  const otp = await authRepository.findLatestUnusedOtp(userId, code);

  if (!otp) {
    throw new OTPInvalidError('Invalid OTP code');
  }

  if (otp.expiresAt < new Date()) {
    throw new OTPExpiredError('OTP has expired');
  }

  await authRepository.markOtpUsed(otp.id);
  await authRepository.activateUser(userId);

  return { success: true };
};

const resendOTP = async ({ userId }) => {
  const user = await authRepository.findUserById(userId);

  if (!user) {
    throw new NotFoundError('User not found');
  }

  await createAndSendOtp(user.id, user.phone, user.email);

  return { success: true };
};

const forgotPassword = async ({ phone }) => {
  const formattedPhone = formatPhoneNumber(phone);
  const user = await authRepository.findUserByPhone(formattedPhone);

  if (!user) {
    return { success: true, message: 'If the phone number exists, an OTP will be sent' };
  }

  await createAndSendOtp(user.id, formattedPhone, user.email);

  return { success: true, userId: user.id };
};

const resetPassword = async ({ userId, code, newPassword }) => {
  await verifyOTP({ userId, code });
  const passwordHash = await hashPassword(newPassword);
  await authRepository.updateUserPassword(userId, passwordHash);
  return { success: true };
};

const changePassword = async ({ userId, currentPassword, newPassword }) => {
  const user = await authRepository.findUserById(userId);

  if (!user) {
    throw new NotFoundError('User not found');
  }

  const isPasswordValid = await comparePassword(currentPassword, user.password);
  if (!isPasswordValid) {
    throw new InvalidCredentialsError('Current password is incorrect');
  }

  const passwordHash = await hashPassword(newPassword);
  await authRepository.updateUserPassword(userId, passwordHash);
  return { success: true };
};

const getProfile = async ({ user }) => buildUserProfile(user);

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
