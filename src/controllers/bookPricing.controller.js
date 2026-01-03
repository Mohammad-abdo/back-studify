/**
 * Book Pricing Controller
 * Handles book pricing-related HTTP requests
 */

const prisma = require('../config/database');
const { sendSuccess, sendPaginated, getPaginationParams, buildPagination } = require('../utils/response');
const { NotFoundError, ConflictError } = require('../utils/errors');
const { APPROVAL_STATUS } = require('../utils/constants');

/**
 * Get all book pricings
 */
const getBookPricings = async (req, res, next) => {
  try {
    const { page, limit } = getPaginationParams(req.query.page, req.query.limit);
    const { bookId, approvalStatus } = req.query;

    const where = {
      ...(bookId && { bookId }),
      ...(approvalStatus && { approvalStatus }),
    };

    const [pricings, total] = await Promise.all([
      prisma.bookPricing.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          book: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: { bookId: 'asc' },
      }),
      prisma.bookPricing.count({ where }),
    ]);

    const pagination = buildPagination(page, limit, total);
    sendPaginated(res, pricings, pagination, 'Book pricings retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get book pricing by ID
 */
const getBookPricingById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const pricing = await prisma.bookPricing.findUnique({
      where: { id },
      include: {
        book: true,
      },
    });

    if (!pricing) {
      throw new NotFoundError('Book pricing not found');
    }

    sendSuccess(res, pricing, 'Book pricing retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Create book pricing
 */
const createBookPricing = async (req, res, next) => {
  try {
    const { bookId, accessType, price } = req.body;

    // Check if book exists
    const book = await prisma.book.findUnique({
      where: { id: bookId },
    });

    if (!book) {
      throw new NotFoundError('Book not found');
    }

    // Check if pricing already exists for this access type
    const existingPricing = await prisma.bookPricing.findUnique({
      where: {
        bookId_accessType: {
          bookId,
          accessType,
        },
      },
    });

    if (existingPricing) {
      throw new ConflictError(`Pricing for ${accessType} already exists for this book`);
    }

    const pricing = await prisma.bookPricing.create({
      data: {
        bookId,
        accessType,
        price,
        approvalStatus: APPROVAL_STATUS.PENDING,
      },
      include: {
        book: true,
      },
    });

    sendSuccess(res, pricing, 'Book pricing created successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Update book pricing
 */
const updateBookPricing = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { price, approvalStatus } = req.body;

    const existingPricing = await prisma.bookPricing.findUnique({
      where: { id },
    });

    if (!existingPricing) {
      throw new NotFoundError('Book pricing not found');
    }

    const updateData = {};
    if (price !== undefined) updateData.price = price;
    if (approvalStatus !== undefined) updateData.approvalStatus = approvalStatus;

    const pricing = await prisma.bookPricing.update({
      where: { id },
      data: updateData,
      include: {
        book: true,
      },
    });

    sendSuccess(res, pricing, 'Book pricing updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete book pricing
 */
const deleteBookPricing = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingPricing = await prisma.bookPricing.findUnique({
      where: { id },
    });

    if (!existingPricing) {
      throw new NotFoundError('Book pricing not found');
    }

    await prisma.bookPricing.delete({
      where: { id },
    });

    sendSuccess(res, null, 'Book pricing deleted successfully', 204);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBookPricings,
  getBookPricingById,
  createBookPricing,
  updateBookPricing,
  deleteBookPricing,
};


