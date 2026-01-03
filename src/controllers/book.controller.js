/**
 * Book Controller
 * Handles book-related HTTP requests
 */

const prisma = require('../config/database');
const { sendSuccess, sendPaginated, getPaginationParams, buildPagination } = require('../utils/response');
const { NotFoundError, AuthorizationError } = require('../utils/errors');
const { APPROVAL_STATUS } = require('../utils/constants');

/**
 * Get all books (with filters)
 */
const getBooks = async (req, res, next) => {
  try {
    const { page, limit } = getPaginationParams(req.query.page, req.query.limit);
    const { categoryId, collegeId, departmentId, doctorId, search, approvalStatus } = req.query;

    const where = {
      ...(categoryId && { categoryId }),
      ...(collegeId && { collegeId }),
      ...(departmentId && { departmentId }),
      ...(doctorId && { doctorId }),
      ...(approvalStatus && { approvalStatus }),
      ...(search && {
        OR: [
          { title: { contains: search } },
          { description: { contains: search } },
        ],
      }),
    };

    const [books, total] = await Promise.all([
      prisma.book.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          category: true,
          doctor: {
            include: {
              user: {
                select: {
                  id: true,
                  phone: true,
                  email: true,
                  avatarUrl: true,
                },
              },
            },
          },
          college: true,
          department: true,
          pricing: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.book.count({ where }),
    ]);

    // Parse imageUrls JSON for each book (with error handling)
    const booksWithParsedImages = books.map(book => {
      let parsedImageUrls = [];
      if (book.imageUrls) {
        try {
          parsedImageUrls = typeof book.imageUrls === 'string' 
            ? JSON.parse(book.imageUrls) 
            : book.imageUrls;
          // Ensure it's an array
          if (!Array.isArray(parsedImageUrls)) {
            parsedImageUrls = [];
          }
        } catch (error) {
          // If JSON parsing fails, default to empty array
          console.error('Error parsing imageUrls for book', book.id, error);
          parsedImageUrls = [];
        }
      }
      return {
        ...book,
        imageUrls: parsedImageUrls,
      };
    });

    const pagination = buildPagination(page, limit, total);

    sendPaginated(res, booksWithParsedImages, pagination, 'Books retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get book by ID
 */
const getBookById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const book = await prisma.book.findUnique({
      where: { id },
      include: {
        category: true,
        doctor: {
          include: {
            user: {
              select: {
                id: true,
                phone: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
        college: true,
        department: true,
        pricing: true,
      },
    });

    if (!book) {
      throw new NotFoundError('Book not found');
    }

    // Parse imageUrls JSON (with error handling)
    let parsedImageUrls = [];
    if (book.imageUrls) {
      try {
        parsedImageUrls = typeof book.imageUrls === 'string' 
          ? JSON.parse(book.imageUrls) 
          : book.imageUrls;
        // Ensure it's an array
        if (!Array.isArray(parsedImageUrls)) {
          parsedImageUrls = [];
        }
      } catch (error) {
        // If JSON parsing fails, default to empty array
        console.error('Error parsing imageUrls for book', book.id, error);
        parsedImageUrls = [];
      }
    }

    const parsedBook = {
      ...book,
      imageUrls: parsedImageUrls,
    };

    sendSuccess(res, parsedBook, 'Book retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Create book (Doctor only)
 */
const createBook = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { title, description, fileUrl, imageUrls, totalPages, categoryId, collegeId, departmentId } = req.body;

    // Check if user is a doctor
    const doctor = await prisma.doctor.findUnique({
      where: { userId },
    });

    if (!doctor) {
      throw new AuthorizationError('Only doctors can create books');
    }

    // Convert imageUrls array to JSON string (optional field)
    const imageUrlsJson = imageUrls && Array.isArray(imageUrls) && imageUrls.length > 0 
      ? JSON.stringify(imageUrls) 
      : null;

    const book = await prisma.book.create({
      data: {
        title,
        description,
        fileUrl,
        imageUrls: imageUrlsJson,
        totalPages,
        categoryId,
        doctorId: doctor.id,
        collegeId: collegeId || null,
        departmentId: departmentId || null,
        approvalStatus: APPROVAL_STATUS.PENDING,
      },
      include: {
        category: true,
        doctor: true,
        college: true,
        department: true,
      },
    });

    sendSuccess(res, book, 'Book created successfully. Waiting for admin approval.', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Update book (Doctor only, own books)
 */
const updateBook = async (req, res, next) => {
  try {
    const userId = req.userId;
    const userType = req.userType;
    const { id } = req.params;
    const { title, description, fileUrl, imageUrls, totalPages, categoryId, collegeId, departmentId } = req.body;

    // Check if book exists
    const existingBook = await prisma.book.findUnique({
      where: { id },
    });

    if (!existingBook) {
      throw new NotFoundError('Book not found');
    }

    // Admin can update any book
    if (userType === 'ADMIN') {
      const updateData = {};
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (fileUrl !== undefined) updateData.fileUrl = fileUrl;
      if (imageUrls !== undefined) {
        updateData.imageUrls = Array.isArray(imageUrls) && imageUrls.length > 0 
          ? JSON.stringify(imageUrls) 
          : null;
      }
      if (totalPages !== undefined) updateData.totalPages = totalPages;
      if (categoryId !== undefined) updateData.categoryId = categoryId;
      if (collegeId !== undefined) updateData.collegeId = collegeId || null;
      if (departmentId !== undefined) updateData.departmentId = departmentId || null;

      const book = await prisma.book.update({
        where: { id },
        data: updateData,
        include: {
          category: true,
          doctor: true,
          college: true,
          department: true,
        },
      });

      return sendSuccess(res, book, 'Book updated successfully');
    }

    // For doctors, check if they own the book
    const doctor = await prisma.doctor.findUnique({
      where: { userId },
    });

    if (!doctor) {
      throw new AuthorizationError('Only doctors or admins can update books');
    }

    if (existingBook.doctorId !== doctor.id) {
      throw new AuthorizationError('You can only update your own books');
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (fileUrl !== undefined) updateData.fileUrl = fileUrl;
    if (imageUrls !== undefined) {
      updateData.imageUrls = Array.isArray(imageUrls) && imageUrls.length > 0 
        ? JSON.stringify(imageUrls) 
        : null;
    }
    if (totalPages !== undefined) updateData.totalPages = totalPages;
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (collegeId !== undefined) updateData.collegeId = collegeId || null;
    if (departmentId !== undefined) updateData.departmentId = departmentId || null;

    // Reset approval status if content changed (for doctors)
    if (Object.keys(updateData).length > 0) {
      updateData.approvalStatus = APPROVAL_STATUS.PENDING;
    }

    const book = await prisma.book.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        doctor: true,
        college: true,
        department: true,
      },
    });

    sendSuccess(res, book, 'Book updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete book (Doctor only, own books)
 */
const deleteBook = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    // Check if user is a doctor
    const doctor = await prisma.doctor.findUnique({
      where: { userId },
    });

    if (!doctor) {
      throw new AuthorizationError('Only doctors can delete books');
    }

    // Check if book exists and belongs to this doctor
    const existingBook = await prisma.book.findUnique({
      where: { id },
    });

    if (!existingBook) {
      throw new NotFoundError('Book not found');
    }

    if (existingBook.doctorId !== doctor.id) {
      throw new AuthorizationError('You can only delete your own books');
    }

    await prisma.book.delete({
      where: { id },
    });

    sendSuccess(res, null, 'Book deleted successfully');
  } catch (error) {
    next(error);
  }
};

// Note: Book categories moved to category controller

/**
 * Add book pricing
 */
const addBookPricing = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { bookId, accessType, price } = req.body;

    // Check if user is a doctor
    const doctor = await prisma.doctor.findUnique({
      where: { userId },
    });

    if (!doctor) {
      throw new AuthorizationError('Only doctors can add pricing');
    }

    // Check if book exists and belongs to this doctor
    const book = await prisma.book.findUnique({
      where: { id: bookId },
    });

    if (!book) {
      throw new NotFoundError('Book not found');
    }

    if (book.doctorId !== doctor.id) {
      throw new AuthorizationError('You can only add pricing to your own books');
    }

    const pricing = await prisma.bookPricing.upsert({
      where: {
        bookId_accessType: {
          bookId,
          accessType,
        },
      },
      update: {
        price,
        approvalStatus: APPROVAL_STATUS.PENDING,
      },
      create: {
        bookId,
        accessType,
        price,
        approvalStatus: APPROVAL_STATUS.PENDING,
      },
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
