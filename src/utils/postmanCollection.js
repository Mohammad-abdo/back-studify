/**
 * Postman Collection Generator
 * Generates Postman collection from Swagger/OpenAPI spec
 */

const swaggerSpec = require('../config/swagger');

/**
 * Generate Postman Collection v2.1 from Swagger spec
 */
const generatePostmanCollection = () => {
  const collection = {
    info: {
      name: 'Studify API',
      description: 'Studify - Educational E-commerce Platform API',
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      _exporter_id: 'studify-api',
    },
    item: [],
    variable: [
      {
        key: 'base_url',
        value: 'http://localhost:6000/api',
        type: 'string',
      },
      {
        key: 'token',
        value: '',
        type: 'string',
      },
    ],
  };

  // Add auth endpoints
  collection.item.push({
    name: 'Auth',
    item: [
      {
        name: 'Register',
        request: {
          method: 'POST',
          header: [
            {
              key: 'Content-Type',
              value: 'application/json',
            },
          ],
          body: {
            mode: 'raw',
            raw: JSON.stringify({
              phone: '+201234567890',
              password: 'password123',
              repeatPassword: 'password123',
              type: 'STUDENT',
              name: 'Test User',
            }, null, 2),
          },
          url: {
            raw: '{{base_url}}/auth/register',
            host: ['{{base_url}}'],
            path: ['auth', 'register'],
          },
        },
      },
      {
        name: 'Login',
        request: {
          method: 'POST',
          header: [
            {
              key: 'Content-Type',
              value: 'application/json',
            },
          ],
          body: {
            mode: 'raw',
            raw: JSON.stringify({
              phone: '+201234567890',
              password: 'password123',
            }, null, 2),
          },
          url: {
            raw: '{{base_url}}/auth/login',
            host: ['{{base_url}}'],
            path: ['auth', 'login'],
          },
        },
      },
      {
        name: 'Verify OTP',
        request: {
          method: 'POST',
          header: [
            {
              key: 'Content-Type',
              value: 'application/json',
            },
          ],
          body: {
            mode: 'raw',
            raw: JSON.stringify({
              userId: 'user-uuid-here',
              code: '123456',
            }, null, 2),
          },
          url: {
            raw: '{{base_url}}/auth/verify-otp',
            host: ['{{base_url}}'],
            path: ['auth', 'verify-otp'],
          },
        },
      },
      {
        name: 'Get Profile',
        request: {
          method: 'GET',
          header: [
            {
              key: 'Authorization',
              value: 'Bearer {{token}}',
            },
          ],
          url: {
            raw: '{{base_url}}/auth/profile',
            host: ['{{base_url}}'],
            path: ['auth', 'profile'],
          },
        },
      },
    ],
  });

  // Add Books endpoints
  collection.item.push({
    name: 'Books',
    item: [
      {
        name: 'Get All Books',
        request: {
          method: 'GET',
          url: {
            raw: '{{base_url}}/books?page=1&limit=10',
            host: ['{{base_url}}'],
            path: ['books'],
            query: [
              {
                key: 'page',
                value: '1',
              },
              {
                key: 'limit',
                value: '10',
              },
            ],
          },
        },
      },
      {
        name: 'Get Book by ID',
        request: {
          method: 'GET',
          url: {
            raw: '{{base_url}}/books/:id',
            host: ['{{base_url}}'],
            path: ['books', ':id'],
            variable: [
              {
                key: 'id',
                value: 'book-uuid-here',
              },
            ],
          },
        },
      },
      {
        name: 'Create Book',
        request: {
          method: 'POST',
          header: [
            {
              key: 'Authorization',
              value: 'Bearer {{token}}',
            },
            {
              key: 'Content-Type',
              value: 'application/json',
            },
          ],
          body: {
            mode: 'raw',
            raw: JSON.stringify({
              title: 'Book Title',
              description: 'Book description',
              fileUrl: 'https://example.com/book.pdf',
              totalPages: 100,
              categoryId: 'category-uuid-here',
            }, null, 2),
          },
          url: {
            raw: '{{base_url}}/books',
            host: ['{{base_url}}'],
            path: ['books'],
          },
        },
      },
    ],
  });

  // Add Users endpoints
  collection.item.push({
    name: 'Users',
    item: [
      {
        name: 'Get Profile',
        request: {
          method: 'GET',
          header: [
            {
              key: 'Authorization',
              value: 'Bearer {{token}}',
            },
          ],
          url: {
            raw: '{{base_url}}/users/profile',
            host: ['{{base_url}}'],
            path: ['users', 'profile'],
          },
        },
      },
      {
        name: 'Update Profile',
        request: {
          method: 'PUT',
          header: [
            {
              key: 'Authorization',
              value: 'Bearer {{token}}',
            },
            {
              key: 'Content-Type',
              value: 'application/json',
            },
          ],
          body: {
            mode: 'raw',
            raw: JSON.stringify({
              email: 'newemail@example.com',
              avatarUrl: 'https://example.com/avatar.jpg',
            }, null, 2),
          },
          url: {
            raw: '{{base_url}}/users/profile',
            host: ['{{base_url}}'],
            path: ['users', 'profile'],
          },
        },
      },
    ],
  });

  // Add Orders endpoints
  collection.item.push({
    name: 'Orders',
    item: [
      {
        name: 'Get My Orders',
        request: {
          method: 'GET',
          header: [
            {
              key: 'Authorization',
              value: 'Bearer {{token}}',
            },
          ],
          url: {
            raw: '{{base_url}}/orders?page=1&limit=10',
            host: ['{{base_url}}'],
            path: ['orders'],
            query: [
              {
                key: 'page',
                value: '1',
              },
              {
                key: 'limit',
                value: '10',
              },
            ],
          },
        },
      },
      {
        name: 'Create Order',
        request: {
          method: 'POST',
          header: [
            {
              key: 'Authorization',
              value: 'Bearer {{token}}',
            },
            {
              key: 'Content-Type',
              value: 'application/json',
            },
          ],
          body: {
            mode: 'raw',
            raw: JSON.stringify({
              items: [
                {
                  referenceType: 'BOOK',
                  referenceId: 'book-uuid-here',
                  quantity: 1,
                  price: 100,
                },
              ],
            }, null, 2),
          },
          url: {
            raw: '{{base_url}}/orders',
            host: ['{{base_url}}'],
            path: ['orders'],
          },
        },
      },
    ],
  });

  // Add Products endpoints
  collection.item.push({
    name: 'Products',
    item: [
      {
        name: 'Get All Products',
        request: {
          method: 'GET',
          url: {
            raw: '{{base_url}}/products?page=1&limit=10',
            host: ['{{base_url}}'],
            path: ['products'],
            query: [
              {
                key: 'page',
                value: '1',
              },
              {
                key: 'limit',
                value: '10',
              },
            ],
          },
        },
      },
      {
        name: 'Get Product by ID',
        request: {
          method: 'GET',
          url: {
            raw: '{{base_url}}/products/:id',
            host: ['{{base_url}}'],
            path: ['products', ':id'],
            variable: [
              {
                key: 'id',
                value: 'product-uuid-here',
              },
            ],
          },
        },
      },
    ],
  });

  // Add Admin endpoints
  collection.item.push({
    name: 'Admin',
    item: [
      {
        name: 'Get Dashboard Stats',
        request: {
          method: 'GET',
          header: [
            {
              key: 'Authorization',
              value: 'Bearer {{token}}',
            },
          ],
          url: {
            raw: '{{base_url}}/admin/dashboard/stats',
            host: ['{{base_url}}'],
            path: ['admin', 'dashboard', 'stats'],
          },
        },
      },
      {
        name: 'Get Pending Approvals',
        request: {
          method: 'GET',
          header: [
            {
              key: 'Authorization',
              value: 'Bearer {{token}}',
            },
          ],
          url: {
            raw: '{{base_url}}/admin/approvals?type=DOCTOR',
            host: ['{{base_url}}'],
            path: ['admin', 'approvals'],
            query: [
              {
                key: 'type',
                value: 'DOCTOR',
              },
            ],
          },
        },
      },
    ],
  });

  // Add Health endpoints
  collection.item.push({
    name: 'Health',
    item: [
      {
        name: 'Health Check',
        request: {
          method: 'GET',
          url: {
            raw: '{{base_url}}/../health',
            host: ['{{base_url}}'],
            path: ['..', 'health'],
          },
        },
      },
      {
        name: 'Database Health Check',
        request: {
          method: 'GET',
          url: {
            raw: '{{base_url}}/../health/database',
            host: ['{{base_url}}'],
            path: ['..', 'health', 'database'],
          },
        },
      },
    ],
  });

  return collection;
};

module.exports = {
  generatePostmanCollection,
};

