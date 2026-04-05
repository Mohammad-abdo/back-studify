const adminRepository = require('../repositories/adminRepository');
const { buildPagination, getPaginationParams } = require('../utils/response');
const { NotFoundError, ValidationError } = require('../utils/errors');
const { APPROVAL_STATUS, ADMIN_OPERATION_TYPE } = require('../utils/constants');

const createOperationLog = async (adminId, operationType, entityType, entityId, description, metadata, requestMeta) => {
  await adminRepository.createAdminOperationLog({
    adminId,
    operationType,
    entityType,
    entityId,
    description,
    metadata,
    ipAddress: requestMeta.ipAddress,
    userAgent: requestMeta.userAgent,
  });
};

const approveDoctor = async ({ id, adminId, requestMeta }) => {
  const doctor = await adminRepository.findDoctorByIdWithUser(id);

  if (!doctor) {
    throw new NotFoundError('Doctor not found');
  }

  const updatedDoctor = await adminRepository.updateDoctorApproval(id, {
    approvalStatus: APPROVAL_STATUS.APPROVED,
    approvedAt: new Date(),
  });

  await createOperationLog(
    adminId,
    ADMIN_OPERATION_TYPE.APPROVE,
    'DOCTOR',
    id,
    `Approved doctor: ${doctor.name}`,
    { doctorId: id },
    requestMeta
  );

  return updatedDoctor;
};

const rejectDoctor = async ({ id, adminId, requestMeta }) => {
  const doctor = await adminRepository.findDoctorByIdWithUser(id);

  if (!doctor) {
    throw new NotFoundError('Doctor not found');
  }

  const updatedDoctor = await adminRepository.updateDoctorApproval(id, {
    approvalStatus: APPROVAL_STATUS.REJECTED,
  });

  await createOperationLog(
    adminId,
    ADMIN_OPERATION_TYPE.REJECT,
    'DOCTOR',
    id,
    `Rejected doctor: ${doctor.name}`,
    { doctorId: id },
    requestMeta
  );

  return updatedDoctor;
};

const approveBook = async ({ id, adminId, requestMeta }) => {
  const book = await adminRepository.findBookById(id);

  if (!book) {
    throw new NotFoundError('Book not found');
  }

  const updatedBook = await adminRepository.updateBookApproval(id, APPROVAL_STATUS.APPROVED);
  await adminRepository.updateBookPricingApprovalStatuses(id, APPROVAL_STATUS.APPROVED);

  await createOperationLog(
    adminId,
    ADMIN_OPERATION_TYPE.APPROVE,
    'BOOK',
    id,
    `Approved book: ${book.title}`,
    { bookId: id },
    requestMeta
  );

  return updatedBook;
};

const rejectBook = async ({ id, adminId, requestMeta }) => {
  const book = await adminRepository.findBookById(id);

  if (!book) {
    throw new NotFoundError('Book not found');
  }

  const updatedBook = await adminRepository.updateBookApproval(id, APPROVAL_STATUS.REJECTED);

  await createOperationLog(
    adminId,
    ADMIN_OPERATION_TYPE.REJECT,
    'BOOK',
    id,
    `Rejected book: ${book.title}`,
    { bookId: id },
    requestMeta
  );

  return updatedBook;
};

const getPendingApprovals = async ({ type }) => {
  if (type === 'DOCTOR') {
    return adminRepository.findPendingDoctors();
  }

  if (type === 'BOOK') {
    return adminRepository.findPendingBooks();
  }

  throw new ValidationError('Invalid type. Use DOCTOR or BOOK');
};

const getOperationLogs = async ({ page, limit, operationType, entityType }) => {
  const paginationParams = getPaginationParams(page, limit);
  const where = {
    ...(operationType && { operationType }),
    ...(entityType && { entityType }),
  };

  const [logs, total] = await Promise.all([
    adminRepository.findOperationLogs({
      where,
      skip: paginationParams.skip,
      take: paginationParams.limit,
    }),
    adminRepository.countOperationLogs(where),
  ]);

  return {
    data: logs,
    pagination: buildPagination(paginationParams.page, paginationParams.limit, total),
  };
};

const getUsers = async ({ page, limit, type, isActive, search }) => {
  const paginationParams = getPaginationParams(page, limit);
  const where = {
    ...(type && { type }),
    ...(isActive !== undefined && { isActive: isActive === 'true' }),
    ...(search && {
      OR: [
        { phone: { contains: search } },
        { email: { contains: search } },
      ],
    }),
  };

  const [users, total] = await Promise.all([
    adminRepository.findUsers({
      where,
      skip: paginationParams.skip,
      take: paginationParams.limit,
    }),
    adminRepository.countUsers(where),
  ]);

  return {
    data: users,
    pagination: buildPagination(paginationParams.page, paginationParams.limit, total),
  };
};

