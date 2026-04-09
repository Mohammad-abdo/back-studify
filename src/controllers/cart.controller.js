/**
 * Cart Controller
 * Handles cart-related HTTP requests
 */

const prisma = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response');
const { NotFoundError, BadRequestError, AuthorizationError } = require('../utils/errors');
const { sanitizeProduct } = require('../utils/legacyApiShape');
const { USER_TYPES } = require('../utils/constants');

/**
 * Get or create user's cart
 */
const getOrCreateCart = async (userId) => {
  let cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: true,
    },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: { userId },
      include: {
        items: true,
      },
    });
  }

  return cart;
};

/**
 * Get user's cart
 */
const getCart = async (req, res, next) => {
  try {
    const userId = req.userId;

    const cart = await getOrCreateCart(userId);

    // Enrich cart items with reference data
    const enrichedItems = await Promise.all(
      cart.items.map(async (item) => {
        let referenceData = null;

        if (item.referenceType === 'BOOK') {
          referenceData = await prisma.book.findUnique({
            where: { id: item.referenceId },
            include: {
              category: true,
              doctor: {
                include: {
                  user: {
                    select: {
                      id: true,
                      phone: true,
                      avatarUrl: true,
                    },
                  },
                },
              },
              pricing: true,
            },
          });
        } else if (item.referenceType === 'PRODUCT') {
          const rawProduct = await prisma.product.findUnique({
            where: { id: item.referenceId },
            include: {
              category: true,
              pricing: true,
            },
          });
          referenceData = rawProduct ? sanitizeProduct(rawProduct) : null;
        } else if (item.referenceType === 'MATERIAL') {
          referenceData = await prisma.material.findUnique({
            where: { id: item.referenceId },
            include: {
              category: true,
              doctor: {
                include: {
                  user: {
                    select: {
                      id: true,
                      phone: true,
                      avatarUrl: true,
                    },
                  },
                },
              },
              pricing: true,
            },
          });
        } else if (item.referenceType === 'PRINT_OPTION') {
          referenceData = await prisma.printOption.findUnique({
            where: { id: item.referenceId },
            include: {
              book: {
                include: {
                  category: true,
                  doctor: {
                    include: {
                      user: {
                        select: {
                          id: true,
                          phone: true,
                          avatarUrl: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          });
        }

        return {
          ...item,
          reference: referenceData,
        };
      })
    );

    const enrichedCart = {
      ...cart,
      items: enrichedItems,
    };

    sendSuccess(res, enrichedCart, 'Cart retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Add item to cart
 * Prevents mixing institute and normal products in the same cart.
 */
const addToCart = async (req, res, next) => {
  try {
    const userId = req.userId;
    const userType = req.userType;
    const { referenceType, referenceId, quantity = 1 } = req.body;

    if (!referenceType || !referenceId) {
      throw new BadRequestError('referenceType and referenceId are required');
    }

    const validTypes = ['BOOK', 'PRODUCT', 'MATERIAL', 'PRINT_OPTION'];
    if (!validTypes.includes(referenceType)) {
      throw new BadRequestError(`Invalid referenceType. Must be one of: ${validTypes.join(', ')}`);
    }

    // Verify reference exists + enforce institute separation for products
    let referenceExists = false;
    let incomingIsInstitute = false;

    if (referenceType === 'BOOK') {
      const book = await prisma.book.findUnique({ where: { id: referenceId } });
      referenceExists = !!book;
    } else if (referenceType === 'PRODUCT') {
      const product = await prisma.product.findUnique({ where: { id: referenceId } });
      referenceExists = !!product;
      if (product) {
        incomingIsInstitute = product.isInstituteProduct;

        if (product.isInstituteProduct && userType !== USER_TYPES.INSTITUTE && userType !== USER_TYPES.ADMIN) {
          throw new AuthorizationError(
            'This item is from the government/wholesale catalogue. Sign in with an institute account to add it.'
          );
        }
        if (!product.isInstituteProduct && userType === USER_TYPES.INSTITUTE) {
          throw new AuthorizationError(
            '[WHOLESALE_PRODUCT_REQUIRED] This product is retail (isInstituteProduct=false). Institute users must add items from the government wholesale list only — request GET /api/mobile/products or GET /api/products with your Bearer token, then use that product id.'
          );
        }
      }
    } else if (referenceType === 'MATERIAL') {
      const material = await prisma.material.findUnique({ where: { id: referenceId } });
      referenceExists = !!material;
    } else if (referenceType === 'PRINT_OPTION') {
      const printOption = await prisma.printOption.findUnique({ where: { id: referenceId } });
      referenceExists = !!printOption;
    }

    if (!referenceExists) {
      throw new NotFoundError(`${referenceType} not found`);
    }

    const cart = await getOrCreateCart(userId);

    // Prevent mixing institute and normal products in the same cart
    if (referenceType === 'PRODUCT' && cart.items.length > 0) {
      const existingProductItems = cart.items.filter((i) => i.referenceType === 'PRODUCT');
      if (existingProductItems.length > 0) {
        const existingProducts = await prisma.product.findMany({
          where: { id: { in: existingProductItems.map((i) => i.referenceId) } },
          select: { id: true, isInstituteProduct: true },
        });
        const existingIsInstitute = existingProducts.some((p) => p.isInstituteProduct);
        const existingIsRetail = existingProducts.some((p) => !p.isInstituteProduct);

        if (incomingIsInstitute && existingIsRetail) {
          throw new BadRequestError('Cannot mix institute and normal products in the same cart. Please clear your cart first.');
        }
        if (!incomingIsInstitute && existingIsInstitute) {
          throw new BadRequestError('Cannot mix institute and normal products in the same cart. Please clear your cart first.');
        }
      }
    }

    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_referenceType_referenceId: {
          cartId: cart.id,
          referenceType,
          referenceId,
        },
      },
    });

    if (existingItem) {
      return sendSuccess(res, existingItem, 'Item already exists in cart');
    }

    const cartItem = await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        referenceType,
        referenceId,
        quantity,
      },
    });

    sendSuccess(res, cartItem, 'Item added to cart successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Update cart item quantity
 */
const updateCartItem = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      throw new BadRequestError('Quantity must be at least 1');
    }

    // Verify cart item belongs to user
    const cartItem = await prisma.cartItem.findUnique({
      where: { id },
      include: {
        cart: true,
      },
    });

    if (!cartItem) {
      throw new NotFoundError('Cart item not found');
    }

    if (cartItem.cart.userId !== userId) {
      throw new NotFoundError('Cart item not found');
    }

    const updatedItem = await prisma.cartItem.update({
      where: { id },
      data: { quantity },
    });

    sendSuccess(res, updatedItem, 'Cart item updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Remove item from cart
 */
const removeFromCart = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    // Verify cart item belongs to user
    const cartItem = await prisma.cartItem.findUnique({
      where: { id },
      include: {
        cart: true,
      },
    });

    if (!cartItem) {
      throw new NotFoundError('Cart item not found');
    }

    if (cartItem.cart.userId !== userId) {
      throw new NotFoundError('Cart item not found');
    }

    await prisma.cartItem.delete({
      where: { id },
    });

    sendSuccess(res, null, 'Item removed from cart successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Clear cart
 */
const clearCart = async (req, res, next) => {
  try {
    const userId = req.userId;

    const cart = await prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      return sendSuccess(res, null, 'Cart is already empty');
    }

    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    sendSuccess(res, null, 'Cart cleared successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
};


