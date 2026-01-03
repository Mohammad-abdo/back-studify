/**
 * Print Option Controller
 * Handles print option-related HTTP requests
 */

const prisma = require('../config/database');
const { sendSuccess, sendPaginated, getPaginationParams, buildPagination } = require('../utils/response');
const { NotFoundError } = require('../utils/errors');

/**
 * Get all print options
 */
const getPrintOptions = async (req, res, next) => {
  try {
    const { page, limit } = getPaginationParams(req.query.page, req.query.limit);
    const { bookId } = req.query;

    const where = {
      ...(bookId && { bookId }),
    };

    const [printOptions, total] = await Promise.all([
      prisma.printOption.findMany({
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
      prisma.printOption.count({ where }),
    ]);

    const pagination = buildPagination(page, limit, total);
    sendPaginated(res, printOptions, pagination, 'Print options retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get print option by ID
 */
const getPrintOptionById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const printOption = await prisma.printOption.findUnique({
      where: { id },
      include: {
        book: true,
      },
    });

    if (!printOption) {
      throw new NotFoundError('Print option not found');
    }

    sendSuccess(res, printOption, 'Print option retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Create print option
 */
const createPrintOption = async (req, res, next) => {
  try {
    const { bookId, colorType, paperSize, pricePerPage } = req.body;

    // Check if book exists
    const book = await prisma.book.findUnique({
      where: { id: bookId },
    });

    if (!book) {
      throw new NotFoundError('Book not found');
    }

    const printOption = await prisma.printOption.create({
      data: {
        bookId,
        colorType,
        paperSize,
        pricePerPage,
      },
      include: {
        book: true,
      },
    });

    sendSuccess(res, printOption, 'Print option created successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Update print option
 */
const updatePrintOption = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { colorType, paperSize, pricePerPage } = req.body;

    const existingPrintOption = await prisma.printOption.findUnique({
      where: { id },
    });

    if (!existingPrintOption) {
      throw new NotFoundError('Print option not found');
    }

    const updateData = {};
    if (colorType !== undefined) updateData.colorType = colorType;
    if (paperSize !== undefined) updateData.paperSize = paperSize;
    if (pricePerPage !== undefined) updateData.pricePerPage = pricePerPage;

    const printOption = await prisma.printOption.update({
      where: { id },
      data: updateData,
      include: {
        book: true,
      },
    });

    sendSuccess(res, printOption, 'Print option updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete print option
 */
const deletePrintOption = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingPrintOption = await prisma.printOption.findUnique({
      where: { id },
    });

    if (!existingPrintOption) {
      throw new NotFoundError('Print option not found');
    }

    await prisma.printOption.delete({
      where: { id },
    });

    sendSuccess(res, null, 'Print option deleted successfully', 204);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPrintOptions,
  getPrintOptionById,
  createPrintOption,
  updatePrintOption,
  deletePrintOption,
};


