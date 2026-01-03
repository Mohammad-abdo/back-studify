/**
 * Doctor Controller
 * Handles doctor-related HTTP requests (Admin only for CRUD)
 */

const prisma = require('../config/database');
const { sendSuccess, sendPaginated, getPaginationParams, buildPagination } = require('../utils/response');
const { NotFoundError } = require('../utils/errors');

/**
 * Get all doctors
 */
const getDoctors = async (req, res, next) => {
  try {
    const { page, limit } = getPaginationParams(req.query.page, req.query.limit);
    const { search, approvalStatus } = req.query;

    const where = {
      ...(approvalStatus && { approvalStatus }),
      ...(search && {
        OR: [
          { name: { contains: search } },
          { specialization: { contains: search } },
          { user: { phone: { contains: search } } },
          { user: { email: { contains: search } } },
        ],
      }),
    };

    const [doctors, total] = await Promise.all([
      prisma.doctor.findMany({
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
          _count: {
            select: {
              books: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.doctor.count({ where }),
    ]);

    const pagination = buildPagination(page, limit, total);
    sendPaginated(res, doctors, pagination, 'Doctors retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get doctor by ID
 */
const getDoctorById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const doctor = await prisma.doctor.findUnique({
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
        books: {
          include: {
            category: true,
          },
          take: 10,
        },
        _count: {
          select: {
            books: true,
          },
        },
      },
    });

    if (!doctor) {
      throw new NotFoundError('Doctor not found');
    }

    sendSuccess(res, doctor, 'Doctor retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Update doctor (Admin only)
 */
const updateDoctor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, specialization } = req.body;

    const existingDoctor = await prisma.doctor.findUnique({
      where: { id },
    });

    if (!existingDoctor) {
      throw new NotFoundError('Doctor not found');
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (specialization !== undefined) updateData.specialization = specialization;

    const doctor = await prisma.doctor.update({
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
      },
    });

    sendSuccess(res, doctor, 'Doctor updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete doctor (Admin only)
 */
const deleteDoctor = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingDoctor = await prisma.doctor.findUnique({
      where: { id },
    });

    if (!existingDoctor) {
      throw new NotFoundError('Doctor not found');
    }

    await prisma.doctor.delete({
      where: { id },
    });

    sendSuccess(res, null, 'Doctor deleted successfully', 204);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor,
};


