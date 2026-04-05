const prisma = require('../config/database');

const studentInclude = {
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
};

const findStudents = ({ where, skip, take }) =>
  prisma.student.findMany({
    where,
    skip,
    take,
    include: studentInclude,
    orderBy: { createdAt: 'desc' },
  });

const countStudents = (where) =>
  prisma.student.count({ where });

const findStudentById = (id) =>
  prisma.student.findUnique({
    where: { id },
    include: studentInclude,
  });

const findStudentBasicById = (id) =>
  prisma.student.findUnique({
    where: { id },
  });

const updateStudent = (id, data) =>
  prisma.student.update({
    where: { id },
    data,
    include: studentInclude,
  });

const deleteStudent = (id) =>
  prisma.student.delete({
    where: { id },
  });

module.exports = {
  findStudents,
  countStudents,
  findStudentById,
  findStudentBasicById,
  updateStudent,
  deleteStudent,
};
