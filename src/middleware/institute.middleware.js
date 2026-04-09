/**
 * Institute Separation Middleware
 * Enforces strict separation between retail and institute (wholesale) product domains.
 */

const { verifyToken } = require('../utils/jwt');
const prisma = require('../config/database');
const { AuthorizationError, AuthenticationError } = require('../utils/errors');
const { USER_TYPES } = require('../utils/constants');

/**
 * Tries to authenticate but does NOT fail if no token is present.
 * Sets req.user / req.userId / req.userType when a valid token exists.
 * Use on public routes that need user-type-aware filtering.
 */
const optionalAuthenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        customer: true,
        institute: true,
      },
    });

    if (user && user.isActive) {
      req.user = user;
      req.userId = user.id;
      req.userType = user.type;
    }

    next();
  } catch {
    // Token invalid / expired — treat as unauthenticated guest
    next();
  }
};

/**
 * Requires that the authenticated user is an INSTITUTE user.
 * Must be placed after `authenticate`.
 */
const checkInstituteUser = (req, res, next) => {
  if (!req.user) {
    return next(new AuthenticationError('Authentication required'));
  }
  if (req.user.type !== USER_TYPES.INSTITUTE) {
    return next(new AuthorizationError('Only institute users can access this resource'));
  }
  next();
};

/**
 * Middleware that checks whether the current user is allowed to access
 * the product identified by req.params.id.
 *
 * Rules:
 *  - ADMIN can access any product
 *  - INSTITUTE user can ONLY access isInstituteProduct === true
 *  - Everyone else can ONLY access isInstituteProduct === false
 */
const checkProductAccess = async (req, res, next) => {
  try {
    const productId = req.params.id || req.params.productId;
    if (!productId) return next();

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, isInstituteProduct: true },
    });

    if (!product) return next(); // let the controller handle 404

    const userType = req.user?.type;

    if (userType === USER_TYPES.ADMIN) {
      return next();
    }

    if (product.isInstituteProduct && userType !== USER_TYPES.INSTITUTE) {
      return next(
        new AuthorizationError(
          'This product is part of the government/wholesale catalogue. Sign in with an institute account.'
        )
      );
    }

    if (!product.isInstituteProduct && userType === USER_TYPES.INSTITUTE) {
      return next(
        new AuthorizationError(
          'Institute accounts only use the wholesale catalogue. Use institute categories and products.'
        )
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Returns the appropriate isInstituteProduct filter value for Prisma queries
 * based on the current user type.
 *
 *  - ADMIN  → undefined (no filter — see all)
 *  - INSTITUTE → true
 *  - Everyone else (including unauthenticated) → false
 */
const getInstituteProductFilter = (userType) => {
  if (userType === USER_TYPES.ADMIN) return undefined;
  if (userType === USER_TYPES.INSTITUTE) return true;
  return false;
};

/**
 * Same logic for category filtering using isInstituteCategory.
 */
const getInstituteCategoryFilter = (userType) => {
  if (userType === USER_TYPES.ADMIN) return undefined;
  if (userType === USER_TYPES.INSTITUTE) return true;
  return false;
};

module.exports = {
  optionalAuthenticate,
  checkInstituteUser,
  checkProductAccess,
  getInstituteProductFilter,
  getInstituteCategoryFilter,
};
