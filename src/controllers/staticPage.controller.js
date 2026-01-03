/**
 * Static Page Controller
 * Handles static page-related HTTP requests (Admin only for management)
 */

const prisma = require('../config/database');
const { sendSuccess, sendPaginated, getPaginationParams, buildPagination } = require('../utils/response');
const { NotFoundError } = require('../utils/errors');

/**
 * Get all static pages (Public)
 */
const getStaticPages = async (req, res, next) => {
  try {
    const pages = await prisma.staticPage.findMany({
      orderBy: { updatedAt: 'desc' },
    });

    sendSuccess(res, pages, 'Static pages retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get static page by slug (Public)
 */
const getStaticPageBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;

    const page = await prisma.staticPage.findUnique({
      where: { slug },
    });

    if (!page) {
      throw new NotFoundError('Static page not found');
    }

    sendSuccess(res, page, 'Static page retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get static page by ID (Admin)
 */
const getStaticPageById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const page = await prisma.staticPage.findUnique({
      where: { id },
    });

    if (!page) {
      throw new NotFoundError('Static page not found');
    }

    sendSuccess(res, page, 'Static page retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Create static page (Admin only)
 */
const createStaticPage = async (req, res, next) => {
  try {
    const { slug, title, content } = req.body;

    // Check if slug already exists
    const existingPage = await prisma.staticPage.findUnique({
      where: { slug },
    });

    if (existingPage) {
      throw new Error('Page with this slug already exists');
    }

    const page = await prisma.staticPage.create({
      data: {
        slug,
        title,
        content,
      },
    });

    sendSuccess(res, page, 'Static page created successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Update static page (Admin only)
 */
const updateStaticPage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { slug, title, content } = req.body;

    const existingPage = await prisma.staticPage.findUnique({
      where: { id },
    });

    if (!existingPage) {
      throw new NotFoundError('Static page not found');
    }

    // Check if slug is being changed and if it conflicts with another page
    if (slug && slug !== existingPage.slug) {
      const slugConflict = await prisma.staticPage.findUnique({
        where: { slug },
      });

      if (slugConflict) {
        throw new Error('Page with this slug already exists');
      }
    }

    const updateData = {};
    if (slug !== undefined) updateData.slug = slug;
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;

    const page = await prisma.staticPage.update({
      where: { id },
      data: updateData,
    });

    sendSuccess(res, page, 'Static page updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete static page (Admin only)
 */
const deleteStaticPage = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingPage = await prisma.staticPage.findUnique({
      where: { id },
    });

    if (!existingPage) {
      throw new NotFoundError('Static page not found');
    }

    await prisma.staticPage.delete({
      where: { id },
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


