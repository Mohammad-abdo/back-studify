# Studify Backend API

A comprehensive educational e-commerce platform backend built with Node.js, Express.js, and Prisma.

## 🚀 Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control (RBAC)
- **User Management**: Support for Students, Doctors, Delivery Personnel, Customers, and Admins
- **Books Management**: Upload, pricing, and approval system for educational books
- **Products Management**: Product catalog with retail and wholesale pricing
- **Orders System**: Order management for books, products, and print options
- **Reviews & Ratings**: User reviews for books and products
- **OTP Verification**: Phone number verification via SMS
- **File Upload**: Secure file upload system
- **Notification System**: User notifications
- **Financial Management**: Transaction tracking and delivery wallet system
- **Admin Dashboard**: Admin operations logging and dashboard metrics
- **Import/Export**: Excel import/export functionality
- **Reporting**: Comprehensive reporting system

## 📁 Project Structure

```
studify-backend/
├── src/
│   ├── config/              # Configuration files
│   │   ├── database.js      # Prisma client configuration
│   │   └── env.js           # Environment variables management
│   ├── controllers/         # Request handlers (to be implemented)
│   ├── middleware/          # Express middleware
│   │   ├── auth.middleware.js      # JWT authentication
│   │   ├── error.middleware.js     # Global error handling
│   │   ├── rateLimit.middleware.js # Rate limiting
│   │   ├── role.middleware.js      # RBAC middleware
│   │   └── validation.middleware.js # Request validation
│   ├── routes/              # API routes (to be implemented)
│   ├── services/            # Business logic services (to be implemented)
│   ├── utils/               # Utility functions
│   │   ├── constants.js     # Application constants
│   │   ├── errors.js        # Custom error classes
│   │   ├── helpers.js       # Helper functions
│   │   ├── jwt.js           # JWT utilities
│   │   ├── response.js      # Response formatters
│   │   └── validators.js    # Zod validation schemas
│   └── app.js               # Express application entry point
├── prisma/
│   └── schema.prisma        # Prisma schema
├── uploads/                 # File uploads directory
├── .env.example            # Environment variables template
├── .gitignore              # Git ignore rules
├── package.json            # Dependencies and scripts
└── README.md               # This file
```

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd studify-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Set up database**
   ```bash
   # Generate Prisma Client
   npm run prisma:generate

   # Run database migrations
   npm run prisma:migrate

   # (Optional) Seed the database
   npm run prisma:seed
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:6001` (or the port specified in your `.env` file).

## 📝 Environment Variables

See `.env.example` for all required environment variables. Key variables include:

- `DATABASE_URL`: PostgreSQL/MySQL connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `EMAIL_HOST`, `EMAIL_USER`, `EMAIL_PASSWORD`: Email service credentials
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`: Twilio SMS credentials
- `UPLOAD_DIR`: Directory for file uploads
- `PORT`: Server port (default: 6000)

## 🔧 Available Scripts

- `npm start`: Start production server
- `npm run dev`: Start development server with nodemon
- `npm run prisma:generate`: Generate Prisma Client
- `npm run prisma:migrate`: Run database migrations
- `npm run prisma:studio`: Open Prisma Studio
- `npm run prisma:seed`: Seed the database

## 📚 API Documentation

API documentation will be available at `/api/docs` (to be implemented).

### Base URL
```
http://localhost:6001/api
```

### Authentication
Most endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

### Response Format

**Success Response:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "message": "Error message",
    "code": "ERROR_CODE",
    "details": { ... }
  }
}
```

## 🔐 Security Features

- Password hashing with bcrypt (12 salt rounds)
- JWT token-based authentication
- Rate limiting on API endpoints
- Input validation with Zod
- Helmet.js for security headers
- CORS configuration
- SQL injection protection (Prisma)
- File upload validation

## 🧪 Testing

Testing setup to be implemented.

## 📄 License

ISC

## 👥 Contributing

Contributions are welcome! Please read the contributing guidelines first.

## 📞 Support

For support, please contact the development team.

---

**Last Updated**: December 2025

