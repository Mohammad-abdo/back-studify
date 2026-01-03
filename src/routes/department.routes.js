/**
 * Department Routes
 */

const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const { sendSuccess, sendPaginated, getPaginationParams, buildPagination, sendError } = require('../utils/response');
const { NotFoundError } = require('../utils/errors');
const { HTTP_STATUS } = require('../utils/constants');
const authenticate = require('../middleware/auth.middleware');
const { requireUserType } = require('../middleware/role.middleware');
const { validateBody } = require('../middleware/validation.middleware');
const { uuidSchema } = require('../utils/validators');
const { z } = require('zod');

/**
 * Get all departments
 */
const getDepartments = async (req, res, next) => {
  try {
    const { page, limit } = getPaginationParams(req.query.page, req.query.limit);
    const { collegeId, search } = req.query;

    const where = {
      ...(collegeId && { collegeId }),
      ...(search && {
        name: { contains: search, mode: 'insensitive' },
      }),
    };

    const [departments, total] = await Promise.all([
      prisma.department.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          college: true,
          _count: {
            select: {
              students: true,
              books: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.department.count({ where }),
    ]);

    const pagination = buildPagination(page, limit, total);

    sendPaginated(res, departments, pagination, 'Departments retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get department by ID
 */
const getDepartmentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        college: true,
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
          },
        },
        _count: {
          select: {
            students: true,
            books: true,
          },
        },
      },
    });

    if (!department) {
      throw new NotFoundError('Department not found');
    }

    sendSuccess(res, department, 'Department retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Create department (Admin only)
 */
const createDepartment = async (req, res, next) => {
  try {
    const { name, collegeId } = req.body;

    const college = await prisma.college.findUnique({
      where: { id: collegeId },
    });

    if (!college) {
      throw new NotFoundError('College not found');
    }

    const department = await prisma.department.create({
      data: { name, collegeId },
      include: {
        college: true,
      },
    });

    sendSuccess(res, department, 'Department created successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Update department (Admin only)
 */
const updateDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, collegeId } = req.body;

    const existingDepartment = await prisma.department.findUnique({
      where: { id },
    });

    if (!existingDepartment) {
      throw new NotFoundError('Department not found');
    }

    if (collegeId) {
      const college = await prisma.college.findUnique({
        where: { id: collegeId },
      });

      if (!college) {
        throw new NotFoundError('College not found');
      }
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (collegeId !== undefined) updateData.collegeId = collegeId;

    const department = await prisma.department.update({
      where: { id },
      data: updateData,
      include: {
        college: true,
      },
    });

    sendSuccess(res, department, 'Department updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete department (Admin only)
 */
const deleteDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingDepartment = await prisma.department.findUnique({
      where: { id },
    });

    if (!existingDepartment) {
      throw new NotFoundError('Department not found');
    }

    await prisma.department.delete({
      where: { id },
    });

    sendSuccess(res, null, 'Department deleted successfully');
  } catch (error) {
    next(error);
  }
};

// Public routes
router.get('/', getDepartments);
router.get('/:id', getDepartmentById);

// Protected routes (Admin only)
router.use(authenticate);
router.use(requireUserType('ADMIN'));

router.post('/', validateBody(z.object({
  name: z.string().min(2).max(200),
  collegeId: uuidSchema,
})), createDepartment);

router.put('/:id', validateBody(z.object({
  name: z.string().min(2).max(200).optional(),
  collegeId: uuidSchema.optional(),
})), updateDepartment);

router.delete('/:id', deleteDepartment);

module.exports = router;
