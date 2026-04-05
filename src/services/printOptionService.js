const printOptionRepository = require('../repositories/printOptionRepository');
const contentRepository = require('../repositories/contentRepository');
const orderRepository = require('../repositories/orderRepository');
const { buildPagination, getPaginationParams } = require('../utils/response');
const { NotFoundError, BadRequestError } = require('../utils/errors');
const { getFileUrl } = require('./fileUpload.service');

const DEFAULT_UPLOAD_PRINT_PRICE_PER_SHEET = Number(process.env.PRINT_UPLOAD_PRICE_PER_SHEET) || 0.5;

const getPrintOptionOrThrow = async (id) => {
  const printOption = await printOptionRepository.findPrintOptionById(id);

  if (!printOption) {
    throw new NotFoundError('Print option not found');
  }

  return printOption;
};

const resolveQuoteSource = async (printOption, uploadedFileMessage) => {
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

    const bookPricing = await contentRepository.findBookPrintPricing(printOption.book.id);
    if (!bookPricing) {
      throw new BadRequestError('No PRINT pricing found for this book');
    }
    pricePerPage = bookPricing.price;
  } else if (printOption.materialId && printOption.material) {
    sourceType = 'MATERIAL';
    sourceId = printOption.material.id;
    sourceTitle = printOption.material.title;
    totalPages = printOption.material.totalPages || 0;

    const materialPricing = await contentRepository.findMaterialPrintPricing(printOption.material.id);
    if (!materialPricing) {
      throw new BadRequestError('No PRINT pricing found for this material');
    }
    pricePerPage = materialPricing.price;
  } else if (printOption.uploadedFileUrl) {
    throw new BadRequestError(uploadedFileMessage);
  } else {
    throw new BadRequestError('Print option has no valid source (book, material, or uploaded file)');
  }

  if (!totalPages || totalPages <= 0) {
    throw new BadRequestError('Source has no valid page count');
  }

  return {
    sourceType,
    sourceId,
    sourceTitle,
    totalPages,
    pricePerPage,
  };
};

const getPrintOptions = async ({ page, limit, bookId, materialId, hasUploadedFile }) => {
  const paginationParams = getPaginationParams(page, limit);
  const where = {
    ...(bookId && { bookId }),
    ...(materialId && { materialId }),
    ...(hasUploadedFile === 'true' && { uploadedFileUrl: { not: null } }),
    ...(hasUploadedFile === 'false' && { uploadedFileUrl: null }),
  };

  const [printOptions, total] = await Promise.all([
    printOptionRepository.findPrintOptions({
      where,
      skip: paginationParams.skip,
      take: paginationParams.limit,
    }),
    printOptionRepository.countPrintOptions(where),
  ]);

  return {
    data: printOptions,
    pagination: buildPagination(paginationParams.page, paginationParams.limit, total),
  };
};

const getPrintOptionsByContentId = async ({ id, page, limit }) => {
  const contentId = id;

  if (!contentId || typeof contentId !== 'string' || !contentId.trim()) {
    throw new BadRequestError('Content ID (book or material) is required in the path');
  }

  const paginationParams = getPaginationParams(page, limit);
  const [book, material] = await Promise.all([
    contentRepository.findBookBasicById(contentId),
    contentRepository.findMaterialBasicById(contentId),
  ]);

  let where;
  if (book) {
    where = { bookId: contentId };
  } else if (material) {
    where = { materialId: contentId };
  } else {
    throw new NotFoundError('Book or material not found');
  }

  const [printOptions, total] = await Promise.all([
    printOptionRepository.findPrintOptions({
      where,
      skip: paginationParams.skip,
      take: paginationParams.limit,
    }),
    printOptionRepository.countPrintOptions(where),
  ]);

  return {
    data: printOptions,
    pagination: buildPagination(paginationParams.page, paginationParams.limit, total),
  };
};

const getPrintOptionById = async ({ id }) =>
  getPrintOptionOrThrow(id);

const createPrintOption = async ({ bookId, materialId, uploadedFileUrl, colorType, copies, paperType, doubleSide, enabled }) => {
  if (!bookId && !materialId && !uploadedFileUrl) {
    throw new BadRequestError('Either bookId, materialId, or uploadedFileUrl must be provided');
  }

  if (bookId) {
    const book = await contentRepository.findBookBasicById(bookId);
    if (!book) {
      throw new NotFoundError('Book not found');
    }
  }

  if (materialId) {
    const material = await contentRepository.findMaterialBasicById(materialId);
    if (!material) {
      throw new NotFoundError('Material not found');
    }
  }

  return printOptionRepository.createPrintOption(
    {
      bookId: bookId || null,
      materialId: materialId || null,
      uploadedFileUrl: uploadedFileUrl || null,
      colorType,
      copies,
      paperType,
      doubleSide,
      enabled: enabled !== false,
    },
    printOptionRepository.printOptionListInclude,
  );
};

