const staticPageRepository = require('../repositories/staticPageRepository');
const { NotFoundError } = require('../utils/errors');

const getStaticPages = async () =>
  staticPageRepository.findStaticPages();

const getStaticPageBySlug = async ({ slug }) => {
  const page = await staticPageRepository.findStaticPageBySlug(slug);

  if (!page) {
    throw new NotFoundError('Static page not found');
  }

  return page;
};

const getStaticPageById = async ({ id }) => {
  const page = await staticPageRepository.findStaticPageById(id);

  if (!page) {
    throw new NotFoundError('Static page not found');
  }

  return page;
};

const createStaticPage = async ({ slug, title, content }) => {
  const existingPage = await staticPageRepository.findStaticPageBySlug(slug);

  if (existingPage) {
    throw new Error('Page with this slug already exists');
  }

  return staticPageRepository.createStaticPage({
    slug,
    title,
    content,
  });
};

const updateStaticPage = async ({ id, slug, title, content }) => {
  const existingPage = await staticPageRepository.findStaticPageById(id);

  if (!existingPage) {
    throw new NotFoundError('Static page not found');
  }

  if (slug && slug !== existingPage.slug) {
    const slugConflict = await staticPageRepository.findStaticPageBySlug(slug);

    if (slugConflict) {
      throw new Error('Page with this slug already exists');
    }
  }

  const updateData = {};
  if (slug !== undefined) updateData.slug = slug;
  if (title !== undefined) updateData.title = title;
  if (content !== undefined) updateData.content = content;

  return staticPageRepository.updateStaticPage(id, updateData);
};

const deleteStaticPage = async ({ id }) => {
  const existingPage = await staticPageRepository.findStaticPageById(id);

  if (!existingPage) {
    throw new NotFoundError('Static page not found');
  }

  await staticPageRepository.deleteStaticPage(id);
};

module.exports = {
  getStaticPages,
  getStaticPageBySlug,
  getStaticPageById,
  createStaticPage,
  updateStaticPage,
  deleteStaticPage,
};
