/**
 * Postman Collection Generator
 * Generates comprehensive Postman collection from all API routes
 */

/**
 * Generate Postman Collection v2.1 from all API routes
 */
const generatePostmanCollection = () => {
  const collection = {
    info: {
      name: 'Studify API - Complete Collection',
      description: 'Complete API collection for Studify - Educational E-commerce Platform\n\nIncludes:\n- Authentication\n- Mobile routes (Student, Doctor, Customer, Delivery)\n- Books & Products\n- Orders & Reviews\n- Admin endpoints\n- And more...',
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      _exporter_id: 'studify-api',
      version: '2.0.0',
    },
    item: [],
    variable: [
      {
        key: 'base_url',
        value: 'https://back-studify.developteam.site/api',
        type: 'string',
      },
      {
        key: 'token',
        value: '',
        type: 'string',
      },
    ],
    auth: {
      type: 'bearer',
      bearer: [
        {
          key: 'token',
          value: '{{token}}',
          type: 'string',
        },
      ],
    },
  };

  // ============================================
  // AUTHENTICATION
  // ============================================
  collection.item.push({
    name: 'Authentication',
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
              password: 'Password123!',
              repeatPassword: 'Password123!',
              type: 'STUDENT',
              name: 'Test Student',
              email: 'student@example.com',
              collegeId: 'college-uuid-here',
              departmentId: 'department-uuid-here',
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
              password: 'Password123!',
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
        name: 'Resend OTP',
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
            }, null, 2),
          },
          url: {
            raw: '{{base_url}}/auth/resend-otp',
            host: ['{{base_url}}'],
            path: ['auth', 'resend-otp'],
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
      {
        name: 'Forgot Password',
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
            }, null, 2),
          },
          url: {
            raw: '{{base_url}}/auth/forgot-password',
            host: ['{{base_url}}'],
            path: ['auth', 'forgot-password'],
          },
        },
      },
      {
        name: 'Reset Password',
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
              newPassword: 'NewPassword123!',
            }, null, 2),
          },
          url: {
            raw: '{{base_url}}/auth/reset-password',
            host: ['{{base_url}}'],
            path: ['auth', 'reset-password'],
          },
        },
      },
    ],
  });

  // ============================================
  // MOBILE - STUDENT
  // ============================================
  collection.item.push({
    name: 'Mobile - Student',
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
            raw: '{{base_url}}/mobile/student/profile',
            host: ['{{base_url}}'],
            path: ['mobile', 'student', 'profile'],
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
            raw: '{{base_url}}/mobile/student/profile',
            host: ['{{base_url}}'],
            path: ['mobile', 'student', 'profile'],
          },
        },
      },
      {
        name: 'Get Books',
        request: {
          method: 'GET',
          header: [
            {
              key: 'Authorization',
              value: 'Bearer {{token}}',
            },
          ],
          url: {
            raw: '{{base_url}}/mobile/student/books?page=1&limit=10',
            host: ['{{base_url}}'],
            path: ['mobile', 'student', 'books'],
            query: [
              { key: 'page', value: '1' },
              { key: 'limit', value: '10' },
              { key: 'categoryId', value: '', disabled: true },
              { key: 'collegeId', value: '', disabled: true },
              { key: 'search', value: '', disabled: true },
            ],
          },
        },
      },
      {
        name: 'Get Book by ID',
        request: {
          method: 'GET',
          header: [
            {
              key: 'Authorization',
              value: 'Bearer {{token}}',
            },
          ],
          url: {
            raw: '{{base_url}}/mobile/student/books/:id',
            host: ['{{base_url}}'],
            path: ['mobile', 'student', 'books', ':id'],
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
        name: 'Get Products',
        request: {
          method: 'GET',
          header: [
            {
              key: 'Authorization',
              value: 'Bearer {{token}}',
            },
          ],
          url: {
            raw: '{{base_url}}/mobile/student/products?page=1&limit=10',
            host: ['{{base_url}}'],
            path: ['mobile', 'student', 'products'],
            query: [
              { key: 'page', value: '1' },
              { key: 'limit', value: '10' },
              { key: 'categoryId', value: '', disabled: true },
              { key: 'search', value: '', disabled: true },
            ],
          },
        },
      },
      {
        name: 'Get Product by ID',
        request: {
          method: 'GET',
          header: [
            {
              key: 'Authorization',
              value: 'Bearer {{token}}',
            },
          ],
          url: {
            raw: '{{base_url}}/mobile/student/products/:id',
            host: ['{{base_url}}'],
            path: ['mobile', 'student', 'products', ':id'],
            variable: [
              {
                key: 'id',
                value: 'product-uuid-here',
              },
            ],
          },
        },
      },
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
            raw: '{{base_url}}/mobile/student/orders?page=1&limit=10',
            host: ['{{base_url}}'],
            path: ['mobile', 'student', 'orders'],
            query: [
              { key: 'page', value: '1' },
              { key: 'limit', value: '10' },
              { key: 'status', value: '', disabled: true },
            ],
          },
        },
      },
      {
        name: 'Get Order by ID',
        request: {
          method: 'GET',
          header: [
            {
              key: 'Authorization',
              value: 'Bearer {{token}}',
            },
          ],
          url: {
            raw: '{{base_url}}/mobile/student/orders/:id',
            host: ['{{base_url}}'],
            path: ['mobile', 'student', 'orders', ':id'],
            variable: [
              {
                key: 'id',
                value: 'order-uuid-here',
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
                  price: 100.0,
                },
              ],
            }, null, 2),
          },
          url: {
            raw: '{{base_url}}/mobile/student/orders',
            host: ['{{base_url}}'],
            path: ['mobile', 'student', 'orders'],
          },
        },
      },
      {
        name: 'Cancel Order',
        request: {
          method: 'POST',
          header: [
            {
              key: 'Authorization',
              value: 'Bearer {{token}}',
            },
          ],
          url: {
            raw: '{{base_url}}/mobile/student/orders/:id/cancel',
            host: ['{{base_url}}'],
            path: ['mobile', 'student', 'orders', ':id', 'cancel'],
            variable: [
              {
                key: 'id',
                value: 'order-uuid-here',
              },
            ],
          },
        },
      },
      {
        name: 'Get Reviews',
        request: {
          method: 'GET',
          header: [
            {
              key: 'Authorization',
              value: 'Bearer {{token}}',
            },
          ],
          url: {
            raw: '{{base_url}}/mobile/student/reviews?page=1&limit=10',
            host: ['{{base_url}}'],
            path: ['mobile', 'student', 'reviews'],
            query: [
              { key: 'page', value: '1' },
              { key: 'limit', value: '10' },
              { key: 'targetId', value: '', disabled: true },
              { key: 'targetType', value: '', disabled: true },
            ],
          },
        },
      },
      {
        name: 'Create Review',
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
              targetId: 'book-uuid-here',
              targetType: 'BOOK',
              rating: 5,
              comment: 'Great book!',
            }, null, 2),
          },
          url: {
            raw: '{{base_url}}/mobile/student/reviews',
            host: ['{{base_url}}'],
            path: ['mobile', 'student', 'reviews'],
          },
        },
      },
      {
        name: 'Get Notifications',
        request: {
          method: 'GET',
          header: [
            {
              key: 'Authorization',
              value: 'Bearer {{token}}',
            },
          ],
          url: {
            raw: '{{base_url}}/mobile/student/notifications?page=1&limit=10',
            host: ['{{base_url}}'],
            path: ['mobile', 'student', 'notifications'],
            query: [
              { key: 'page', value: '1' },
              { key: 'limit', value: '10' },
              { key: 'isRead', value: '', disabled: true },
            ],
          },
        },
      },
      {
        name: 'Get Unread Count',
        request: {
          method: 'GET',
          header: [
            {
              key: 'Authorization',
              value: 'Bearer {{token}}',
            },
          ],
          url: {
            raw: '{{base_url}}/mobile/student/notifications/unread-count',
            host: ['{{base_url}}'],
            path: ['mobile', 'student', 'notifications', 'unread-count'],
          },
        },
      },
      {
        name: 'Mark Notification as Read',
        request: {
          method: 'PUT',
          header: [
            {
              key: 'Authorization',
              value: 'Bearer {{token}}',
            },
          ],
          url: {
            raw: '{{base_url}}/mobile/student/notifications/:id/read',
            host: ['{{base_url}}'],
            path: ['mobile', 'student', 'notifications', ':id', 'read'],
            variable: [
              {
                key: 'id',
                value: 'notification-uuid-here',
              },
            ],
          },
        },
      },
    ],
  });

  // ============================================
  // MOBILE - DOCTOR
  // ============================================
  collection.item.push({
    name: 'Mobile - Doctor',
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
            raw: '{{base_url}}/mobile/doctor/profile',
            host: ['{{base_url}}'],
            path: ['mobile', 'doctor', 'profile'],
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
            raw: '{{base_url}}/mobile/doctor/profile',
            host: ['{{base_url}}'],
            path: ['mobile', 'doctor', 'profile'],
          },
        },
      },
      {
        name: 'Get My Books',
        request: {
          method: 'GET',
          header: [
            {
              key: 'Authorization',
              value: 'Bearer {{token}}',
            },
          ],
          url: {
            raw: '{{base_url}}/mobile/doctor/books?page=1&limit=10',
            host: ['{{base_url}}'],
            path: ['mobile', 'doctor', 'books'],
            query: [
              { key: 'page', value: '1' },
              { key: 'limit', value: '10' },
              { key: 'approvalStatus', value: '', disabled: true },
              { key: 'categoryId', value: '', disabled: true },
              { key: 'search', value: '', disabled: true },
            ],
          },
        },
      },
      {
        name: 'Get Book by ID',
        request: {
          method: 'GET',
          header: [
            {
              key: 'Authorization',
              value: 'Bearer {{token}}',
            },
          ],
          url: {
            raw: '{{base_url}}/mobile/doctor/books/:id',
            host: ['{{base_url}}'],
            path: ['mobile', 'doctor', 'books', ':id'],
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
              title: 'New Book Title',
              description: 'Book description here',
              fileUrl: 'https://example.com/book.pdf',
              totalPages: 200,
              categoryId: 'category-uuid-here',
              collegeId: 'college-uuid-here',
              departmentId: 'department-uuid-here',
            }, null, 2),
          },
          url: {
            raw: '{{base_url}}/mobile/doctor/books',
            host: ['{{base_url}}'],
            path: ['mobile', 'doctor', 'books'],
          },
        },
      },
      {
        name: 'Update Book',
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
              title: 'Updated Book Title',
              description: 'Updated description',
            }, null, 2),
          },
          url: {
            raw: '{{base_url}}/mobile/doctor/books/:id',
            host: ['{{base_url}}'],
            path: ['mobile', 'doctor', 'books', ':id'],
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
        name: 'Delete Book',
        request: {
          method: 'DELETE',
          header: [
            {
              key: 'Authorization',
              value: 'Bearer {{token}}',
            },
          ],
          url: {
            raw: '{{base_url}}/mobile/doctor/books/:id',
            host: ['{{base_url}}'],
            path: ['mobile', 'doctor', 'books', ':id'],
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
        name: 'Add Book Pricing',
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
              accessType: 'READ',
              price: 50.0,
            }, null, 2),
          },
          url: {
            raw: '{{base_url}}/mobile/doctor/books/:id/pricing',
            host: ['{{base_url}}'],
            path: ['mobile', 'doctor', 'books', ':id', 'pricing'],
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
        name: 'Get Notifications',
        request: {
          method: 'GET',
          header: [
            {
              key: 'Authorization',
              value: 'Bearer {{token}}',
            },
          ],
          url: {
            raw: '{{base_url}}/mobile/doctor/notifications?page=1&limit=10',
            host: ['{{base_url}}'],
            path: ['mobile', 'doctor', 'notifications'],
            query: [
              { key: 'page', value: '1' },
              { key: 'limit', value: '10' },
            ],
          },
        },
      },
    ],
  });

  // ============================================
  // MOBILE - CUSTOMER
  // ============================================
  collection.item.push({
    name: 'Mobile - Customer',
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
            raw: '{{base_url}}/mobile/customer/profile',
            host: ['{{base_url}}'],
            path: ['mobile', 'customer', 'profile'],
          },
        },
      },
      {
        name: 'Get Products',
        request: {
          method: 'GET',
          header: [
            {
              key: 'Authorization',
              value: 'Bearer {{token}}',
            },
          ],
          url: {
            raw: '{{base_url}}/mobile/customer/products?page=1&limit=10',
            host: ['{{base_url}}'],
            path: ['mobile', 'customer', 'products'],
            query: [
              { key: 'page', value: '1' },
              { key: 'limit', value: '10' },
            ],
          },
        },
      },
      {
        name: 'Get My Wholesale Orders',
        request: {
          method: 'GET',
          header: [
            {
              key: 'Authorization',
              value: 'Bearer {{token}}',
            },
          ],
          url: {
            raw: '{{base_url}}/mobile/customer/orders?page=1&limit=10',
            host: ['{{base_url}}'],
            path: ['mobile', 'customer', 'orders'],
            query: [
              { key: 'page', value: '1' },
              { key: 'limit', value: '10' },
            ],
          },
        },
      },
      {
        name: 'Create Wholesale Order',
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
                  productId: 'product-uuid-here',
                  quantity: 50,
                  price: 15.0,
                },
              ],
            }, null, 2),
          },
          url: {
            raw: '{{base_url}}/mobile/customer/orders',
            host: ['{{base_url}}'],
            path: ['mobile', 'customer', 'orders'],
          },
        },
      },
      {
        name: 'Get Notifications',
        request: {
          method: 'GET',
          header: [
            {
              key: 'Authorization',
              value: 'Bearer {{token}}',
            },
          ],
          url: {
            raw: '{{base_url}}/mobile/customer/notifications?page=1&limit=10',
            host: ['{{base_url}}'],
            path: ['mobile', 'customer', 'notifications'],
            query: [
              { key: 'page', value: '1' },
              { key: 'limit', value: '10' },
            ],
          },
        },
      },
    ],
  });

  // ============================================
  // MOBILE - DELIVERY
  // ============================================
  collection.item.push({
    name: 'Mobile - Delivery',
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
            raw: '{{base_url}}/mobile/delivery/profile',
            host: ['{{base_url}}'],
            path: ['mobile', 'delivery', 'profile'],
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
              name: 'Updated Name',
              vehicleType: 'Motorcycle',
              vehiclePlateNumber: 'ABC-123',
            }, null, 2),
          },
          url: {
            raw: '{{base_url}}/mobile/delivery/profile',
            host: ['{{base_url}}'],
            path: ['mobile', 'delivery', 'profile'],
          },
        },
      },
      {
        name: 'Update Status',
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
              status: 'AVAILABLE',
            }, null, 2),
          },
          url: {
            raw: '{{base_url}}/mobile/delivery/status',
            host: ['{{base_url}}'],
            path: ['mobile', 'delivery', 'status'],
          },
        },
      },
      {
        name: 'Get Assignments',
        request: {
          method: 'GET',
          header: [
            {
              key: 'Authorization',
              value: 'Bearer {{token}}',
            },
          ],
          url: {
            raw: '{{base_url}}/mobile/delivery/assignments?page=1&limit=10',
            host: ['{{base_url}}'],
            path: ['mobile', 'delivery', 'assignments'],
            query: [
              { key: 'page', value: '1' },
              { key: 'limit', value: '10' },
            ],
          },
          description: 'List assignments. Each item includes latitude, longitude (delivery destination), customerName, deliveryAddress for map.',
        },
      },
      {
        name: 'Mark Order Picked Up',
        request: {
          method: 'POST',
          header: [
            {
              key: 'Authorization',
              value: 'Bearer {{token}}',
            },
          ],
          url: {
            raw: '{{base_url}}/mobile/delivery/orders/:orderId/pickup',
            host: ['{{base_url}}'],
            path: ['mobile', 'delivery', 'orders', ':orderId', 'pickup'],
            variable: [
              {
                key: 'orderId',
                value: 'order-uuid-here',
              },
            ],
          },
        },
      },
      {
        name: 'Mark Order Delivered',
        request: {
          method: 'POST',
          header: [
            {
              key: 'Authorization',
              value: 'Bearer {{token}}',
            },
          ],
          url: {
            raw: '{{base_url}}/mobile/delivery/orders/:orderId/deliver',
            host: ['{{base_url}}'],
            path: ['mobile', 'delivery', 'orders', ':orderId', 'deliver'],
            variable: [
              {
                key: 'orderId',
                value: 'order-uuid-here',
              },
            ],
          },
        },
      },
      {
        name: 'Update Location',
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
              latitude: 30.0444,
              longitude: 31.2357,
              address: 'Cairo, Egypt',
            }, null, 2),
          },
          url: {
            raw: '{{base_url}}/mobile/delivery/location',
            host: ['{{base_url}}'],
            path: ['mobile', 'delivery', 'location'],
          },
        },
      },
      {
        name: 'Get Wallet',
        request: {
          method: 'GET',
          header: [
            {
              key: 'Authorization',
              value: 'Bearer {{token}}',
            },
          ],
          url: {
            raw: '{{base_url}}/mobile/delivery/wallet',
            host: ['{{base_url}}'],
            path: ['mobile', 'delivery', 'wallet'],
          },
        },
      },
      {
        name: 'Get Wallet Transactions',
        request: {
          method: 'GET',
          header: [
            {
              key: 'Authorization',
              value: 'Bearer {{token}}',
            },
          ],
          url: {
            raw: '{{base_url}}/mobile/delivery/wallet/transactions?page=1&limit=10',
            host: ['{{base_url}}'],
            path: ['mobile', 'delivery', 'wallet', 'transactions'],
            query: [
              { key: 'page', value: '1' },
              { key: 'limit', value: '10' },
            ],
          },
        },
      },
      {
        name: 'Get Notifications',
        request: {
          method: 'GET',
          header: [
            {
              key: 'Authorization',
              value: 'Bearer {{token}}',
            },
          ],
          url: {
            raw: '{{base_url}}/mobile/delivery/notifications?page=1&limit=10',
            host: ['{{base_url}}'],
            path: ['mobile', 'delivery', 'notifications'],
            query: [
              { key: 'page', value: '1' },
              { key: 'limit', value: '10' },
            ],
          },
        },
      },
    ],
  });

  // ============================================
  // BOOKS
  // ============================================
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
              { key: 'page', value: '1' },
              { key: 'limit', value: '10' },
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
        name: 'Create Book (Doctor)',
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

  // ============================================
  // PRODUCTS
  // ============================================
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
              { key: 'page', value: '1' },
              { key: 'limit', value: '10' },
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

  // ============================================
  // ORDERS
  // ============================================
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
              { key: 'page', value: '1' },
              { key: 'limit', value: '10' },
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
                  price: 100.0,
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

  // ============================================
  // REVIEWS
  // ============================================
  collection.item.push({
    name: 'Reviews',
    item: [
      {
        name: 'Get Reviews',
        request: {
          method: 'GET',
          url: {
            raw: '{{base_url}}/reviews?targetId=book-uuid-here&targetType=BOOK&page=1&limit=10',
            host: ['{{base_url}}'],
            path: ['reviews'],
            query: [
              { key: 'targetId', value: 'book-uuid-here' },
              { key: 'targetType', value: 'BOOK' },
              { key: 'page', value: '1' },
              { key: 'limit', value: '10' },
            ],
          },
        },
      },
      {
        name: 'Create Review',
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
              targetId: 'book-uuid-here',
              targetType: 'BOOK',
              rating: 5,
              comment: 'Great book!',
            }, null, 2),
          },
          url: {
            raw: '{{base_url}}/reviews',
            host: ['{{base_url}}'],
            path: ['reviews'],
          },
        },
      },
    ],
  });

  // ============================================
  // COLLEGES & DEPARTMENTS
  // ============================================
  collection.item.push({
    name: 'Colleges & Departments',
    item: [
      {
        name: 'Get Colleges',
        request: {
          method: 'GET',
          url: {
            raw: '{{base_url}}/colleges',
            host: ['{{base_url}}'],
            path: ['colleges'],
          },
        },
      },
      {
        name: 'Get Departments',
        request: {
          method: 'GET',
          url: {
            raw: '{{base_url}}/departments?collegeId=college-uuid-here',
            host: ['{{base_url}}'],
            path: ['departments'],
            query: [
              { key: 'collegeId', value: 'college-uuid-here' },
            ],
          },
        },
      },
    ],
  });

  // ============================================
  // CATEGORIES
  // ============================================
  collection.item.push({
    name: 'Categories',
    item: [
      {
        name: 'Get Book Categories',
        request: {
          method: 'GET',
          url: {
            raw: '{{base_url}}/categories/books',
            host: ['{{base_url}}'],
            path: ['categories', 'books'],
          },
        },
      },
      {
        name: 'Get Product Categories',
        request: {
          method: 'GET',
          url: {
            raw: '{{base_url}}/categories/products',
            host: ['{{base_url}}'],
            path: ['categories', 'products'],
          },
        },
      },
    ],
  });

  // ============================================
  // NOTIFICATIONS
  // ============================================
  collection.item.push({
    name: 'Notifications',
    item: [
      {
        name: 'Get Notifications',
        request: {
          method: 'GET',
          header: [
            {
              key: 'Authorization',
              value: 'Bearer {{token}}',
            },
          ],
          url: {
            raw: '{{base_url}}/notifications?page=1&limit=10',
            host: ['{{base_url}}'],
            path: ['notifications'],
            query: [
              { key: 'page', value: '1' },
              { key: 'limit', value: '10' },
            ],
          },
        },
      },
      {
        name: 'Get Unread Count',
        request: {
          method: 'GET',
          header: [
            {
              key: 'Authorization',
              value: 'Bearer {{token}}',
            },
          ],
          url: {
            raw: '{{base_url}}/notifications/unread-count',
            host: ['{{base_url}}'],
            path: ['notifications', 'unread-count'],
          },
        },
      },
      {
        name: 'Mark as Read',
        request: {
          method: 'PUT',
          header: [
            {
              key: 'Authorization',
              value: 'Bearer {{token}}',
            },
          ],
          url: {
            raw: '{{base_url}}/notifications/:id/read',
            host: ['{{base_url}}'],
            path: ['notifications', ':id', 'read'],
            variable: [
              {
                key: 'id',
                value: 'notification-uuid-here',
              },
            ],
          },
        },
      },
    ],
  });

  // ============================================
  // ONBOARDING
  // ============================================
  collection.item.push({
    name: 'Onboarding',
    item: [
      {
        name: 'Get Onboarding Items',
        request: {
          method: 'GET',
          url: {
            raw: '{{base_url}}/onboarding',
            host: ['{{base_url}}'],
            path: ['onboarding'],
          },
        },
      },
    ],
  });

  // ============================================
  // HEALTH CHECK
  // ============================================
  collection.item.push({
    name: 'Health',
    item: [
      {
        name: 'Health Check',
        request: {
          method: 'GET',
          url: {
            raw: 'http://localhost:6000/health',
            protocol: 'http',
            host: ['localhost'],
            port: '6000',
            path: ['health'],
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