const getUserById = async ({ id }) => {
  const user = await adminRepository.findUserById(id);

  if (!user) {
    throw new NotFoundError('User not found');
  }

  return user;
};

const updateUser = async ({ id, phone, email, isActive, adminId, requestMeta }) => {
  const user = await adminRepository.findUserById(id);

  if (!user) {
    throw new NotFoundError('User not found');
  }

  const updateData = {};
  if (phone !== undefined) updateData.phone = phone;
  if (email !== undefined) updateData.email = email;
  if (isActive !== undefined) updateData.isActive = isActive;

  const updatedUser = await adminRepository.updateUser(id, updateData);

  await createOperationLog(
    adminId,
    ADMIN_OPERATION_TYPE.UPDATE,
    'USER',
    id,
    `Updated user ${updatedUser.phone}`,
    { changes: updateData },
    requestMeta
  );

  return updatedUser;
};

const getDashboardStats = async () => {
  const metrics = await adminRepository.getDashboardMetrics();

  return {
    users: {
      total: metrics.totalUsers,
      doctors: metrics.totalDoctors,
      students: metrics.totalStudents,
      delivery: metrics.totalDelivery,
      customers: metrics.totalCustomers,
    },
    books: {
      total: metrics.totalBooks,
      pending: metrics.pendingBooks,
      rejected: metrics.rejectedBooks,
    },
    products: {
      total: metrics.totalProducts,
    },
    orders: {
      total: metrics.totalOrders,
      wholesale: metrics.totalWholesaleOrders,
      pendingPayment: metrics.ordersCreated,
      byType: {
        product: metrics.totalProductOrders,
        content: metrics.totalContentOrders,
        print: metrics.totalPrintOrders,
      },
      byStatus: {
        created: metrics.ordersCreated,
        paid: metrics.ordersPaid,
        processing: metrics.ordersProcessing,
        shipped: metrics.ordersShipped,
        delivered: metrics.ordersDelivered,
        cancelled: metrics.ordersCancelled,
      },
    },
    approvals: {
      pendingDoctors: metrics.pendingDoctors,
      pendingBooks: metrics.pendingBooks,
    },
    colleges: {
      total: metrics.totalColleges,
    },
    departments: {
      total: metrics.totalDepartments,
    },
    categories: {
      books: metrics.totalBookCategories,
      products: metrics.totalProductCategories,
    },
    reviews: {
      total: metrics.totalReviews,
    },
    materials: {
      total: metrics.totalMaterials,
    },
    carts: {
      total: metrics.totalCarts,
      items: metrics.totalCartItems,
    },
    sliders: {
      total: metrics.totalSliders,
    },
    printOptions: {
      total: metrics.totalPrintOptions,
    },
    revenue: {
      total: (metrics.totalRevenue._sum.total || 0) + (metrics.totalWholesaleRevenue._sum.total || 0),
      orders: metrics.totalRevenue._sum.total || 0,
      product: metrics.totalProductRevenue._sum.total || 0,
      content: metrics.totalContentRevenue._sum.total || 0,
      wholesale: metrics.totalWholesaleRevenue._sum.total || 0,
    },
    recent: {
      orders: metrics.recentOrders,
      books: metrics.recentBooks,
      products: metrics.recentProducts,
    },
  };
};

const getReviews = async ({ page, limit, targetType }) => {
  const paginationParams = getPaginationParams(page, limit);
  const where = {
    ...(targetType && { targetType }),
  };

  const [reviews, total] = await Promise.all([
    adminRepository.findReviews({
      where,
      skip: paginationParams.skip,
      take: paginationParams.limit,
    }),
    adminRepository.countReviews(where),
  ]);

  return {
    data: reviews,
    pagination: buildPagination(paginationParams.page, paginationParams.limit, total),
  };
};

const getRecentOrders = async ({ page, limit, status, orderType }) => {
  const paginationParams = getPaginationParams(page, limit);
  const where = {
    ...(status && { status }),
    ...(orderType && { orderType }),
  };

  const [orders, total] = await Promise.all([
    adminRepository.findRecentOrders({
      where,
      skip: paginationParams.skip,
      take: paginationParams.limit,
    }),
    adminRepository.countRecentOrders(where),
  ]);

  const ordersWithCustomer = orders.map((order) => {
    const user = order.user || {};
    const customerName =
      user.student?.name ||
      user.doctor?.name ||
      user.customer?.contactPerson ||
      user.customer?.entityName ||
      user.phone ||
      null;

    return {
      ...order,
      customerName,
      deliveryAddress: order.address || null,
    };
  });

  return {
    data: ordersWithCustomer,
    pagination: buildPagination(paginationParams.page, paginationParams.limit, total),
  };
};

module.exports = {
  approveDoctor,
  rejectDoctor,
  approveBook,
  rejectBook,
  getPendingApprovals,
  getOperationLogs,
  getUsers,
  getUserById,
  updateUser,
  getDashboardStats,
  getReviews,
  getRecentOrders,
};
