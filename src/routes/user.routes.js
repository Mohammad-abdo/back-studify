/**
 * User Routes
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

// Profile routes
router.get('/profile', userController.getProfile);
router.put('/profile', validateBody(updateProfileSchema), userController.updateProfile);
router.post('/profile/image', singleUpload('file'), userController.uploadProfileImage);

// Student profile routes
router.put('/student/profile', requireUserType('STUDENT'), validateBody(updateStudentSchema), userController.updateStudentProfile);

// Doctor profile routes
router.put('/doctor/profile', requireUserType('DOCTOR'), validateBody(updateDoctorSchema), userController.updateDoctorProfile);

module.exports = router;
