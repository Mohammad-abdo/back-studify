/**
 * Documentation Routes
 * Swagger UI and Postman Collection download
 */

const express = require('express');
const router = express.Router();
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('../config/swagger');
const { generatePostmanCollection } = require('../utils/postmanCollection');
const { sendSuccess } = require('../utils/response');

// Swagger UI
router.use('/swagger', swaggerUi.serve);
router.get('/swagger', swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Studify API Documentation',
}));

// OpenAPI JSON
router.get('/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Postman Collection download
router.get('/postman-collection.json', (req, res) => {
  try {
    const collection = generatePostmanCollection();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="studify-api-postman-collection.json"');
    res.json(collection);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to generate Postman collection',
        code: 'GENERATION_ERROR',
      },
    });
  }
});

// API Documentation info
router.get('/', (req, res) => {
  sendSuccess(res, {
    swagger: '/api/docs/swagger',
    openApi: '/api/docs/swagger.json',
    postmanCollection: '/api/docs/postman-collection.json',
  }, 'API Documentation endpoints');
});

module.exports = router;

