/**
 * Cart Controller
 * Handles cart-related HTTP requests
 */

const prisma = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response');
const { NotFoundError, BadRequestError } = require('../utils/errors');

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
          referenceData = await prisma.product.findUnique({
            where: { id: item.referenceId },
            include: {
              category: true,
              pricing: true,
            },
          });
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
 */
const addToCart = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { referenceType, referenceId, quantity = 1 } = req.body;

    if (!referenceType || !referenceId) {
      throw new BadRequestError('referenceType and referenceId are required');
    }

    // Validate reference type
    const validTypes = ['BOOK', 'PRODUCT', 'MATERIAL', 'PRINT_OPTION'];
    if (!validTypes.includes(referenceType)) {
      throw new BadRequestError(`Invalid referenceType. Must be one of: ${validTypes.join(', ')}`);
    }

    // Verify reference exists
    let referenceExists = false;
    if (referenceType === 'BOOK') {
      const book = await prisma.book.findUnique({ where: { id: referenceId } });
      referenceExists = !!book;
    } else if (referenceType === 'PRODUCT') {
      const product = await prisma.product.findUnique({ where: { id: referenceId } });
      referenceExists = !!product;
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

    // Get or create cart
    const cart = await getOrCreateCart(userId);

    // Check if item already exists in cart
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_referenceType_referenceId: {
          cartId: cart.id,
          referenceType,
          referenceId,
        },
      },
    });

    let cartItem;
    if (existingItem) {
      // Update quantity
      cartItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity },
      });
    } else {
      // Create new item
      cartItem = await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          referenceType,
          referenceId,
          quantity,
        },
      });
    }

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

