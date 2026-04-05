const bookRepository = require('../repositories/bookRepository');
const { buildPagination, getPaginationParams } = require('../utils/response');
const { NotFoundError, AuthorizationError } = require('../utils/errors');
const { APPROVAL_STATUS } = require('../utils/constants');

const parseImageUrls = (book) => {
  let parsedImageUrls = [];

  if (book.imageUrls) {
    try {
      parsedImageUrls = typeof book.imageUrls === 'string'
        ? JSON.parse(book.imageUrls)
        : book.imageUrls;

      if (!Array.isArray(parsedImageUrls)) {
        parsedImageUrls = [];
      }
    } catch (error) {
      console.error('Error parsing imageUrls for book', book.id, error);
      parsedImageUrls = [];
    }
  }

  return {
    ...book,
    imageUrls: parsedImageUrls,
    type: 'BOOK',
  };
};

const stringifyImageUrls = (imageUrls) => (
  imageUrls && Array.isArray(imageUrls) && imageUrls.length > 0
    ? JSON.stringify(imageUrls)
    : null
);

const buildBookUpdateData = ({ title, description, fileUrl, imageUrls, totalPages, categoryId, collegeId, departmentId }) => {
  const updateData = {};
  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (fileUrl !== undefined) updateData.fileUrl = fileUrl;
  if (imageUrls !== undefined) updateData.imageUrls = stringifyImageUrls(imageUrls);
  if (totalPages !== undefined) updateData.totalPages = totalPages;
  if (categoryId !== undefined) updateData.categoryId = categoryId;
  if (collegeId !== undefined) updateData.collegeId = collegeId || null;
  if (departmentId !== undefined) updateData.departmentId = departmentId || null;
  return updateData;
};

const getBooks = async (query) => {
  const { page, limit, skip } = getPaginationParams(query.page, query.limit);
  const { categoryId, collegeId, departmentId, doctorId, search, approvalStatus } = query;

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
    bookRepository.findBooks({ where, skip, take: limit }),
    bookRepository.countBooks(where),
  ]);

  return {
    data: books.map(parseImageUrls),
    pagination: buildPagination(page, limit, total),
  };
};

const getBookById = async ({ id }) => {
  const book = await bookRepository.findBookByIdWithDetails(id);

  if (!book) {
    throw new NotFoundError('Book not found');
  }

  return parseImageUrls(book);
};

const createBook = async ({ userId, title, description, fileUrl, imageUrls, totalPages, categoryId, collegeId, departmentId }) => {
  const doctor = await bookRepository.findDoctorByUserId(userId);

  if (!doctor) {
    throw new AuthorizationError('Only doctors can create books');
  }

  return bookRepository.createBook({
    title,
    description,
    fileUrl,
    imageUrls: stringifyImageUrls(imageUrls),
    totalPages,
    categoryId,
    doctorId: doctor.id,
    collegeId: collegeId || null,
    departmentId: departmentId || null,
    approvalStatus: APPROVAL_STATUS.PENDING,
  });
};

const updateBook = async ({ userId, userType, id, ...bookData }) => {
  const existingBook = await bookRepository.findBookById(id);

  if (!existingBook) {
    throw new NotFoundError('Book not found');
  }

  const updateData = buildBookUpdateData(bookData);

  if (userType === 'ADMIN') {
    return bookRepository.updateBook(id, updateData);
  }

  const doctor = await bookRepository.findDoctorByUserId(userId);

  if (!doctor) {
    throw new AuthorizationError('Only doctors or admins can update books');
  }

  if (existingBook.doctorId !== doctor.id) {
    throw new AuthorizationError('You can only update your own books');
  }

  if (Object.keys(updateData).length > 0) {
    updateData.approvalStatus = APPROVAL_STATUS.PENDING;
  }

  return bookRepository.updateBook(id, updateData);
};

const deleteBook = async ({ userId, id }) => {
  const doctor = await bookRepository.findDoctorByUserId(userId);

  if (!doctor) {
    throw new AuthorizationError('Only doctors can delete books');
  }

  const existingBook = await bookRepository.findBookById(id);

  if (!existingBook) {
    throw new NotFoundError('Book not found');
  }

  if (existingBook.doctorId !== doctor.id) {
    throw new AuthorizationError('You can only delete your own books');
  }

  await bookRepository.deleteBook(id);
};

const addBookPricing = async ({ userId, bookId, accessType, price }) => {
  const doctor = await bookRepository.findDoctorByUserId(userId);

  if (!doctor) {
    throw new AuthorizationError('Only doctors can add pricing');
  }

  const book = await bookRepository.findBookById(bookId);

  if (!book) {
    throw new NotFoundError('Book not found');
  }

  if (book.doctorId !== doctor.id) {
    throw new AuthorizationError('You can only add pricing to your own books');
  }

  return bookRepository.upsertBookPricing({
    bookId,
    accessType,
    price,
    approvalStatus: APPROVAL_STATUS.PENDING,
  });
};

module.exports = {
  getBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  addBookPricing,
};
