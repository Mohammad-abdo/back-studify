/**
 * Mobile Routes Index
 * Aggregates all mobile-specific routes
 */

const express = require('express');
const router = express.Router();

const studentRoutes = require('./student.routes');
const doctorRoutes = require('./doctor.routes');
const customerRoutes = require('./customer.routes');
const deliveryRoutes = require('./delivery.routes');

router.use('/student', studentRoutes);
router.use('/doctor', doctorRoutes);
router.use('/customer', customerRoutes);
router.use('/delivery', deliveryRoutes);

module.exports = router;

