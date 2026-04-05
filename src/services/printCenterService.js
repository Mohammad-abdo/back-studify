const printCenterRepository = require('../repositories/printCenterRepository');
const { buildPagination, getPaginationParams } = require('../utils/response');
const { NotFoundError, ConflictError } = require('../utils/errors');
const { hashPassword, formatPhoneNumber } = require('../utils/helpers');

const getPrintCenters = async ({ page, limit, search }) => {
  const paginationParams = getPaginationParams(page, limit);
  const where = {
    ...(search && {
      OR: [
        { name: { contains: search } },
        { user: { phone: { contains: search } } },
      ],
    }),
  };

  const [centers, total] = await Promise.all([
    printCenterRepository.findPrintCenters({
      where,
      skip: paginationParams.skip,
      take: paginationParams.limit,
    }),
    printCenterRepository.countPrintCenters(where),
  ]);

  return {
    data: centers,
    pagination: buildPagination(paginationParams.page, paginationParams.limit, total),
  };
};

const createPrintCenter = async ({ phone, password, email, name, location, address, latitude, longitude }) => {
  const formattedPhone = formatPhoneNumber(phone);

  const existingUser = await printCenterRepository.findUserByPhone(formattedPhone);
  if (existingUser) {
    throw new ConflictError('Phone number already registered');
  }

  if (email) {
    const existingEmail = await printCenterRepository.findUserByEmail(email);
    if (existingEmail) {
      throw new ConflictError('Email already registered');
    }
  }

  const passwordHash = await hashPassword(password);

  return printCenterRepository.createPrintCenterWithUser({
    userData: {
      phone: formattedPhone,
      password: passwordHash,
      email: email || null,
      type: 'PRINT_CENTER',
      isActive: true,
    },
    printCenterData: {
      name: name || 'Print Center',
      location: location || null,
      address: address || null,
      latitude: latitude != null ? Number(latitude) : null,
      longitude: longitude != null ? Number(longitude) : null,
    },
  });
};

const getPrintCenterById = async ({ id }) => {
  const center = await printCenterRepository.findPrintCenterById(id);

  if (!center) {
    throw new NotFoundError('Print center not found');
  }

  const [stats, byStatus] = await Promise.all([
    printCenterRepository.aggregatePrintAssignmentCount(id),
    printCenterRepository.groupPrintAssignmentsByStatus(id),
  ]);

  return {
    ...center,
    stats: {
      totalAssignments: stats._count.id,
      byStatus: byStatus.reduce((acc, row) => {
        acc[row.status] = row._count.id;
        return acc;
      }, {}),
    },
  };
};

const updatePrintCenter = async ({ id, name, location, address, latitude, longitude, isActive }) => {
  const data = {};
  if (name !== undefined) data.name = name;
  if (location !== undefined) data.location = location;
  if (address !== undefined) data.address = address;
  if (latitude !== undefined) data.latitude = latitude == null ? null : Number(latitude);
  if (longitude !== undefined) data.longitude = longitude == null ? null : Number(longitude);
  if (isActive !== undefined) data.isActive = isActive;

  return printCenterRepository.updatePrintCenter(id, data);
};

const deletePrintCenter = async ({ id }) => {
  const center = await printCenterRepository.findPrintCenterBasicById(id);

  if (!center) {
    throw new NotFoundError('Print center not found');
  }

  await printCenterRepository.deleteUser(center.userId);
};

module.exports = {
  getPrintCenters,
  createPrintCenter,
  getPrintCenterById,
  updatePrintCenter,
  deletePrintCenter,
};
