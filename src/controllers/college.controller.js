/**
 * College Controller
 * Handles college-related HTTP requests (Admin only)
 */

const prisma = require('../config/database');
const { sendSuccess, sendPaginated, getPaginationParams, buildPagination } = require('../utils/response');
const { NotFoundError } = require('../utils/errors');
const { validateBody } = require('../middleware/validation.middleware');
const { z } = require('zod');

/**
 * Get all colleges
 */
const getColleges = async (req, res, next) => {
  try {
    const { page, limit } = getPaginationParams(req.query.page, req.query.limit);
    const { search } = req.query;

    const where = {
      ...(search && {
        name: { contains: search, mode: 'insensitive' },
      }),
    };

    const [colleges, total] = await Promise.all([
      prisma.college.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          departments: true,
          _count: {
            select: {
              students: true,
              books: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.college.count({ where }),
    ]);

    const pagination = buildPagination(page, limit, total);

    sendPaginated(res, colleges, pagination, 'Colleges retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get college by ID
 */
const getCollegeById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const college = await prisma.college.findUnique({
      where: { id },
      include: {
        departments: true,
        students: {
          take: 10,
          include: {
            user: {
              select: {
                id: true,
                phone: true,
                email: true,
              },
            },
          },
        },
        books: {
          take: 10,
          include: {
            category: true,
            doctor: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            students: true,
            books: true,
            departments: true,
          },
        },
      },
    });

    if (!college) {
      throw new NotFoundError('College not found');
    }

    sendSuccess(res, college, 'College retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Create college (Admin only)
 */
const createCollege = async (req, res, next) => {
  try {
    const { name } = req.body;

    const college = await prisma.college.create({
      data: { name },
      include: {
        departments: true,
      },
    });

    sendSuccess(res, college, 'College created successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Update college (Admin only)
 */
const updateCollege = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const existingCollege = await prisma.college.findUnique({
      where: { id },
    });

    if (!existingCollege) {
      throw new NotFoundError('College not found');
    }

    const college = await prisma.college.update({
      where: { id },
      data: { name },
      include: {
        departments: true,
      },
    });

    sendSuccess(res, college, 'College updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete college (Admin only)
 */
const deleteCollege = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingCollege = await prisma.college.findUnique({
      where: { id },
    });

    if (!existingCollege) {
      throw new NotFoundError('College not found');
    }

    await prisma.college.delete({
      where: { id },
    });

    sendSuccess(res, null, 'College deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getColleges,
  getCollegeById,
  createCollege,
  updateCollege,
  deleteCollege,
};

