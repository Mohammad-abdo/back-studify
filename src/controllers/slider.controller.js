/**
 * Slider Controller
 * Handles slider-related HTTP requests
 */

const sliderService = require('../services/sliderService');
const { sendSuccess, sendPaginated } = require('../utils/response');

const getSliders = async (req, res, next) => {
  try {
    const sliders = await sliderService.getSliders();
    sendSuccess(res, sliders, 'Sliders retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getAllSliders = async (req, res, next) => {
  try {
    const result = await sliderService.getAllSliders(req.query);
    sendPaginated(res, result.data, result.pagination, 'Sliders retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getSliderById = async (req, res, next) => {
  try {
    const slider = await sliderService.getSliderById({
      id: req.params.id,
    });

    sendSuccess(res, slider, 'Slider retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const createSlider = async (req, res, next) => {
  try {
    const slider = await sliderService.createSlider(req.body);
    sendSuccess(res, slider, 'Slider created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const updateSlider = async (req, res, next) => {
  try {
    const slider = await sliderService.updateSlider({
      id: req.params.id,
      ...req.body,
    });

    sendSuccess(res, slider, 'Slider updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteSlider = async (req, res, next) => {
  try {
    await sliderService.deleteSlider({
      id: req.params.id,
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
