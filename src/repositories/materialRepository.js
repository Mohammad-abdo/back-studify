const prisma = require('../config/database');

const materialListInclude = {
  category: {
    include: {
      college: true,
    },
  },
  doctor: {
    include: {
      user: {
        select: {
          id: true,
          phone: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
  },
  college: true,
  department: true,
  pricing: true,
};

const materialDetailInclude = {
  category: {
    include: {
      college: true,
    },
  },
  doctor: {
    include: {
      user: {
        select: {
          id: true,
          phone: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
  },
  college: true,
  department: true,
  pricing: {
    orderBy: { accessType: 'asc' },
  },
};

const materialWriteInclude = {
  category: true,
  doctor: true,
  college: true,
  department: true,
};

const materialUpdateInclude = {
  category: true,
  doctor: true,
  college: true,
  department: true,
  pricing: true,
};

const findMaterials = ({ where, skip, take }) =>
  prisma.material.findMany({
    where,
    skip,
    take,
    include: materialListInclude,
    orderBy: { createdAt: 'desc' },
  });

const countMaterials = (where) =>
  prisma.material.count({ where });

const findMaterialById = (id) =>
  prisma.material.findUnique({
    where: { id },
    include: materialDetailInclude,
  });

const findMaterialBasicById = (id) =>
  prisma.material.findUnique({
    where: { id },
  });

const createMaterial = (data) =>
  prisma.material.create({
    data,
    include: materialWriteInclude,
  });

const createMaterialPricingMany = (data) =>
  prisma.materialPricing.createMany({
    data,
  });

const updateMaterial = (id, data) =>
  prisma.material.update({
    where: { id },
    data,
    include: materialUpdateInclude,
  });

const deleteMaterial = (id) =>
  prisma.material.delete({
    where: { id },
  });

const upsertMaterialPricing = ({ materialId, accessType, price, approvalStatus }) =>
  prisma.materialPricing.upsert({
    where: {
      materialId_accessType: {
        materialId,
        accessType,
      },
    },
    update: {
      price,
    },
    create: {
      materialId,
      accessType,
      price,
      approvalStatus,
    },
    include: {
      material: true,
    },
  });

const incrementMaterialDownloads = (id) =>
  prisma.material.update({
    where: { id },
    data: {
      downloads: {
        increment: 1,
      },
    },
  });

const findMaterialReviews = (targetId) =>
  prisma.review.findMany({
    where: {
      targetId,
      targetType: 'MATERIAL',
    },
    include: {
      user: {
        select: {
          id: true,
          phone: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

module.exports = {
  findMaterials,
  countMaterials,
  findMaterialById,
  findMaterialBasicById,
  createMaterial,
  createMaterialPricingMany,
  updateMaterial,
  deleteMaterial,
  upsertMaterialPricing,
  incrementMaterialDownloads,
  findMaterialReviews,
};
