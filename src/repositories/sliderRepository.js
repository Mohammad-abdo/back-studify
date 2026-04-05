const prisma = require('../config/database');

const findActiveSliders = () =>
  prisma.slider.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      order: 'asc',
    },
  });

const findSliders = ({ skip, take }) =>
  prisma.slider.findMany({
    skip,
    take,
    orderBy: {
      order: 'asc',
    },
  });

const countSliders = () =>
  prisma.slider.count();

const findSliderById = (id) =>
  prisma.slider.findUnique({
    where: { id },
  });

const createSlider = (data) =>
  prisma.slider.create({
    data,
  });

const updateSlider = (id, data) =>
  prisma.slider.update({
    where: { id },
    data,
  });

const deleteSlider = (id) =>
  prisma.slider.delete({
    where: { id },
  });

module.exports = {
  findActiveSliders,
  findSliders,
  countSliders,
  findSliderById,
  createSlider,
  updateSlider,
  deleteSlider,
};
