/**
 * Report Controller
 * Handles report-related HTTP requests (Admin only)
 */

const prisma = require('../config/database');
const { sendSuccess, sendPaginated, getPaginationParams, buildPagination } = require('../utils/response');
const { NotFoundError } = require('../utils/errors');

/**
 * Get all reports
 */
const getReports = async (req, res, next) => {
  try {
    const { page, limit } = getPaginationParams(req.query.page, req.query.limit);
    const { search } = req.query;

    const where = {
      ...(search && {
        OR: [
          { name: { contains: search } },
        ],
      }),
    };

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.report.count({ where }),
    ]);

    const pagination = buildPagination(page, limit, total);
    sendPaginated(res, reports, pagination, 'Reports retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get report by ID
 */
const getReportById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const report = await prisma.report.findUnique({
      where: { id },
    });

    if (!report) {
      throw new NotFoundError('Report not found');
    }

    sendSuccess(res, report, 'Report retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Create report (Admin only)
 */
const createReport = async (req, res, next) => {
  try {
    const { name, fileUrl } = req.body;

    const report = await prisma.report.create({
      data: {
        name,
        fileUrl,
      },
    });

    sendSuccess(res, report, 'Report created successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Update report (Admin only)
 */
const updateReport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, fileUrl } = req.body;

    const existingReport = await prisma.report.findUnique({
      where: { id },
    });

    if (!existingReport) {
      throw new NotFoundError('Report not found');
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (fileUrl !== undefined) updateData.fileUrl = fileUrl;

    const report = await prisma.report.update({
      where: { id },
      data: updateData,
    });

    sendSuccess(res, report, 'Report updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete report (Admin only)
 */
const deleteReport = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingReport = await prisma.report.findUnique({
      where: { id },
    });

    if (!existingReport) {
      throw new NotFoundError('Report not found');
    }

    await prisma.report.delete({
      where: { id },
    });

    sendSuccess(res, null, 'Report deleted successfully', 204);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getReports,
  getReportById,
  createReport,
  updateReport,
  deleteReport,
};


