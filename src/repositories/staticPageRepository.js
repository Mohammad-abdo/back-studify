const prisma = require('../config/database');

const findStaticPages = () =>
  prisma.staticPage.findMany({
    orderBy: { updatedAt: 'desc' },
  });

const findStaticPageBySlug = (slug) =>
  prisma.staticPage.findUnique({
    where: { slug },
  });

const findStaticPageById = (id) =>
  prisma.staticPage.findUnique({
    where: { id },
  });

const createStaticPage = (data) =>
  prisma.staticPage.create({
    data,
  });

const updateStaticPage = (id, data) =>
  prisma.staticPage.update({
    where: { id },
    data,
  });

const deleteStaticPage = (id) =>
  prisma.staticPage.delete({
    where: { id },
  });

module.exports = {
  findStaticPages,
  findStaticPageBySlug,
  findStaticPageById,
  createStaticPage,
  updateStaticPage,
  deleteStaticPage,
};
