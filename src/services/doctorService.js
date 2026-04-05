const doctorRepository = require('../repositories/doctorRepository');
const { buildPagination, getPaginationParams } = require('../utils/response');
const { NotFoundError } = require('../utils/errors');

const ensureDoctorExists = async (id) => {
  const doctor = await doctorRepository.findDoctorBasicById(id);

  if (!doctor) {
    throw new NotFoundError('Doctor not found');
  }

  return doctor;
};

const getDoctors = async ({ page, limit, search, approvalStatus }) => {
  const paginationParams = getPaginationParams(page, limit);
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
    doctorRepository.findDoctors({
      where,
      skip: paginationParams.skip,
      take: paginationParams.limit,
    }),
    doctorRepository.countDoctors(where),
  ]);

  return {
    data: doctors,
    pagination: buildPagination(paginationParams.page, paginationParams.limit, total),
  };
};

const getDoctorById = async ({ id }) => {
  const doctor = await doctorRepository.findDoctorById(id);

  if (!doctor) {
    throw new NotFoundError('Doctor not found');
  }

  return doctor;
};

const updateDoctor = async ({ id, name, specialization }) => {
  await ensureDoctorExists(id);

  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (specialization !== undefined) updateData.specialization = specialization;

  return doctorRepository.updateDoctor(id, updateData);
};

const deleteDoctor = async ({ id }) => {
  await ensureDoctorExists(id);
  await doctorRepository.deleteDoctor(id);
};

const getDoctorStats = async ({ user, params }) => {
  const doctorId = user?.doctor?.id || params?.id;

  if (!doctorId) {
    throw new NotFoundError('Doctor not found');
  }

  await ensureDoctorExists(doctorId);

  const [materialCount, materialAgg, bookRecords, materialRecords, totalBooks] = await Promise.all([
    doctorRepository.countMaterialsByDoctorId(doctorId),
    doctorRepository.aggregateMaterialStatsByDoctorId(doctorId),
    doctorRepository.findBookIdsByDoctorId(doctorId),
    doctorRepository.findMaterialIdsByDoctorId(doctorId),
    doctorRepository.countBooksByDoctorId(doctorId),
  ]);

  const bookIds = bookRecords.map((book) => book.id);
  const materialIds = materialRecords.map((material) => material.id);
  const referenceIds = [...bookIds, ...materialIds];

  const [orderItemsForStudents, reviewAgg] = await Promise.all([
    referenceIds.length === 0
      ? []
      : doctorRepository.findStudentUserIdsByReferenceIds(referenceIds),
    bookIds.length === 0
      ? { _avg: { rating: null }, _count: { id: 0 } }
      : doctorRepository.aggregateBookReviewStats(bookIds),
  ]);

  const totalStudents = new Set(
    orderItemsForStudents
      .map((item) => item.order?.userId)
      .filter(Boolean),
  ).size;

  const reviewAvg = reviewAgg._count.id > 0 ? reviewAgg._avg.rating : null;
  const totalDownloads = materialAgg._sum?.downloads ?? 0;
  const materialRatingAvg = materialAgg._avg?.rating ?? null;
  const averageRating =
    materialRatingAvg !== null && reviewAvg !== null
      ? (materialRatingAvg + reviewAvg) / 2
      : materialRatingAvg ?? reviewAvg ?? 0;

  return {
    totalMaterials: materialCount,
    totalDownloads: Number(totalDownloads),
    totalStudents,
    averageRating: Math.round(Number(averageRating) * 10) / 10,
    totalBooks,
  };
};

module.exports = {
  getDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor,
  getDoctorStats,
};
