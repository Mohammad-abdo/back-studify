/**
 * Print Option Controller
 * Handles print option-related HTTP requests
 */

const prisma = require('../config/database');
const { sendSuccess, sendPaginated, getPaginationParams, buildPagination } = require('../utils/response');
const { NotFoundError, BadRequestError } = require('../utils/errors');
const { getFileUrl } = require('../services/fileUpload.service');

/**
 * Get all print options
 */
const getPrintOptions = async (req, res, next) => {
  try {
    const { page, limit } = getPaginationParams(req.query.page, req.query.limit);
    const { bookId, materialId, hasUploadedFile } = req.query;

    const where = {
      ...(bookId && { bookId }),
      ...(materialId && { materialId }),
      ...(hasUploadedFile === 'true' && { uploadedFileUrl: { not: null } }),
      ...(hasUploadedFile === 'false' && { uploadedFileUrl: null }),
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
              totalPages: true,
            },
          },
          material: {
            select: {
              id: true,
              title: true,
              totalPages: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
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
        book: {
          select: {
            id: true,
            title: true,
            totalPages: true,
            description: true,
          },
        },
        material: {
          select: {
            id: true,
            title: true,
            totalPages: true,
            description: true,
          },
        },
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
    const { bookId, materialId, uploadedFileUrl, colorType, copies, paperType, doubleSide } = req.body;

    // Validate that at least one source is provided
    if (!bookId && !materialId && !uploadedFileUrl) {
      throw new BadRequestError('Either bookId, materialId, or uploadedFileUrl must be provided');
    }

    // If bookId is provided, verify book exists
    if (bookId) {
      const book = await prisma.book.findUnique({
        where: { id: bookId },
      });
      if (!book) {
        throw new NotFoundError('Book not found');
      }
    }

    // If materialId is provided, verify material exists
    if (materialId) {
      const material = await prisma.material.findUnique({
        where: { id: materialId },
      });
      if (!material) {
        throw new NotFoundError('Material not found');
      }
    }

    const printOption = await prisma.printOption.create({
      data: {
        bookId: bookId || null,
        materialId: materialId || null,
        uploadedFileUrl: uploadedFileUrl || null,
        colorType,
        copies,
        paperType,
        doubleSide,
      },
      include: {
        book: {
          select: {
            id: true,
            title: true,
            totalPages: true,
          },
        },
        material: {
          select: {
            id: true,
            title: true,
            totalPages: true,
          },
        },
      },
    });

    sendSuccess(res, printOption, 'Print option created successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Create print option with file upload
 */
const createPrintOptionWithUpload = async (req, res, next) => {
  try {
    const { colorType, copies, paperType, doubleSide, totalPages } = req.body;
    const uploadedFile = req.file;

    if (!uploadedFile) {
      throw new BadRequestError('File is required');
    }

    // Get file URL
    const uploadedFileUrl = getFileUrl(uploadedFile.filename);

    const printOption = await prisma.printOption.create({
      data: {
        bookId: null,
        materialId: null,
        uploadedFileUrl,
        colorType,
        copies,
        paperType,
        doubleSide,
      },
    });

    sendSuccess(res, {
      ...printOption,
      uploadedFileUrl,
      totalPages: totalPages || null,
    }, 'Print option created successfully with uploaded file', 201);
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
    const { bookId, materialId, uploadedFileUrl, colorType, copies, paperType, doubleSide } = req.body;

    const existingPrintOption = await prisma.printOption.findUnique({
      where: { id },
    });

    if (!existingPrintOption) {
      throw new NotFoundError('Print option not found');
    }

    // If bookId is provided, verify book exists
    if (bookId) {
      const book = await prisma.book.findUnique({
        where: { id: bookId },
      });
      if (!book) {
        throw new NotFoundError('Book not found');
      }
    }

    // If materialId is provided, verify material exists
    if (materialId) {
      const material = await prisma.material.findUnique({
        where: { id: materialId },
      });
      if (!material) {
        throw new NotFoundError('Material not found');
      }
    }

    const updateData = {};
    if (bookId !== undefined) updateData.bookId = bookId || null;
    if (materialId !== undefined) updateData.materialId = materialId || null;
    if (uploadedFileUrl !== undefined) updateData.uploadedFileUrl = uploadedFileUrl || null;
    if (colorType !== undefined) updateData.colorType = colorType;
    if (copies !== undefined) updateData.copies = copies;
    if (paperType !== undefined) updateData.paperType = paperType;
    if (doubleSide !== undefined) updateData.doubleSide = doubleSide;

    const printOption = await prisma.printOption.update({
      where: { id },
      data: updateData,
      include: {
        book: {
          select: {
            id: true,
            title: true,
            totalPages: true,
          },
        },
        material: {
          select: {
            id: true,
            title: true,
            totalPages: true,
          },
        },
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

/**
 * Calculate a print quote for a given print option
 * The print option already contains copies, paperType, colorType, and doubleSide
 * We calculate the total price based on the source (book/material/uploaded file)
 */
const getPrintQuote = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Load print option with related book/material to get page count and pricing
    const printOption = await prisma.printOption.findUnique({
      where: { id },
      include: {
        book: {
          select: {
            id: true,
            title: true,
            totalPages: true,
          },
        },
        material: {
          select: {
            id: true,
            title: true,
            totalPages: true,
          },
        },
      },
    });

    if (!printOption) {
      throw new NotFoundError('Print option not found');
    }

    // Determine source and get page count
    let sourceType = null;
    let sourceId = null;
    let sourceTitle = null;
    let totalPages = null;
    let pricePerPage = null;

    if (printOption.bookId && printOption.book) {
      sourceType = 'BOOK';
      sourceId = printOption.book.id;
      sourceTitle = printOption.book.title;
      totalPages = printOption.book.totalPages;

      // Get PRINT pricing from BookPricing
      const bookPricing = await prisma.bookPricing.findUnique({
        where: {
          bookId_accessType: {
            bookId: printOption.book.id,
            accessType: 'PRINT',
          },
        },
      });

      if (!bookPricing) {
        throw new BadRequestError('No PRINT pricing found for this book');
      }
      pricePerPage = bookPricing.price;
    } else if (printOption.materialId && printOption.material) {
      sourceType = 'MATERIAL';
      sourceId = printOption.material.id;
      sourceTitle = printOption.material.title;
      totalPages = printOption.material.totalPages || 0;

      // Get PRINT pricing from MaterialPricing
      const materialPricing = await prisma.materialPricing.findUnique({
        where: {
          materialId_accessType: {
            materialId: printOption.material.id,
            accessType: 'PRINT',
          },
        },
      });

      if (!materialPricing) {
        throw new BadRequestError('No PRINT pricing found for this material');
      }
      pricePerPage = materialPricing.price;
    } else if (printOption.uploadedFileUrl) {
      sourceType = 'UPLOADED_FILE';
      sourceTitle = 'Uploaded File';
      // For uploaded files, we need to estimate pages or require it in the request
      // For now, throw error asking for page count
      throw new BadRequestError('Page count must be provided for uploaded files');
    } else {
      throw new BadRequestError('Print option has no valid source (book, material, or uploaded file)');
    }

    if (!totalPages || totalPages <= 0) {
      throw new BadRequestError('Source has no valid page count');
    }

    // Calculate sheets needed
    // If double-sided, each sheet holds 2 pages
    const pagesPerSheet = printOption.doubleSide ? 2 : 1;
    const sheetsPerCopy = Math.ceil(totalPages / pagesPerSheet);
    const totalSheets = sheetsPerCopy * printOption.copies;

    // Calculate total price
    const totalPrice = parseFloat((totalSheets * pricePerPage).toFixed(2));

    const quote = {
      printOptionId: printOption.id,
      source: {
        type: sourceType,
        id: sourceId,
        title: sourceTitle,
        totalPages,
      },
      configuration: {
        copies: printOption.copies,
        paperType: printOption.paperType,
        colorType: printOption.colorType,
        doubleSide: printOption.doubleSide,
      },
      pricing: {
        pricePerPage,
        sheetsPerCopy,
        totalSheets,
        totalPrice,
      },
    };

    sendSuccess(res, quote, 'Print quote calculated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Create a print order from a print option
 * Creates an Order with referenceType = PRINT_OPTION
 */
const createPrintOrder = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    // Get the print option with quote details
    const printOption = await prisma.printOption.findUnique({
      where: { id },
      include: {
        book: {
          select: {
            id: true,
            title: true,
            totalPages: true,
          },
        },
        material: {
          select: {
            id: true,
            title: true,
            totalPages: true,
          },
        },
      },
    });

    if (!printOption) {
      throw new NotFoundError('Print option not found');
    }

    // Calculate pricing (same logic as getPrintQuote)
    let sourceType = null;
    let sourceId = null;
    let totalPages = null;
    let pricePerPage = null;

    if (printOption.bookId && printOption.book) {
      sourceType = 'BOOK';
      sourceId = printOption.book.id;
      totalPages = printOption.book.totalPages;

      const bookPricing = await prisma.bookPricing.findUnique({
        where: {
          bookId_accessType: {
            bookId: printOption.book.id,
            accessType: 'PRINT',
          },
        },
      });

      if (!bookPricing) {
        throw new BadRequestError('No PRINT pricing found for this book');
      }
      pricePerPage = bookPricing.price;
    } else if (printOption.materialId && printOption.material) {
      sourceType = 'MATERIAL';
      sourceId = printOption.material.id;
      totalPages = printOption.material.totalPages || 0;

      const materialPricing = await prisma.materialPricing.findUnique({
        where: {
          materialId_accessType: {
            materialId: printOption.material.id,
            accessType: 'PRINT',
          },
        },
      });

      if (!materialPricing) {
        throw new BadRequestError('No PRINT pricing found for this material');
      }
      pricePerPage = materialPricing.price;
    } else if (printOption.uploadedFileUrl) {
      sourceType = 'UPLOADED_FILE';
      throw new BadRequestError('Page count must be provided for uploaded files. Please create print option with page count first.');
    } else {
      throw new BadRequestError('Print option has no valid source');
    }

    if (!totalPages || totalPages <= 0) {
      throw new BadRequestError('Source has no valid page count');
    }

    // Calculate total price
    const pagesPerSheet = printOption.doubleSide ? 2 : 1;
    const sheetsPerCopy = Math.ceil(totalPages / pagesPerSheet);
    const totalSheets = sheetsPerCopy * printOption.copies;
    const totalPrice = parseFloat((totalSheets * pricePerPage).toFixed(2));

    // Create order with PRINT_OPTION reference type (address from body or default)
    const address = (req.body?.address && String(req.body.address).trim()) ? String(req.body.address).trim() : 'Address not provided';
    const order = await prisma.order.create({
      data: {
        userId,
        total: totalPrice,
        status: 'CREATED',
        orderType: 'PRINT',
        address,
        items: {
          create: [
            {
              referenceType: 'PRINT_OPTION',
              referenceId: printOption.id,
              quantity: printOption.copies,
              price: totalPrice,
            },
          ],
        },
      },
      include: {
        items: true,
      },
    });

    sendSuccess(res, order, 'Print order created successfully', 201);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPrintOptions,
  getPrintOptionById,
  createPrintOption,
  createPrintOptionWithUpload,
  updatePrintOption,
  deletePrintOption,
  getPrintQuote,
  createPrintOrder,
};


