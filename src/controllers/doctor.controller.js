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
        college: { select: { id: true, name: true } },
        department: { select: { id: true, name: true } },
        books: {
          include: {
            category: true,
          },
          take: 10,
        },
        _count: {
          select: {
            books: true,
            materials: true,
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

/**
 * Get doctor statistics (for authenticated doctor — mobile dashboard)
 * totalMaterials, totalDownloads, totalStudents (unique buyers/downloaders), averageRating
 */
const getDoctorStats = async (req, res, next) => {
  try {
    const doctorId = req.user?.doctor?.id || req.params?.id;
    if (!doctorId) {
      throw new NotFoundError('Doctor not found');
    }

    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      select: { id: true },
    });
    if (!doctor) {
      throw new NotFoundError('Doctor not found');
    }

    const [materialCount, materialAgg, bookIds, materialIds] = await Promise.all([
      prisma.material.count({ where: { doctorId } }),
      prisma.material.aggregate({
        where: { doctorId },
        _sum: { downloads: true },
        _avg: { rating: true },
      }),
      prisma.book.findMany({ where: { doctorId }, select: { id: true } }).then((b) => b.map((x) => x.id)),
      prisma.material.findMany({ where: { doctorId }, select: { id: true } }).then((m) => m.map((x) => x.id)),
    ]);

    const refIds = [...bookIds, ...materialIds];
    const [orderItemsForStudents, reviewAgg] = await Promise.all([
      refIds.length === 0
        ? []
        : prisma.orderItem
            .findMany({
              where: {
                referenceType: { in: ['BOOK', 'MATERIAL'] },
                referenceId: { in: refIds },
              },
              select: { order: { select: { userId: true } } },
            })
            .then((items) => items.map((i) => i.order.userId).filter(Boolean)),
      bookIds.length === 0
        ? { _avg: { rating: null }, _count: { id: 0 } }
        : prisma.review.aggregate({
            where: { targetType: 'BOOK', targetId: { in: bookIds } },
            _avg: { rating: true },
            _count: { id: true },
          }),
    ]);

    const totalStudents = [...new Set(orderItemsForStudents)].length;
    const reviewAvg = reviewAgg._count.id > 0 ? reviewAgg._avg.rating : null;

    const totalDownloads = materialAgg._sum?.downloads ?? 0;
    const materialRatingAvg = materialAgg._avg?.rating ?? null;
    const averageRating =
      materialRatingAvg !== null && reviewAvg !== null
        ? (materialRatingAvg + reviewAvg) / 2
        : materialRatingAvg ?? reviewAvg ?? 0;

    const stats = {
      totalMaterials: materialCount,
      totalDownloads: Number(totalDownloads),
      totalStudents,
      averageRating: Math.round(Number(averageRating) * 10) / 10,
      totalBooks: await prisma.book.count({ where: { doctorId } }),
    };

    sendSuccess(res, stats, 'Doctor statistics retrieved successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor,
  getDoctorStats,
};


