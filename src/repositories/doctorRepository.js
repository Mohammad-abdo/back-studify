const prisma = require('../config/database');

const doctorListInclude = {
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
};

const doctorDetailInclude = {
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
};

const doctorUpdateInclude = {
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
};

const findDoctors = ({ where, skip, take }) =>
  prisma.doctor.findMany({
    where,
    skip,
    take,
    include: doctorListInclude,
    orderBy: { createdAt: 'desc' },
  });

const countDoctors = (where) =>
  prisma.doctor.count({ where });

const findDoctorById = (id) =>
  prisma.doctor.findUnique({
    where: { id },
    include: doctorDetailInclude,
  });

const findDoctorBasicById = (id) =>
  prisma.doctor.findUnique({
    where: { id },
    select: { id: true },
  });

const updateDoctor = (id, data) =>
  prisma.doctor.update({
    where: { id },
    data,
    include: doctorUpdateInclude,
  });

const deleteDoctor = (id) =>
  prisma.doctor.delete({
    where: { id },
  });

const countMaterialsByDoctorId = (doctorId) =>
  prisma.material.count({
    where: { doctorId },
  });

const aggregateMaterialStatsByDoctorId = (doctorId) =>
  prisma.material.aggregate({
    where: { doctorId },
    _sum: { downloads: true },
    _avg: { rating: true },
  });

const findBookIdsByDoctorId = (doctorId) =>
  prisma.book.findMany({
    where: { doctorId },
    select: { id: true },
  });

const findMaterialIdsByDoctorId = (doctorId) =>
  prisma.material.findMany({
    where: { doctorId },
    select: { id: true },
  });

const findStudentUserIdsByReferenceIds = (referenceIds) =>
  prisma.orderItem.findMany({
    where: {
      referenceType: { in: ['BOOK', 'MATERIAL'] },
      referenceId: { in: referenceIds },
    },
    select: {
      order: {
        select: {
          userId: true,
        },
      },
    },
  });

const aggregateBookReviewStats = (bookIds) =>
  prisma.review.aggregate({
    where: {
      targetType: 'BOOK',
      targetId: { in: bookIds },
    },
    _avg: { rating: true },
    _count: { id: true },
  });

const countBooksByDoctorId = (doctorId) =>
  prisma.book.count({
    where: { doctorId },
  });

module.exports = {
  findDoctors,
  countDoctors,
  findDoctorById,
  findDoctorBasicById,
  updateDoctor,
  deleteDoctor,
  countMaterialsByDoctorId,
  aggregateMaterialStatsByDoctorId,
  findBookIdsByDoctorId,
  findMaterialIdsByDoctorId,
  findStudentUserIdsByReferenceIds,
  aggregateBookReviewStats,
  countBooksByDoctorId,
};
