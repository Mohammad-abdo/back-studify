/**
 * User Routes
 * 
 * @swagger
 * tags:
 *   name: Users
 *   description: Profile management and user-specific configurations
 */

const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const authenticate = require('../middleware/auth.middleware');
const { requireUserType } = require('../middleware/role.middleware');
const { validateBody } = require('../middleware/validation.middleware');
const { singleUpload } = require('../services/fileUpload.service');
const { updateProfileSchema, updateStudentSchema, updateDoctorSchema } = require('../utils/validators');

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /users/profile:
 *   get:
 *     summary: Get current authenticated user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile data
 */
router.get('/profile', userController.getProfile);

/**
 * @swagger
 * /users/profile:
 *   put:
 *     summary: Update common profile fields
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string, format: email }
 *               avatarUrl: { type: string, format: uri }
 *     responses:
 *       200:
 *         description: Profile updated
 */
router.put('/profile', validateBody(updateProfileSchema), userController.updateProfile);

/**
 * @swagger
 * /users/profile/image:
 *   post:
 *     summary: Upload profile avatar image
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file: { type: string, format: binary }
 *     responses:
 *       200:
 *         description: Image uploaded
 */
router.post('/profile/image', singleUpload('file'), userController.uploadProfileImage);

/**
 * @swagger
 * /users/profile:
 *   delete:
 *     summary: Delete user account
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       204:
 *         description: Account deleted
 */
router.delete('/profile', userController.deleteAccount);

/**
 * @swagger
 * /users/student/profile:
 *   put:
 *     summary: Update student-specific profile data
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Student profile updated
 */
router.put('/student/profile', requireUserType('STUDENT'), validateBody(updateStudentSchema), userController.updateStudentProfile);

/**
 * @swagger
 * /users/doctor/profile:
 *   put:
 *     summary: Update doctor-specific profile data
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Doctor profile updated
 */
router.put('/doctor/profile', requireUserType('DOCTOR'), validateBody(updateDoctorSchema), userController.updateDoctorProfile);

module.exports = router;
