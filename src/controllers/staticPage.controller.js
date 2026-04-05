/**
 * Static Page Controller
 * Handles static page-related HTTP requests (Admin only for management)
 */

const staticPageService = require('../services/staticPageService');
const { sendSuccess } = require('../utils/response');

const getStaticPages = async (req, res, next) => {
  try {
    const pages = await staticPageService.getStaticPages();
    sendSuccess(res, pages, 'Static pages retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getStaticPageBySlug = async (req, res, next) => {
  try {
    const page = await staticPageService.getStaticPageBySlug({
      slug: req.params.slug,
    });

    sendSuccess(res, page, 'Static page retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getStaticPageById = async (req, res, next) => {
  try {
    const page = await staticPageService.getStaticPageById({
      id: req.params.id,
    });

    sendSuccess(res, page, 'Static page retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const createStaticPage = async (req, res, next) => {
  try {
    const page = await staticPageService.createStaticPage(req.body);
    sendSuccess(res, page, 'Static page created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const updateStaticPage = async (req, res, next) => {
  try {
    const page = await staticPageService.updateStaticPage({
      id: req.params.id,
      ...req.body,
    });

    sendSuccess(res, page, 'Static page updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteStaticPage = async (req, res, next) => {
  try {
    await staticPageService.deleteStaticPage({
      id: req.params.id,
    });

    sendSuccess(res, null, 'Static page deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStaticPages,
  getStaticPageBySlug,
  getStaticPageById,
  createStaticPage,
  updateStaticPage,
  deleteStaticPage,
};
