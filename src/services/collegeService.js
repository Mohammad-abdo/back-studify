const collegeRepository = require('../repositories/collegeRepository');
const { buildPagination, getPaginationParams } = require('../utils/response');
const { NotFoundError } = require('../utils/errors');

const getColleges = async ({ page, limit, search }) => {
  const paginationParams = getPaginationParams(page, limit);
  const where = {
    ...(search && {
      name: { contains: search, mode: 'insensitive' },
    }),
  };

  const [colleges, total] = await Promise.all([
    collegeRepository.findColleges({
      where,
      skip: paginationParams.skip,
      take: paginationParams.limit,
    }),
    collegeRepository.countColleges(where),
  ]);

  return {
    data: colleges,
    pagination: buildPagination(paginationParams.page, paginationParams.limit, total),
  };
};

const getCollegeById = async ({ id }) => {
  const college = await collegeRepository.findCollegeByIdWithDetails(id);

  if (!college) {
    throw new NotFoundError('College not found');
  }

  return college;
};

const createCollege = async ({ name }) =>
  collegeRepository.createCollege({ name });

const updateCollege = async ({ id, name }) => {
  const existingCollege = await collegeRepository.findCollegeById(id);

  if (!existingCollege) {
    throw new NotFoundError('College not found');
  }

  return collegeRepository.updateCollege(id, { name });
};

const deleteCollege = async ({ id }) => {
  const existingCollege = await collegeRepository.findCollegeById(id);

  if (!existingCollege) {
    throw new NotFoundError('College not found');
  }

  await collegeRepository.deleteCollege(id);
};

module.exports = {
  getColleges,
  getCollegeById,
  createCollege,
  updateCollege,
  deleteCollege,
};
