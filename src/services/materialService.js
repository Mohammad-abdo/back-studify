const materialRepository = require('../repositories/materialRepository');
const { buildPagination, getPaginationParams } = require('../utils/response');
const { NotFoundError, AuthorizationError } = require('../utils/errors');
const { APPROVAL_STATUS } = require('../utils/constants');

const parseImageUrls = (material) => {
  let parsedImageUrls = [];

  if (material.imageUrls) {
    try {
      parsedImageUrls = typeof material.imageUrls === 'string'
        ? JSON.parse(material.imageUrls)
        : material.imageUrls;

      if (!Array.isArray(parsedImageUrls)) {
        parsedImageUrls = [];
      }
    } catch (error) {
      console.error('Error parsing imageUrls for material', material.id, error);
      parsedImageUrls = [];
    }
  }

  return {
    ...material,
    imageUrls: parsedImageUrls,
  };
};

const toImageUrlsJson = (imageUrls) =>
  imageUrls && Array.isArray(imageUrls) && imageUrls.length > 0
    ? JSON.stringify(imageUrls)
    : null;

const getDoctorIdFromUser = (user) => {
  const doctorId = user?.doctor?.id;

  if (!doctorId) {
    throw new AuthorizationError('Doctor profile not found');
  }

  return doctorId;
};

const getMaterials = async ({
  page,
  limit,
  categoryId,
  collegeId,
  departmentId,
  doctorId,
  materialType,
  search,
  approvalStatus,
}) => {
  const paginationParams = getPaginationParams(page, limit);
  const where = {
    ...(categoryId && { categoryId }),
    ...(collegeId && { collegeId }),
    ...(departmentId && { departmentId }),
    ...(doctorId && { doctorId }),
    ...(materialType && { materialType }),
    ...(approvalStatus && { approvalStatus }),
    ...(search && {
      OR: [
        { title: { contains: search } },
        { description: { contains: search } },
      ],
    }),
  };

  const [materials, total] = await Promise.all([
    materialRepository.findMaterials({
      where,
      skip: paginationParams.skip,
      take: paginationParams.limit,
    }),
    materialRepository.countMaterials(where),
  ]);

  return {
    data: materials.map((material) => ({
      ...parseImageUrls(material),
      type: 'MATERIAL',
    })),
    pagination: buildPagination(paginationParams.page, paginationParams.limit, total),
  };
};

const getMaterialById = async ({ id }) => {
  const material = await materialRepository.findMaterialById(id);

  if (!material) {
    throw new NotFoundError('Material not found');
  }

  const reviews = await materialRepository.findMaterialReviews(id);
  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0;

  return {
    ...parseImageUrls(material),
    type: 'MATERIAL',
    reviews,
    avgRating,
  };
};

const createMaterial = async ({
  user,
  title,
  description,
  fileUrl,
  imageUrls,
  totalPages,
  categoryId,
  collegeId,
  departmentId,
  materialType,
  pricing,
}) => {
  const doctorId = getDoctorIdFromUser(user);

  const material = await materialRepository.createMaterial({
    title,
    description,
    fileUrl,
    imageUrls: toImageUrlsJson(imageUrls),
    totalPages: totalPages || null,
    categoryId,
    doctorId,
    collegeId: collegeId || null,
    departmentId: departmentId || null,
    materialType: materialType || 'LECTURE_NOTE',
    approvalStatus: APPROVAL_STATUS.PENDING,
  });

  if (pricing && Array.isArray(pricing)) {
    await materialRepository.createMaterialPricingMany(
      pricing.map((priceItem) => ({
        materialId: material.id,
        accessType: priceItem.accessType,
        price: priceItem.price,
        approvalStatus: APPROVAL_STATUS.PENDING,
      })),
    );
  }

  return material;
};

const updateMaterial = async ({
  id,
  user,
  title,
  description,
  fileUrl,
  imageUrls,
  totalPages,
  categoryId,
  collegeId,
  departmentId,
  materialType,
}) => {
  const doctorId = getDoctorIdFromUser(user);
  const existingMaterial = await materialRepository.findMaterialBasicById(id);

  if (!existingMaterial) {
    throw new NotFoundError('Material not found');
  }

  if (existingMaterial.doctorId !== doctorId) {
    throw new AuthorizationError('You can only update your own materials');
  }

  const updateData = {};
  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (fileUrl !== undefined) updateData.fileUrl = fileUrl;
  if (imageUrls !== undefined) updateData.imageUrls = toImageUrlsJson(imageUrls);
  if (totalPages !== undefined) updateData.totalPages = totalPages || null;
  if (categoryId !== undefined) updateData.categoryId = categoryId;
  if (collegeId !== undefined) updateData.collegeId = collegeId || null;
  if (departmentId !== undefined) updateData.departmentId = departmentId || null;
  if (materialType !== undefined) updateData.materialType = materialType;

  return materialRepository.updateMaterial(id, updateData);
};

const deleteMaterial = async ({ id, user }) => {
  const doctorId = getDoctorIdFromUser(user);
  const existingMaterial = await materialRepository.findMaterialBasicById(id);

  if (!existingMaterial) {
    throw new NotFoundError('Material not found');
  }

  if (existingMaterial.doctorId !== doctorId) {
    throw new AuthorizationError('You can only delete your own materials');
  }

  await materialRepository.deleteMaterial(id);
};

const addMaterialPricing = async ({ user, materialId, accessType, price }) => {
  const doctorId = getDoctorIdFromUser(user);
  const existingMaterial = await materialRepository.findMaterialBasicById(materialId);

  if (!existingMaterial) {
    throw new NotFoundError('Material not found');
  }

  if (existingMaterial.doctorId !== doctorId) {
    throw new AuthorizationError('You can only add pricing to your own materials');
  }

  return materialRepository.upsertMaterialPricing({
    materialId,
    accessType,
    price,
    approvalStatus: APPROVAL_STATUS.PENDING,
  });
};

const incrementDownloads = async ({ id }) => {
  const material = await materialRepository.incrementMaterialDownloads(id);

  return {
    downloads: material.downloads,
  };
};

module.exports = {
  getMaterials,
  getMaterialById,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  addMaterialPricing,
  incrementDownloads,
};
