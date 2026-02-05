/**
 * Main Application Entry Point
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const config = require('./config/env');
const errorHandler = require('./middleware/error.middleware');
const { apiLimiter } = require('./middleware/rateLimit.middleware');
const { sendError } = require('./utils/response');
const { HTTP_STATUS } = require('./utils/constants');

// Initialize Express app
const app = express();

// CORS configuration – allow frontend origins (Vercel, localhost, etc.)
app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    optionsSuccessStatus: 204,
  })
);

// Serve uploaded files statically with CORS headers (BEFORE helmet to avoid conflicts)
app.use('/uploads', (req, res, next) => {
  // Set CORS headers for images
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  res.header('Cross-Origin-Embedder-Policy', 'unsafe-none');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
}, express.static(path.join(__dirname, '..', config.uploadDir), {
  setHeaders: (res, filePath) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
  }
}));

// Security middleware - configure helmet (after /uploads to avoid conflicts)
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false, // Disable to allow cross-origin images
    contentSecurityPolicy: false, // Disable CSP to fix image loading
  })
);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use('/api', apiLimiter);

// Health check routes
const healthRoutes = require('./routes/health.routes');
app.use('/health', healthRoutes);

// Documentation routes
const docsRoutes = require('./routes/docs.routes');
app.use('/api/docs', docsRoutes);

// API routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const bookRoutes = require('./routes/book.routes');
const materialRoutes = require('./routes/material.routes');
const productRoutes = require('./routes/product.routes');
const orderRoutes = require('./routes/order.routes');
const reviewRoutes = require('./routes/review.routes');
const adminRoutes = require('./routes/admin.routes');
const deliveryRoutes = require('./routes/delivery.routes');
const notificationRoutes = require('./routes/notification.routes');
const collegeRoutes = require('./routes/college.routes');
const departmentRoutes = require('./routes/department.routes');
const categoryRoutes = require('./routes/category.routes');
const wholesaleRoutes = require('./routes/wholesale.routes');
const uploadRoutes = require('./routes/upload.routes');
const onboardingRoutes = require('./routes/onboarding.routes');
const staticPageRoutes = require('./routes/staticPage.routes');
const roleRoutes = require('./routes/role.routes');
const permissionRoutes = require('./routes/permission.routes');
const userRoleRoutes = require('./routes/userRole.routes');
const studentRoutes = require('./routes/student.routes');
const doctorRoutes = require('./routes/doctor.routes');
const customerRoutes = require('./routes/customer.routes');
const bookPricingRoutes = require('./routes/bookPricing.routes');
const printOptionRoutes = require('./routes/printOption.routes');
const productPricingRoutes = require('./routes/productPricing.routes');
const authenticate = require('./middleware/auth.middleware');
const { requireUserType } = require('./middleware/role.middleware');
const { validateBody } = require('./middleware/validation.middleware');
const { singleUpload } = require('./services/fileUpload.service');
const printOptionController = require('./controllers/printOption.controller');
const { z } = require('zod');
const printCenterRoutes = require('./routes/printCenter.routes');
const printOrderAssignmentRoutes = require('./routes/printOrderAssignment.routes');
const financialTransactionRoutes = require('./routes/financialTransaction.routes');
const reportRoutes = require('./routes/report.routes');
const importLogRoutes = require('./routes/importLog.routes');
const deliveryAssignmentRoutes = require('./routes/deliveryAssignment.routes');
const deliveryWalletRoutes = require('./routes/deliveryWallet.routes');
const deliveryLocationRoutes = require('./routes/deliveryLocation.routes');
const dashboardMetricRoutes = require('./routes/dashboardMetric.routes');
const settingsRoutes = require('./routes/settings.routes');
const mobileRoutes = require('./routes/mobile');
const publicRoutes = require('./routes/public.routes');
const sliderRoutes = require('./routes/slider.routes');
const { validateQuery } = require('./middleware/validation.middleware');
const { paginationSchema } = require('./utils/validators');
const { transformImageUrlsMiddleware } = require('./middleware/imageUrl.middleware');

const initSocket = require('./socket');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/colleges', collegeRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/wholesale-orders', wholesaleRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/static-pages', staticPageRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/user-roles', userRoleRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/book-pricing', bookPricingRoutes);
// Explicit route so POST /api/print-options/upload is always reachable (avoids 404)
app.post(
  '/api/print-options/upload',
  authenticate,
  requireUserType('DOCTOR', 'ADMIN'),
  singleUpload('file'),
  validateBody(z.object({
    colorType: z.enum(['COLOR', 'BLACK_WHITE']),
    copies: z.coerce.number().int().positive(),
    paperType: z.enum(['A4', 'A3', 'LETTER']),
    doubleSide: z.coerce.boolean(),
    totalPages: z.coerce.number().int().positive().optional(),
  })),
  printOptionController.createPrintOptionWithUpload
);
app.use('/api/print-options', printOptionRoutes);
app.use('/api/product-pricing', productPricingRoutes);
app.use('/api/print-centers', printCenterRoutes);
app.use('/api/print-order-assignments', printOrderAssignmentRoutes);
app.use('/api/financial-transactions', financialTransactionRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/import-logs', importLogRoutes);
app.use('/api/delivery-assignments', deliveryAssignmentRoutes);
app.use('/api/delivery-wallets', deliveryWalletRoutes);
app.use('/api/delivery-locations', deliveryLocationRoutes);
app.use('/api/dashboard-metrics', dashboardMetricRoutes);
app.use('/api/settings', settingsRoutes);

// Explicit global print-options by content ID (avoids 404 when base_url or route order differs)
// GET /api/mobile/:id/print-options — :id = bookId OR materialId
app.get(
  '/api/mobile/:id/print-options',
  authenticate,
  transformImageUrlsMiddleware,
  validateQuery(paginationSchema),
  printOptionController.getPrintOptionsByContentId
);

// Mobile routes
app.use('/api/mobile', mobileRoutes);

// Public routes — college & department (no auth)
app.use('/api/public', publicRoutes);

// Slider routes
app.use('/api/sliders', sliderRoutes);

// 404 handler
app.use((req, res) => {
  sendError(res, 'Route not found', HTTP_STATUS.NOT_FOUND, 'NOT_FOUND');
});

// Global error handler (must be last)
app.use(errorHandler);

// Start server
const PORT = config.port;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${config.nodeEnv}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api/docs/swagger`);
  console.log(`📥 Postman Collection: http://localhost:${PORT}/api/docs/postman-collection.json`);
});

// Initialize Socket.io
const io = initSocket(server, config.corsOrigin);

// Make io accessible globally if needed (e.g., in controllers)
app.set('io', io);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

module.exports = app;
  