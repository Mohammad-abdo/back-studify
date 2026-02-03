/**
 * Auth Service
 * Handles authentication and authorization logic
 */

const prisma = require('../config/database');
const { hashPassword, comparePassword, generateOTP, formatPhoneNumber } = require('../utils/helpers');
const { generateToken, generateRefreshToken, generateTokenPayload } = require('../utils/jwt');
const { sendOTPSMS } = require('./sms.service');
const { sendOTPEmail } = require('./email.service');
const { ConflictError, NotFoundError, InvalidCredentialsError, OTPExpiredError, OTPInvalidError, AuthorizationError } = require('../utils/errors');
const { APPROVAL_STATUS } = require('../utils/constants');
const config = require('../config/env');

/**
 * Register new user
 */
/**
 * Register: phone is unique globally (one phone = one user = one type). Same phone cannot be used for another type.
 */
const register = async (phone, password, type, email = null, name = null, collegeId = null, departmentId = null) => {
  const formattedPhone = formatPhoneNumber(phone);

  const existingUser = await prisma.user.findUnique({
    where: { phone: formattedPhone },
  });

  if (existingUser) {
    throw new ConflictError(
      'This phone number is already registered. Use the correct app to sign in (student, doctor, delivery, etc.). Phone is unique per account.'
    );
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
  if (type === 'STUDENT') {
    // Ensure name is not empty - use a default if all name fields are empty
    const finalName = (name && name.trim()) || '';
    
    await prisma.student.create({
      data: {
        userId: user.id,
        name: finalName,
        collegeId: collegeId || null,
        departmentId: departmentId || null,
      },
    });
  } else if (type === 'DOCTOR') {
    await prisma.doctor.create({
      data: {
        userId: user.id,
        name: name || '',
        specialization: '', // Will be updated later
        collegeId: collegeId || null,
        departmentId: departmentId || null,
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
  } else if (type === 'PRINT_CENTER' && name) {
    await prisma.printCenter.create({
      data: {
        userId: user.id,
        name,
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

  // Add name to user object for response
  const userWithName = {
    ...user,
    name: name || null,
  };

  return userWithName;
};

/**
 * Login user. Phone is unique: one phone + password = one user = one type. clientType ensures the app matches that type.
 * @param {string} phone - Unique per account (لا يتكرر)
 * @param {string} password
 * @param {string} [clientType] - If provided, only users of this type get a token (phone + password linked to type).
 */
const login = async (phone, password, clientType = null) => {
  const formattedPhone = formatPhoneNumber(phone);

  const user = await prisma.user.findUnique({
    where: { phone: formattedPhone },
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

  // حماية: رقم الهاتف والباسورد مرتبطان بنوع المستخدم — phone لا يتكرر (واحد = يوزر واحد = نوع واحد)
  if (clientType && user.type !== clientType) {
    throw new AuthorizationError(
      `This phone and password are registered as ${user.type}. Use the ${user.type} app. Phone and account type are linked.`
    );
  }

  // Generate tokens
  const payload = generateTokenPayload(user);
  const token = generateToken(payload);
  const refreshToken = generateRefreshToken(payload);

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
  } else if (user.printCenter) {
    name = user.printCenter.name;
    username = user.printCenter.name;
  }

  // Add name and username and role flags to user object
  const userWithProfile = {
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

  return {
    user: userWithProfile,
    token,
    refreshToken,
  };
};

/**
 * Specialized login for delivery personnel
 */
const deliveryLogin = async (phone, password) => {
  const formattedPhone = formatPhoneNumber(phone);

  const user = await prisma.user.findUnique({
    where: { phone: formattedPhone },
    include: {
      delivery: {
        include: {
          wallet: true,
        },
      },
    },
  });

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

  // Generate tokens
  const payload = generateTokenPayload(user);
  const token = generateToken(payload);
  const refreshToken = generateRefreshToken(payload);

  const delivery = user.delivery;
  if (!delivery) {
    throw new NotFoundError('Delivery profile not found');
  }

  // Structure the data exactly as requested
  const data = {
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
    token,
    refreshToken,
  };

  return data;
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
  deliveryLogin,
  verifyOTP,
  resendOTP,
  forgotPassword,
  resetPassword,
  changePassword,
};
