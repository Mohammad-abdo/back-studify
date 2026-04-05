const sliderRepository = require('../repositories/sliderRepository');
const { buildPagination, getPaginationParams } = require('../utils/response');
const { NotFoundError } = require('../utils/errors');

const getSliders = async () =>
  sliderRepository.findActiveSliders();

const getAllSliders = async ({ page, limit }) => {
  const paginationParams = getPaginationParams(page, limit);

  const [sliders, total] = await Promise.all([
    sliderRepository.findSliders({
      skip: paginationParams.skip,
      take: paginationParams.limit,
    }),
    sliderRepository.countSliders(),
  ]);

  return {
    data: sliders,
    pagination: buildPagination(paginationParams.page, paginationParams.limit, total),
  };
};

const getSliderById = async ({ id }) => {
  const slider = await sliderRepository.findSliderById(id);

  if (!slider) {
    throw new NotFoundError('Slider not found');
  }

  return slider;
};

const createSlider = ({ imageUrl, title, description, linkUrl, order = 0, isActive = true }) =>
  sliderRepository.createSlider({
    imageUrl,
    title,
    description,
    linkUrl,
    order,
    isActive,
  });

const updateSlider = async ({ id, imageUrl, title, description, linkUrl, order, isActive }) => {
  const slider = await sliderRepository.findSliderById(id);

  if (!slider) {
    throw new NotFoundError('Slider not found');
  }

  const updateData = {};
  if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (linkUrl !== undefined) updateData.linkUrl = linkUrl;
  if (order !== undefined) updateData.order = order;
  if (isActive !== undefined) updateData.isActive = isActive;

  return sliderRepository.updateSlider(id, updateData);
};

const deleteSlider = async ({ id }) => {
  const slider = await sliderRepository.findSliderById(id);

  if (!slider) {
    throw new NotFoundError('Slider not found');
  }

  await sliderRepository.deleteSlider(id);
};

module.exports = {
  getSliders,
  getAllSliders,
  getSliderById,
  createSlider,
  updateSlider,
  deleteSlider,
};
