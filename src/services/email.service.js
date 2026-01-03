/**
 * Email Service
 * Handles sending emails using Nodemailer
 */

const nodemailer = require('nodemailer');
const config = require('../config/env');

// Create transporter (only if email config is provided)
let transporter = null;

if (config.emailHost && config.emailUser && config.emailPassword) {
  transporter = nodemailer.createTransport({
    host: config.emailHost,
    port: config.emailPort,
    secure: config.emailPort === 465, // true for 465, false for other ports
    auth: {
      user: config.emailUser,
      pass: config.emailPassword,
    },
  });
}

/**
 * Send email
 */
const sendEmail = async (to, subject, html, text = null) => {
  if (!transporter) {
    console.warn('Email service not configured. Email not sent.');
    return { success: false, message: 'Email service not configured' };
  }

  try {
    const mailOptions = {
      from: config.emailFrom,
      to,
      subject,
      html,
      ...(text && { text }),
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email service error:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

/**
 * Send OTP email
 */
const sendOTPEmail = async (to, otpCode) => {
  const subject = 'Your OTP Verification Code';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>OTP Verification Code</h2>
      <p>Your OTP code is:</p>
      <div style="background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
        ${otpCode}
      </div>
      <p>This code will expire in ${config.otpExpirationMinutes} minutes.</p>
      <p>If you didn't request this code, please ignore this email.</p>
    </div>
  `;

  return await sendEmail(to, subject, html);
};

/**
 * Send password reset email
 */
const sendPasswordResetEmail = async (to, resetToken, userId) => {
  const subject = 'Password Reset Request';
  const resetUrl = `${config.frontendUrl}/reset-password?token=${resetToken}&userId=${userId}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Password Reset Request</h2>
      <p>You requested to reset your password. Click the link below to reset it:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Reset Password
        </a>
      </div>
      <p>If you didn't request this, please ignore this email.</p>
      <p>This link will expire in 1 hour.</p>
    </div>
  `;

  return await sendEmail(to, subject, html);
};

/**
 * Send welcome email
 */
const sendWelcomeEmail = async (to, userName) => {
  const subject = 'Welcome to Studify!';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Welcome to Studify, ${userName}!</h2>
      <p>Thank you for joining Studify. We're excited to have you on board.</p>
      <p>Start exploring our courses and products today!</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${config.frontendUrl}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Get Started
        </a>
      </div>
    </div>
  `;

  return await sendEmail(to, subject, html);
};

/**
 * Verify email configuration
 */
const verifyConnection = async () => {
  if (!transporter) {
    return false;
  }

  try {
    await transporter.verify();
    return true;
  } catch (error) {
    console.error('Email service verification failed:', error);
    return false;
  }
};

module.exports = {
  sendEmail,
  sendOTPEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  verifyConnection,
};
