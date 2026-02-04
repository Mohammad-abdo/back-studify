/**
 * Mobile Routes Index
 * Aggregates all mobile-specific routes
 */

const express = require('express');
const router = express.Router();

const globalRoutes = require('./global.routes');
const studentRoutes = require('./student.routes');
const doctorRoutes = require('./doctor.routes');
const customerRoutes = require('./customer.routes');
const deliveryRoutes = require('./delivery.routes');
const printCenterRoutes = require('./printCenter.routes');
const sliderController = require('../../controllers/slider.controller');

// Public routes (no authentication required)
router.get('/sliders', sliderController.getSliders);

// Global: categories, colleges (faculties), departments, cart, supplies (products) — any authenticated user
router.use('/', globalRoutes);

router.use('/print-center', printCenterRoutes);
router.use('/student', studentRoutes);
router.use('/doctor', doctorRoutes);
router.use('/customer', customerRoutes);
router.use('/delivery', deliveryRoutes);

module.exports = router;

