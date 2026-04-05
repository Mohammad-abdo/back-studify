const studentRepository = require('../repositories/studentRepository');
const { buildPagination, getPaginationParams } = require('../utils/response');
const { NotFoundError } = require('../utils/errors');

const getStudents = async ({ page, limit, search, collegeId, departmentId }) => {
  const paginationParams = getPaginationParams(page, limit);
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
    studentRepository.findStudents({
      where,
      skip: paginationParams.skip,
      take: paginationParams.limit,
    }),
    studentRepository.countStudents(where),
  ]);

  return {
    data: students,
    pagination: buildPagination(paginationParams.page, paginationParams.limit, total),
  };
};

const getStudentById = async ({ id }) => {
  const student = await studentRepository.findStudentById(id);

  if (!student) {
    throw new NotFoundError('Student not found');
  }

  return student;
};

const updateStudent = async ({ id, name, collegeId, departmentId }) => {
  const existingStudent = await studentRepository.findStudentBasicById(id);

  if (!existingStudent) {
    throw new NotFoundError('Student not found');
  }

  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (collegeId !== undefined) updateData.collegeId = collegeId || null;
  if (departmentId !== undefined) updateData.departmentId = departmentId || null;

  return studentRepository.updateStudent(id, updateData);
};

const deleteStudent = async ({ id }) => {
  const existingStudent = await studentRepository.findStudentBasicById(id);

  if (!existingStudent) {
    throw new NotFoundError('Student not found');
  }

  await studentRepository.deleteStudent(id);
};

module.exports = {
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
};
