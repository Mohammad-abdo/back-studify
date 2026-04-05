/**
 * Swagger/OpenAPI Configuration
 * 
 * Provides a comprehensive guide to the Studify API.
 * Defines schemas, security, and global components.
 */

const swaggerJsdoc = require('swagger-jsdoc');
const config = require('./env');

const normalizedBackendUrl = config.backendUrl.replace(/\/+$/, '');
const localApiServerUrl = normalizedBackendUrl.endsWith('/api')
  ? normalizedBackendUrl
  : `${normalizedBackendUrl}/api`;

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Studify API - Production Documentation',
      version: '2.0.0',
      description: `
## Studify API Guide
Welcome to the Studify API documentation. This guide provides detailed information on all available endpoints, data models, and authentication mechanisms.

### Authentication
Most endpoints require a Bearer Token (JWT). You can obtain this token via the \`/auth/login\` endpoint.
Include the token in your headers: \`Authorization: Bearer <your_token>\`.

### Response Formats
The API uses a standard response wrapper:
- **Success**: \`{ "success": true, "message": "...", "data": { ... } }\`
- **Error**: \`{ "success": false, "error": { "message": "...", "code": "..." } }\`
- **Paginated**: \`{ "success": true, "data": [...], "pagination": { ... } }\`

### Rate Limiting
- Auth endpoints: 10 requests per 15 minutes.
- General API: 100 requests per 15 minutes.
      `,
      contact: {
        name: 'Studify API Support',
        email: 'support@studify.com',
        url: 'https://studify.com/support'
      },
      license: {
        name: 'Proprietary',
      },
    },
    servers: [
      {
        url: localApiServerUrl,
        description: 'Configured Server',
      },
      {
        url: 'https://back-studify.developteam.site/api',
        description: 'Production Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token in the format: Bearer <token>'
        },
      },
      schemas: {
        // Common Response Schemas
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                message: { type: 'string', example: 'Detailed error message' },
                code: { type: 'string', example: 'VALIDATION_ERROR' },
                details: { type: 'object', description: 'Additional error context' },
              },
            },
          },
        },
        Success: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Operation successful' },
            data: { type: 'object' },
          },
        },
        Paginated: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Operation successful' },
            data: {
              type: 'array',
              items: { type: 'object' },
            },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'integer', example: 1 },
                limit: { type: 'integer', example: 10 },
                total: { type: 'integer', example: 100 },
                totalPages: { type: 'integer', example: 10 },
              },
            },
          },
        },
      },
    },
    tags: [
      { name: 'Auth', description: 'Authentication and identity management' },
      { name: 'Users', description: 'Student, Doctor, and Admin profiles' },
      { name: 'Books', description: 'Academic books and study materials' },
      { name: 'Products', description: 'Stationery and university supplies' },
      { name: 'Orders', description: 'Order processing and history' },
      { name: 'Cart', description: 'Shopping cart management' },
      { name: 'Delivery', description: 'Real-time tracking and delivery ops' },
      { name: 'Print Center', description: 'Print job management for production nodes' },
      { name: 'Admin', description: 'System-wide management and reports' },
      { name: 'Notifications', description: 'Real-time push and system alerts' },
      { name: 'System', description: 'Categories, Colleges, and static data' },
      { name: 'Health', description: 'Server monitoring' },
    ],
  },
  apis: ['./swagger/**/*.yaml'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
