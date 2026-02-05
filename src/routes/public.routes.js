/**
 * Public Routes — College & Department
 * وحدة واحدة عامة (بدون تسجيل دخول) للكليات والأقسام
 * للاستخدام في: التسجيل، الصفحة الرئيسية، الفلاتر
 */

const express = require('express');
const router = express.Router();
const collegeController = require('../controllers/college.controller');
const prisma = require('../config/database');
const { sendSuccess, sendPaginated, getPaginationParams, buildPagination } = require('../utils/response');
const { NotFoundError } = require('../utils/errors');

// ============================================
// COLLEGES (Public — no auth)
// ============================================
router.get('/colleges', collegeController.getColleges);
router.get('/colleges/:id', collegeController.getCollegeById);

// ============================================
// DEPARTMENTS (Public — no auth)
// ============================================
router.get('/departments', async (req, res, next) => {
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
          college: {
            select: { id: true, name: true },
          },
          _count: {
            select: { students: true, books: true },
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
});

router.get('/departments/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        college: { select: { id: true, name: true } },
        _count: {
          select: { students: true, books: true },
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
});

module.exports = router;
