const cartRepository = require('../repositories/cartRepository');
const { NotFoundError, ValidationError } = require('../utils/errors');

const VALID_REFERENCE_TYPES = ['BOOK', 'PRODUCT', 'MATERIAL', 'PRINT_OPTION'];

const getOrCreateCart = async (userId) => {
  let cart = await cartRepository.findCartByUserId(userId);

  if (!cart) {
    cart = await cartRepository.createCart(userId);
  }

  return cart;
};

const findReferenceByType = async (referenceType, referenceId) => {
  if (referenceType === 'BOOK') {
    return cartRepository.findBookReference(referenceId);
  }

  if (referenceType === 'PRODUCT') {
    return cartRepository.findProductReference(referenceId);
  }

  if (referenceType === 'MATERIAL') {
    return cartRepository.findMaterialReference(referenceId);
  }

  if (referenceType === 'PRINT_OPTION') {
    return cartRepository.findPrintOptionReference(referenceId);
  }

  return null;
};

const getCart = async ({ userId }) => {
  const cart = await getOrCreateCart(userId);

  const enrichedItems = await Promise.all(
    cart.items.map(async (item) => ({
      ...item,
      reference: await findReferenceByType(item.referenceType, item.referenceId),
    }))
  );

  return {
    ...cart,
    items: enrichedItems,
  };
};

const addToCart = async ({ userId, referenceType, referenceId, quantity = 1 }) => {
  if (!referenceType || !referenceId) {
    throw new ValidationError('referenceType and referenceId are required');
  }

  if (!VALID_REFERENCE_TYPES.includes(referenceType)) {
    throw new ValidationError(`Invalid referenceType. Must be one of: ${VALID_REFERENCE_TYPES.join(', ')}`);
  }

  const reference = await findReferenceByType(referenceType, referenceId);
  if (!reference) {
    throw new NotFoundError(`${referenceType} not found`);
  }

  const cart = await getOrCreateCart(userId);
  const existingItem = await cartRepository.findCartItemByComposite({
    cartId: cart.id,
    referenceType,
    referenceId,
  });

  if (existingItem) {
    return {
      data: existingItem,
      message: 'Item already exists in cart',
    };
  }

  const cartItem = await cartRepository.createCartItem({
    cartId: cart.id,
    referenceType,
    referenceId,
    quantity,
  });

  return {
    data: cartItem,
    message: 'Item added to cart successfully',
  };
};

const updateCartItem = async ({ userId, id, quantity }) => {
  if (!quantity || quantity < 1) {
    throw new ValidationError('Quantity must be at least 1');
  }

  const cartItem = await cartRepository.findCartItemById(id);

  if (!cartItem || cartItem.cart.userId !== userId) {
    throw new NotFoundError('Cart item not found');
  }

  return cartRepository.updateCartItem(id, { quantity });
};

const removeFromCart = async ({ userId, id }) => {
  const cartItem = await cartRepository.findCartItemById(id);

  if (!cartItem || cartItem.cart.userId !== userId) {
    throw new NotFoundError('Cart item not found');
  }

  await cartRepository.deleteCartItem(id);
};

const clearCart = async ({ userId }) => {
  const cart = await cartRepository.findCartByUserId(userId);

  if (!cart) {
    return {
      message: 'Cart is already empty',
    };
  }

  await cartRepository.deleteCartItemsByCartId(cart.id);

  return {
    message: 'Cart cleared successfully',
  };
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
};
