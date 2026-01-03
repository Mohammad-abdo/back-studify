/**
 * Import Log Controller
 * Handles import log-related HTTP requests (Admin only)
 */

const prisma = require('../config/database');
const { sendSuccess, sendPaginated, getPaginationParams, buildPagination } = require('../utils/response');
const { NotFoundError } = require('../utils/errors');

/**
 * Get all import logs
 */
const getImportLogs = async (req, res, next) => {
  try {
    const { page, limit } = getPaginationParams(req.query.page, req.query.limit);
    const { type, startDate, endDate } = req.query;

    const where = {
      ...(type && { type }),
      ...(startDate || endDate ? {
        createdAt: {
          ...(startDate && { gte: new Date(startDate) }),
          ...(endDate && { lte: new Date(endDate) }),
        },
      } : {}),
    };

    const [importLogs, total] = await Promise.all([
      prisma.importLog.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.importLog.count({ where }),
    ]);

    const pagination = buildPagination(page, limit, total);
    sendPaginated(res, importLogs, pagination, 'Import logs retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get import log by ID
 */
const getImportLogById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const importLog = await prisma.importLog.findUnique({
      where: { id },
    });

    if (!importLog) {
      throw new NotFoundError('Import log not found');
    }

    sendSuccess(res, importLog, 'Import log retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Create import log (Admin only)
 */
const createImportLog = async (req, res, next) => {
  try {
    const { type, fileUrl, success, failed } = req.body;

    const importLog = await prisma.importLog.create({
      data: {
        type,
        fileUrl,
        success: success || 0,
        failed: failed || 0,
      },
    });

    sendSuccess(res, importLog, 'Import log created successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete import log (Admin only)
 */
const deleteImportLog = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingImportLog = await prisma.importLog.findUnique({
      where: { id },
    });

    if (!existingImportLog) {
      throw new NotFoundError('Import log not found');
    }

    await prisma.importLog.delete({
      where: { id },
    });

    sendSuccess(res, null, 'Import log deleted successfully', 204);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getImportLogs,
  getImportLogById,
  createImportLog,
  deleteImportLog,
};


