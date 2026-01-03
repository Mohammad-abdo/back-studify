/**
 * SMS Service
 * Handles sending SMS using Twilio
 */

const twilio = require('twilio');
const config = require('../config/env');

// Initialize Twilio client
let twilioClient = null;

// Only initialize Twilio if credentials are provided and valid
if (
  config.twilioAccountSid &&
  config.twilioAuthToken &&
  config.twilioAccountSid.trim() !== '' &&
  config.twilioAuthToken.trim() !== '' &&
  config.twilioAccountSid.startsWith('AC')
) {
  try {
    twilioClient = twilio(config.twilioAccountSid, config.twilioAuthToken);
  } catch (error) {
    console.warn('Failed to initialize Twilio client:', error.message);
    twilioClient = null;
  }
}

/**
 * Send SMS
 */
const sendSMS = async (to, message) => {
  if (!twilioClient) {
    console.warn('Twilio not configured. SMS not sent.');
    return { success: false, message: 'SMS service not configured' };
  }

  try {
    const result = await twilioClient.messages.create({
      body: message,
      from: config.twilioPhoneNumber,
      to,
    });

    return {
      success: true,
      messageId: result.sid,
      status: result.status,
    };
  } catch (error) {
    console.error('SMS service error:', error);
    throw new Error(`Failed to send SMS: ${error.message}`);
  }
};

/**
 * Send OTP via SMS
 */
const sendOTPSMS = async (to, otpCode) => {
  const message = `Your Studify OTP code is: ${otpCode}. This code expires in ${config.otpExpirationMinutes} minutes. Do not share this code with anyone.`;
  return await sendSMS(to, message);
};

/**
 * Verify phone number
 */
const verifyPhoneNumber = async (phoneNumber, code) => {
  if (!twilioClient) {
    console.warn('Twilio not configured. Phone verification not available.');
    return { success: false, message: 'SMS service not configured' };
  }

  // This would require Twilio Verify service
  // For now, we'll use OTP stored in database
  return { success: true, verified: false };
};

module.exports = {
  sendSMS,
  sendOTPSMS,
  verifyPhoneNumber,
};
