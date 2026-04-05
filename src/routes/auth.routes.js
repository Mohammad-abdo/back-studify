/**
 * Auth Routes
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { validateBody } = require('../middleware/validation.middleware');
const authenticate = require('../middleware/auth.middleware');
const { authLimiter, otpLimiter } = require('../middleware/rateLimit.middleware');
const {
  loginSchema,
  registerSchema,
  verifyOTPSchema,
  resendOTPSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} = require('../utils/validators');

router.post('/register', authLimiter, validateBody(registerSchema), authController.register);
router.post('/login', authLimiter, validateBody(loginSchema), authController.login);
router.post('/delivery/login', authLimiter, validateBody(loginSchema), authController.deliveryLogin);
router.post('/verify-otp', otpLimiter, validateBody(verifyOTPSchema), authController.verifyOTP);
router.post('/resend-otp', otpLimiter, validateBody(resendOTPSchema), authController.resendOTP);
router.get('/profile', authenticate, authController.getProfile);

module.exports = router;