const createPrintOptionWithUpload = async ({ file, colorType, copies, paperType, doubleSide, totalPages }) => {
  if (!file) {
    throw new BadRequestError('File is required');
  }

  const uploadedFileUrl = getFileUrl(file.filename);
  const printOption = await printOptionRepository.createPrintOption({
    bookId: null,
    materialId: null,
    uploadedFileUrl,
    colorType,
    copies,
    paperType,
    doubleSide,
    enabled: true,
  });

  let price = null;
  const pagesNum = totalPages != null ? Number(totalPages) : null;
  if (pagesNum != null && pagesNum > 0) {
    const pagesPerSheet = printOption.doubleSide ? 2 : 1;
    const sheetsPerCopy = Math.ceil(pagesNum / pagesPerSheet);
    const totalSheets = sheetsPerCopy * printOption.copies;
    price = parseFloat((totalSheets * DEFAULT_UPLOAD_PRINT_PRICE_PER_SHEET).toFixed(2));
  }

  return {
    ...printOption,
    uploadedFileUrl,
    totalPages: totalPages || null,
    price,
    paymentStatus: 'PENDING',
  };
};

const updatePrintOption = async ({ id, bookId, materialId, uploadedFileUrl, colorType, copies, paperType, doubleSide, enabled }) => {
  const existingPrintOption = await printOptionRepository.findPrintOptionBasicById(id);

  if (!existingPrintOption) {
    throw new NotFoundError('Print option not found');
  }

  if (bookId) {
    const book = await contentRepository.findBookBasicById(bookId);
    if (!book) {
      throw new NotFoundError('Book not found');
    }
  }

  if (materialId) {
    const material = await contentRepository.findMaterialBasicById(materialId);
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
  if (enabled !== undefined) updateData.enabled = Boolean(enabled);

  return printOptionRepository.updatePrintOption(id, updateData);
};

const deletePrintOption = async ({ id }) => {
  const existingPrintOption = await printOptionRepository.findPrintOptionBasicById(id);

  if (!existingPrintOption) {
    throw new NotFoundError('Print option not found');
  }

  await printOptionRepository.deletePrintOption(id);
};

const getPrintQuote = async ({ id }) => {
  const printOption = await getPrintOptionOrThrow(id);
  const source = await resolveQuoteSource(printOption, 'Page count must be provided for uploaded files');

  const pagesPerSheet = printOption.doubleSide ? 2 : 1;
  const sheetsPerCopy = Math.ceil(source.totalPages / pagesPerSheet);
  const totalSheets = sheetsPerCopy * printOption.copies;
  const totalPrice = parseFloat((totalSheets * source.pricePerPage).toFixed(2));

  return {
    printOptionId: printOption.id,
    source: {
      type: source.sourceType,
      id: source.sourceId,
      title: source.sourceTitle,
      totalPages: source.totalPages,
    },
    configuration: {
      copies: printOption.copies,
      paperType: printOption.paperType,
      colorType: printOption.colorType,
      doubleSide: printOption.doubleSide,
    },
    pricing: {
      pricePerPage: source.pricePerPage,
      sheetsPerCopy,
      totalSheets,
      totalPrice,
    },
  };
};

const createPrintOrder = async ({ id, userId, address }) => {
  const printOption = await getPrintOptionOrThrow(id);
  const source = await resolveQuoteSource(
    printOption,
    'Page count must be provided for uploaded files. Please create print option with page count first.',
  );

  const pagesPerSheet = printOption.doubleSide ? 2 : 1;
  const sheetsPerCopy = Math.ceil(source.totalPages / pagesPerSheet);
  const totalSheets = sheetsPerCopy * printOption.copies;
  const totalPrice = parseFloat((totalSheets * source.pricePerPage).toFixed(2));

  return orderRepository.createOrder(
    {
      userId,
      total: totalPrice,
      status: 'CREATED',
      orderType: 'PRINT',
      address: address && String(address).trim() ? String(address).trim() : 'Address not provided',
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
    {
      items: true,
    },
  );
};

module.exports = {
  getPrintOptions,
  getPrintOptionsByContentId,
  getPrintOptionById,
  createPrintOption,
  createPrintOptionWithUpload,
  updatePrintOption,
  deletePrintOption,
  getPrintQuote,
  createPrintOrder,
};
