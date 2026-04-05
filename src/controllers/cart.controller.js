/**
 * Cart Controller
 * Handles cart-related HTTP requests
 */

const cartService = require('../services/cartService');
const { sendSuccess } = require('../utils/response');

const getCart = async (req, res, next) => {
  try {
    const cart = await cartService.getCart({
      userId: req.userId,
    });

    sendSuccess(res, cart, 'Cart retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const addToCart = async (req, res, next) => {
  try {
    const result = await cartService.addToCart({
      userId: req.userId,
      ...req.body,
    });

    sendSuccess(res, result.data, result.message);
  } catch (error) {
    next(error);
  }
};

const updateCartItem = async (req, res, next) => {
  try {
    const item = await cartService.updateCartItem({
      userId: req.userId,
      id: req.params.id,
      quantity: req.body.quantity,
    });

    sendSuccess(res, item, 'Cart item updated successfully');
  } catch (error) {
    next(error);
  }
};

const removeFromCart = async (req, res, next) => {
  try {
    await cartService.removeFromCart({
      userId: req.userId,
      id: req.params.id,
    });

    sendSuccess(res, null, 'Item removed from cart successfully');
  } catch (error) {
    next(error);
  }
};

const clearCart = async (req, res, next) => {
  try {
    const result = await cartService.clearCart({
      userId: req.userId,
    });

    sendSuccess(res, null, result.message);
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
