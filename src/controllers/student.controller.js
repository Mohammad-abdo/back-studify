/**
 * Student Controller
 * Handles student-related HTTP requests (Admin only for CRUD)
 */

const prisma = require('../config/database');
const { sendSuccess, sendPaginated, getPaginationParams, buildPagination } = require('../utils/response');
const { NotFoundError, ConflictError } = require('../utils/errors');

/**
 * Get all students
 */
const getStudents = async (req, res, next) => {
  try {
    const { page, limit } = getPaginationParams(req.query.page, req.query.limit);
    const { search, collegeId, departmentId } = req.query;

    const where = {
      ...(collegeId && { collegeId }),
      ...(departmentId && { departmentId }),
      ...(search && {
        OR: [
          { name: { contains: search } },
          { user: { phone: { contains: search } } },
          { user: { email: { contains: search } } },
        ],
      }),
    };

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              phone: true,
              email: true,
              avatarUrl: true,
              type: true,
              isActive: true,
              createdAt: true,
            },
          },
          college: true,
          department: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.student.count({ where }),
    ]);

    const pagination = buildPagination(page, limit, total);
    sendPaginated(res, students, pagination, 'Students retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get student by ID
 */
const getStudentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            phone: true,
            email: true,
            avatarUrl: true,
            type: true,
            isActive: true,
            createdAt: true,
          },
        },
        college: true,
        department: true,
      },
    });

    if (!student) {
      throw new NotFoundError('Student not found');
    }

    sendSuccess(res, student, 'Student retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Update student (Admin only)
 */
const updateStudent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, collegeId, departmentId } = req.body;

    const existingStudent = await prisma.student.findUnique({
      where: { id },
    });

    if (!existingStudent) {
      throw new NotFoundError('Student not found');
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (collegeId !== undefined) updateData.collegeId = collegeId || null;
    if (departmentId !== undefined) updateData.departmentId = departmentId || null;

    const student = await prisma.student.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            phone: true,
            email: true,
            avatarUrl: true,
            type: true,
            isActive: true,
          },
        },
        college: true,
        department: true,
      },
    });

    sendSuccess(res, student, 'Student updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete student (Admin only)
 */
const deleteStudent = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingStudent = await prisma.student.findUnique({
      where: { id },
    });

    if (!existingStudent) {
      throw new NotFoundError('Student not found');
    }

    await prisma.student.delete({
      where: { id },
    });

    sendSuccess(res, null, 'Student deleted successfully', 204);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
};


