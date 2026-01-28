/**
 * Swagger/OpenAPI Configuration
 * 
 * Provides a comprehensive guide to the Studify API.
 * Defines schemas, security, and global components.
 */

const swaggerJsdoc = require('swagger-jsdoc');

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
        url: 'http://localhost:6008/api',
        description: 'Development Server (Local)',
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

        // Core Entity Schemas
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            phone: { type: 'string', example: '+201234567890' },
            email: { type: 'string', format: 'email', nullable: true },
            avatarUrl: { type: 'string', format: 'uri', nullable: true },
            type: { type: 'string', enum: ['STUDENT', 'DOCTOR', 'DELIVERY', 'CUSTOMER', 'ADMIN', 'PRINT_CENTER'] },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Student: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            collegeId: { type: 'string', format: 'uuid', nullable: true },
            departmentId: { type: 'string', format: 'uuid', nullable: true },
          }
        },
        Doctor: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            specialization: { type: 'string' },
            approvalStatus: { type: 'string', enum: ['PENDING', 'APPROVED', 'REJECTED'] },
          }
        },
        Book: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            description: { type: 'string' },
            fileUrl: { type: 'string', format: 'uri' },
            imageUrls: { type: 'array', items: { type: 'string', format: 'uri' } },
            totalPages: { type: 'integer' },
            categoryId: { type: 'string', format: 'uuid' },
            doctorId: { type: 'string', format: 'uuid' },
            approvalStatus: { type: 'string', enum: ['PENDING', 'APPROVED', 'REJECTED'] },
          },
        },
        Product: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            description: { type: 'string' },
            imageUrls: { type: 'array', items: { type: 'string', format: 'uri' } },
            categoryId: { type: 'string', format: 'uuid' },
          },
        },
        Order: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            total: { type: 'number' },
            status: { type: 'string', enum: ['CREATED', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'] },
            orderType: { type: 'string', enum: ['PRODUCT', 'CONTENT', 'PRINT'] },
            address: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Delivery: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            vehicleType: { type: 'string' },
            status: { type: 'string', enum: ['AVAILABLE', 'ON_DELIVERY', 'OFFLINE'] },
          },
        },
        PrintCenter: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            location: { type: 'string', nullable: true },
            isActive: { type: 'boolean' },
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
  apis: ['./src/routes/*.js', './src/controllers/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
