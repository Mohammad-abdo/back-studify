/**
 * Authentication Middleware
 * Validates JWT token and attaches user to request
 */

const { verifyToken } = require('../utils/jwt');
const { AuthenticationError } = require('../utils/errors');
const prisma = require('../config/database');

const authenticate = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('No token provided');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = verifyToken(token);

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        student: true,
        doctor: true,
        delivery: true,
        customer: true,
        admin: true,
      },
    });

    if (!user) {
      throw new AuthenticationError('User not found');
    }

    if (!user.isActive) {
      throw new AuthenticationError('User account is inactive');
    }

    // Attach user to request object
    req.user = user;
    req.userId = user.id;
    req.userType = user.type;

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = authenticate;

