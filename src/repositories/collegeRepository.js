const prisma = require('../config/database');

const findColleges = ({ where, skip, take }) =>
  prisma.college.findMany({
    where,
    skip,
    take,
    include: {
      departments: true,
      _count: {
        select: {
          students: true,
          books: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  });

const countColleges = (where) =>
  prisma.college.count({ where });

const findCollegeByIdWithDetails = (id) =>
  prisma.college.findUnique({
    where: { id },
    include: {
      departments: true,
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
          doctor: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      },
      _count: {
        select: {
          students: true,
          books: true,
          departments: true,
        },
      },
    },
  });

const findCollegeById = (id) =>
  prisma.college.findUnique({
    where: { id },
  });

const createCollege = (data) =>
  prisma.college.create({
    data,
    include: {
      departments: true,
    },
  });

const updateCollege = (id, data) =>
  prisma.college.update({
    where: { id },
    data,
    include: {
      departments: true,
    },
  });

const deleteCollege = (id) =>
  prisma.college.delete({
    where: { id },
  });

module.exports = {
  findColleges,
  countColleges,
  findCollegeByIdWithDetails,
  findCollegeById,
  createCollege,
  updateCollege,
  deleteCollege,
};
