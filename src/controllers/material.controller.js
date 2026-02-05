/**
 * Material Controller
 * Handles material-related HTTP requests
 */

const prisma = require('../config/database');
const { sendSuccess, sendPaginated, getPaginationParams, buildPagination } = require('../utils/response');
const { NotFoundError, AuthorizationError } = require('../utils/errors');
const { APPROVAL_STATUS } = require('../utils/constants');

/**
 * Get all materials (with filters)
 */
const getMaterials = async (req, res, next) => {
  try {
    const { page, limit } = getPaginationParams(req.query.page, req.query.limit);
    const { categoryId, collegeId, departmentId, doctorId, materialType, search, approvalStatus } = req.query;

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
      prisma.material.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
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
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.material.count({ where }),
    ]);

    // Parse imageUrls JSON for each material (with error handling)
    const materialsWithParsedImages = materials.map(material => {
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
        type: 'MATERIAL',
      };
    });

    const pagination = buildPagination(page, limit, total);

    sendPaginated(res, materialsWithParsedImages, pagination, 'Materials retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get material by ID
 */
const getMaterialById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const material = await prisma.material.findUnique({
      where: { id },
      include: {
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
      },
    });

    if (!material) {
      throw new NotFoundError('Material not found');
    }

    // Parse imageUrls JSON (with error handling)
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

    const parsedMaterial = {
      ...material,
      imageUrls: parsedImageUrls,
    };

    // Get reviews for this material
    const reviews = await prisma.review.findMany({
      where: {
        targetId: id,
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

    // Calculate average rating
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;

    sendSuccess(res, { ...parsedMaterial, type: 'MATERIAL', reviews, avgRating }, 'Material retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Create material (Doctor only)
 */
const createMaterial = async (req, res, next) => {
  try {
    const { title, description, fileUrl, imageUrls, totalPages, categoryId, collegeId, departmentId, materialType, pricing } = req.body;
    const doctorId = req.user.doctor?.id;

    if (!doctorId) {
      throw new AuthorizationError('Doctor profile not found');
    }

    // Convert imageUrls array to JSON string
    const imageUrlsJson = imageUrls && Array.isArray(imageUrls) && imageUrls.length > 0 
      ? JSON.stringify(imageUrls) 
      : null;

    const material = await prisma.material.create({
      data: {
        title,
        description,
        fileUrl,
        imageUrls: imageUrlsJson,
        totalPages: totalPages || null,
        categoryId,
        doctorId,
        collegeId: collegeId || null,
        departmentId: departmentId || null,
        materialType: materialType || 'LECTURE_NOTE',
        approvalStatus: APPROVAL_STATUS.PENDING,
      },
      include: {
        category: true,
        doctor: true,
        college: true,
        department: true,
      },
    });

    // Add pricing if provided
    if (pricing && Array.isArray(pricing)) {
      await prisma.materialPricing.createMany({
        data: pricing.map(price => ({
          materialId: material.id,
          accessType: price.accessType,
          price: price.price,
          approvalStatus: APPROVAL_STATUS.PENDING,
        })),
      });
    }

    sendSuccess(res, material, 'Material created successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Update material (Doctor only - own materials)
 */
const updateMaterial = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, fileUrl, imageUrls, totalPages, categoryId, collegeId, departmentId, materialType } = req.body;
    const doctorId = req.user.doctor?.id;

    if (!doctorId) {
      throw new AuthorizationError('Doctor profile not found');
    }

    const existingMaterial = await prisma.material.findUnique({
      where: { id },
    });

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
    if (imageUrls !== undefined) {
      updateData.imageUrls = Array.isArray(imageUrls) && imageUrls.length > 0 
        ? JSON.stringify(imageUrls) 
        : null;
    }
    if (totalPages !== undefined) updateData.totalPages = totalPages || null;
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (collegeId !== undefined) updateData.collegeId = collegeId || null;
    if (departmentId !== undefined) updateData.departmentId = departmentId || null;
    if (materialType !== undefined) updateData.materialType = materialType;

    const material = await prisma.material.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        doctor: true,
        college: true,
        department: true,
        pricing: true,
      },
    });

    sendSuccess(res, material, 'Material updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete material (Doctor only - own materials)
 */
const deleteMaterial = async (req, res, next) => {
  try {
    const { id } = req.params;
    const doctorId = req.user.doctor?.id;

    if (!doctorId) {
      throw new AuthorizationError('Doctor profile not found');
    }

    const existingMaterial = await prisma.material.findUnique({
      where: { id },
    });

    if (!existingMaterial) {
      throw new NotFoundError('Material not found');
    }

    if (existingMaterial.doctorId !== doctorId) {
      throw new AuthorizationError('You can only delete your own materials');
    }

    await prisma.material.delete({
      where: { id },
    });

    sendSuccess(res, null, 'Material deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Add material pricing
 */
const addMaterialPricing = async (req, res, next) => {
  try {
    const { materialId, accessType, price } = req.body;
    const doctorId = req.user.doctor?.id;

    if (!doctorId) {
      throw new AuthorizationError('Doctor profile not found');
    }

    const existingMaterial = await prisma.material.findUnique({
      where: { id: materialId },
    });

    if (!existingMaterial) {
      throw new NotFoundError('Material not found');
    }

    if (existingMaterial.doctorId !== doctorId) {
      throw new AuthorizationError('You can only add pricing to your own materials');
    }

    const pricing = await prisma.materialPricing.upsert({
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
        approvalStatus: APPROVAL_STATUS.PENDING,
      },
      include: {
        material: true,
      },
    });

    sendSuccess(res, pricing, 'Pricing added successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Increment material downloads
 */
const incrementDownloads = async (req, res, next) => {
  try {
    const { id } = req.params;

    const material = await prisma.material.update({
      where: { id },
      data: {
        downloads: {
          increment: 1,
        },
      },
    });

    sendSuccess(res, { downloads: material.downloads }, 'Downloads incremented successfully');
  } catch (error) {
    next(error);
  }
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


