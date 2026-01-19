/**
 * Slider Controller
 * Handles slider-related HTTP requests
 */

const prisma = require('../config/database');
const { sendSuccess, sendPaginated, getPaginationParams, buildPagination } = require('../utils/response');
const { NotFoundError } = require('../utils/errors');

/**
 * Get all active sliders (public)
 */
const getSliders = async (req, res, next) => {
  try {
    const sliders = await prisma.slider.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        order: 'asc',
      },
    });

    sendSuccess(res, sliders, 'Sliders retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get all sliders (admin)
 */
const getAllSliders = async (req, res, next) => {
  try {
    const { page, limit } = getPaginationParams(req.query.page, req.query.limit);

    const [sliders, total] = await Promise.all([
      prisma.slider.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          order: 'asc',
        },
      }),
      prisma.slider.count(),
    ]);

    const pagination = buildPagination(page, limit, total);
    sendPaginated(res, sliders, pagination, 'Sliders retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get slider by ID
 */
const getSliderById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const slider = await prisma.slider.findUnique({
      where: { id },
    });

    if (!slider) {
      throw new NotFoundError('Slider not found');
    }

    sendSuccess(res, slider, 'Slider retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Create slider (admin)
 */
const createSlider = async (req, res, next) => {
  try {
    const { imageUrl, title, description, linkUrl, order = 0, isActive = true } = req.body;

    const slider = await prisma.slider.create({
      data: {
        imageUrl,
        title,
        description,
        linkUrl,
        order,
        isActive,
      },
    });

    sendSuccess(res, slider, 'Slider created successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Update slider (admin)
 */
const updateSlider = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { imageUrl, title, description, linkUrl, order, isActive } = req.body;

    const slider = await prisma.slider.findUnique({
      where: { id },
    });

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

    const updatedSlider = await prisma.slider.update({
      where: { id },
      data: updateData,
    });

    sendSuccess(res, updatedSlider, 'Slider updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete slider (admin)
 */
const deleteSlider = async (req, res, next) => {
  try {
    const { id } = req.params;

    const slider = await prisma.slider.findUnique({
      where: { id },
    });

    if (!slider) {
      throw new NotFoundError('Slider not found');
    }

    await prisma.slider.delete({
      where: { id },
    });

    sendSuccess(res, null, 'Slider deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSliders,
  getAllSliders,
  getSliderById,
  createSlider,
  updateSlider,
  deleteSlider,
};

