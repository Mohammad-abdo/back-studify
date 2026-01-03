/**
 * Auth Service
 * Handles authentication and authorization logic
 */

const prisma = require('../config/database');
const { hashPassword, comparePassword, generateOTP, formatPhoneNumber } = require('../utils/helpers');
const { generateToken, generateRefreshToken, generateTokenPayload } = require('../utils/jwt');
const { sendOTPSMS } = require('./sms.service');
const { sendOTPEmail } = require('./email.service');
const { ConflictError, NotFoundError, InvalidCredentialsError, OTPExpiredError, OTPInvalidError } = require('../utils/errors');
const { APPROVAL_STATUS } = require('../utils/constants');
const config = require('../config/env');

/**
 * Register new user
 */
const register = async (phone, password, type, email = null, name = null) => {
  const formattedPhone = formatPhoneNumber(phone);

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { phone: formattedPhone },
  });

  if (existingUser) {
    throw new ConflictError('Phone number already registered');
  }

  // Check email if provided
  if (email) {
    const existingEmail = await prisma.user.findUnique({
      where: { email },
    });

    if (existingEmail) {
      throw new ConflictError('Email already registered');
    }
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create user
  const user = await prisma.user.create({
    data: {
      phone: formattedPhone,
      password: passwordHash,
      email: email || null,
      type,
    },
    select: {
      id: true,
      phone: true,
      email: true,
      type: true,
      isActive: true,
      createdAt: true,
    },
  });

  // Create user-specific profile based on type
  if (type === 'STUDENT' && name) {
    await prisma.student.create({
      data: {
        userId: user.id,
        name,
      },
    });
  } else if (type === 'DOCTOR' && name) {
    await prisma.doctor.create({
      data: {
        userId: user.id,
        name,
        specialization: '', // Will be updated later
      },
    });
  } else if (type === 'DELIVERY' && name) {
    await prisma.delivery.create({
      data: {
        userId: user.id,
        name,
        vehicleType: '', // Will be updated later
      },
    });
  } else if (type === 'CUSTOMER' && name) {
    await prisma.customer.create({
      data: {
        userId: user.id,
        entityName: name,
        contactPerson: name,
        phone: formattedPhone,
      },
    });
  }

  // Generate and send OTP
  const otpCode = generateOTP();
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + config.otpExpirationMinutes);

  await prisma.oTPVerification.create({
    data: {
      userId: user.id,
      code: otpCode,
      expiresAt,
    },
  });

  // Send OTP via SMS
  await sendOTPSMS(formattedPhone, otpCode);

  // Send OTP via Email if email provided
  if (email) {
    try {
      await sendOTPEmail(email, otpCode);
    } catch (error) {
      console.error('Failed to send OTP email:', error);
    }
  }

  return user;
};

/**
 * Login user
 */
const login = async (phone, password) => {
  const formattedPhone = formatPhoneNumber(phone);

  const user = await prisma.user.findUnique({
    where: { phone: formattedPhone },
    include: {
      student: true,
      doctor: true,
      delivery: true,
      customer: true,
      admin: true,
    },
  });

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

  // Generate tokens
  const payload = generateTokenPayload(user);
  const token = generateToken(payload);
  const refreshToken = generateRefreshToken(payload);

  // Remove password from response
  const { password: _, ...userWithoutPassword } = user;

  return {
    user: userWithoutPassword,
    token,
    refreshToken,
  };
};

/**
 * Verify OTP
 */
const verifyOTP = async (userId, code) => {
  const otp = await prisma.oTPVerification.findFirst({
    where: {
      userId,
      code,
      isUsed: false,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (!otp) {
    throw new OTPInvalidError('Invalid OTP code');
  }

  if (otp.expiresAt < new Date()) {
    throw new OTPExpiredError('OTP has expired');
  }

  // Mark OTP as used
  await prisma.oTPVerification.update({
    where: { id: otp.id },
    data: { isUsed: true },
  });

  // Activate user if not already active
  await prisma.user.update({
    where: { id: userId },
    data: { isActive: true },
  });

  return { success: true };
};

/**
 * Resend OTP
 */
const resendOTP = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Generate new OTP
  const otpCode = generateOTP();
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + config.otpExpirationMinutes);

  await prisma.oTPVerification.create({
    data: {
      userId: user.id,
      code: otpCode,
      expiresAt,
    },
  });

  // Send OTP via SMS
  await sendOTPSMS(user.phone, otpCode);

  // Send OTP via Email if email provided
  if (user.email) {
    try {
      await sendOTPEmail(user.email, otpCode);
    } catch (error) {
      console.error('Failed to send OTP email:', error);
    }
  }

  return { success: true };
};

/**
 * Forgot password
 */
const forgotPassword = async (phone) => {
  const formattedPhone = formatPhoneNumber(phone);

  const user = await prisma.user.findUnique({
    where: { phone: formattedPhone },
  });

  if (!user) {
    // Don't reveal if user exists for security
    return { success: true, message: 'If the phone number exists, an OTP will be sent' };
  }

  // Generate OTP
  const otpCode = generateOTP();
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + config.otpExpirationMinutes);

  await prisma.oTPVerification.create({
    data: {
      userId: user.id,
      code: otpCode,
      expiresAt,
    },
  });

  // Send OTP via SMS
  await sendOTPSMS(formattedPhone, otpCode);

  // Send OTP via Email if email provided
  if (user.email) {
    try {
      await sendOTPEmail(user.email, otpCode);
    } catch (error) {
      console.error('Failed to send OTP email:', error);
    }
  }

  return { success: true, userId: user.id };
};

/**
 * Reset password
 */
const resetPassword = async (userId, code, newPassword) => {
  // Verify OTP
  await verifyOTP(userId, code);

  // Hash new password
  const passwordHash = await hashPassword(newPassword);

  // Update password
  await prisma.user.update({
    where: { id: userId },
    data: { password: passwordHash },
  });

  return { success: true };
};

/**
 * Change password
 */
const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  const isPasswordValid = await comparePassword(currentPassword, user.password);

  if (!isPasswordValid) {
    throw new InvalidCredentialsError('Current password is incorrect');
  }

  const passwordHash = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: userId },
    data: { password: passwordHash },
  });

  return { success: true };
};

module.exports = {
  register,
  login,
  verifyOTP,
  resendOTP,
  forgotPassword,
  resetPassword,
  changePassword,
};
