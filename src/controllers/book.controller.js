/**
 * Book Controller
 * Handles book-related HTTP requests
 */

const bookService = require('../services/bookService');
const { sendSuccess, sendPaginated } = require('../utils/response');

const getBooks = async (req, res, next) => {
  try {
    const result = await bookService.getBooks(req.query);
    sendPaginated(res, result.data, result.pagination, 'Books retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getBookById = async (req, res, next) => {
  try {
    const book = await bookService.getBookById({
      id: req.params.id,
    });

    sendSuccess(res, book, 'Book retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const createBook = async (req, res, next) => {
  try {
    const book = await bookService.createBook({
      userId: req.userId,
      ...req.body,
    });

    sendSuccess(res, book, 'Book created successfully. Waiting for admin approval.', 201);
  } catch (error) {
    next(error);
  }
};

const updateBook = async (req, res, next) => {
  try {
    const book = await bookService.updateBook({
      userId: req.userId,
      userType: req.userType,
      id: req.params.id,
      ...req.body,
    });

    sendSuccess(res, book, 'Book updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteBook = async (req, res, next) => {
  try {
    await bookService.deleteBook({
      userId: req.userId,
      id: req.params.id,
    });

    sendSuccess(res, null, 'Book deleted successfully');
  } catch (error) {
    next(error);
  }
};

const addBookPricing = async (req, res, next) => {
  try {
    const pricing = await bookService.addBookPricing({
      userId: req.userId,
      bookId: req.body.bookId,
      accessType: req.body.accessType,
      price: req.body.price,
    });

    sendSuccess(res, pricing, 'Pricing added successfully', 201);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  addBookPricing,
};
