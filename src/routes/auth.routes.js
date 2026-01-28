/**
 * Auth Routes
 * 
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication and identity management
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

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone, password, type]
 *             properties:
 *               phone: { type: string, example: "+201234567890" }
 *               password: { type: string, example: "Password123!" }
 *               type: { type: string, enum: [STUDENT, DOCTOR, DELIVERY, CUSTOMER] }
 *               email: { type: string, example: "user@example.com" }
 *               name: { type: string, example: "John Doe" }
 *               collegeId: { type: string, format: uuid }
 *               departmentId: { type: string, format: uuid }
 *     responses:
 *       201:
 *         description: User registered, OTP sent
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Success' }
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post('/register', authLimiter, validateBody(registerSchema), authController.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login to obtain access token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone, password]
 *             properties:
 *               phone: { type: string, example: "+201234567890" }
 *               password: { type: string, example: "Password123!" }
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     token: { type: string, example: "eyJhbG..." }
 *                     user: { $ref: '#/components/schemas/User' }
 */
router.post('/login', authLimiter, validateBody(loginSchema), authController.login);

/**
 * @swagger
 * /auth/delivery/login:
 *   post:
 *     summary: Specialized login for delivery personnel
 *     tags: [Auth]
 *     description: Returns additional nested data like wallet and delivery profile
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone, password]
 *             properties:
 *               phone: { type: string, example: "+201234567890" }
 *               password: { type: string, example: "Password123!" }
 *     responses:
 *       200:
 *         description: Login successful
 */
router.post('/delivery/login', authLimiter, validateBody(loginSchema), authController.deliveryLogin);

/**
 * @swagger
 * /auth/verify-otp:
 *   post:
 *     summary: Verify OTP code after registration or password reset
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, code]
 *             properties:
 *               userId: { type: string, format: uuid }
 *               code: { type: string, example: "1234" }
 *     responses:
 *       200:
 *         description: Verified successfully
 */
router.post('/verify-otp', otpLimiter, validateBody(verifyOTPSchema), authController.verifyOTP);

/**
 * @swagger
 * /auth/resend-otp:
 *   post:
 *     summary: Resend OTP code
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId]
 *             properties:
 *               userId: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: OTP sent
 */
router.post('/resend-otp', otpLimiter, validateBody(resendOTPSchema), authController.resendOTP);

/**
 * @swagger
 * /auth/profile:
 *   get:
 *     summary: Get current user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/User' }
 */
router.get('/profile', authenticate, authController.getProfile);

module.exports = router;
