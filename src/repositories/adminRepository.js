const prisma = require('../config/database');
const { APPROVAL_STATUS } = require('../utils/constants');

const userListSelect = {
  id: true,
  phone: true,
  email: true,
  avatarUrl: true,
  type: true,
  isActive: true,
  createdAt: true,
  student: {
    select: {
      id: true,
      name: true,
      college: { select: { id: true, name: true } },
      department: { select: { id: true, name: true } },
    },
  },
  doctor: {
    select: {
      id: true,
      name: true,
      specialization: true,
      approvalStatus: true,
    },
  },
  delivery: {
    select: {
      id: true,
      name: true,
      vehicleType: true,
      status: true,
    },
  },
  customer: {
    select: {
      id: true,
      entityName: true,
      contactPerson: true,
    },
  },
  admin: {
    select: {
      id: true,
    },
  },
};

const createAdminOperationLog = (data) =>
  prisma.adminOperationLog.create({ data });

const findDoctorByIdWithUser = (id) =>
  prisma.doctor.findUnique({
    where: { id },
    include: {
      user: true,
    },
  });

const updateDoctorApproval = (id, data) =>
  prisma.doctor.update({
    where: { id },
    data,
    include: {
      user: true,
    },
  });

const findBookById = (id) =>
  prisma.book.findUnique({
    where: { id },
  });

const updateBookApproval = (id, approvalStatus) =>
  prisma.book.update({
    where: { id },
    data: {
      approvalStatus,
    },
    include: {
      category: true,
      doctor: true,
    },
  });

const updateBookPricingApprovalStatuses = (bookId, approvalStatus) =>
  prisma.bookPricing.updateMany({
    where: { bookId },
    data: {
      approvalStatus,
    },
  });

const findPendingDoctors = () =>
  prisma.doctor.findMany({
    where: {
      approvalStatus: APPROVAL_STATUS.PENDING,
    },
    include: {
      user: {
        select: {
          id: true,
          phone: true,
          email: true,
          avatarUrl: true,
          createdAt: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

const findPendingBooks = () =>
  prisma.book.findMany({
    where: {
      approvalStatus: APPROVAL_STATUS.PENDING,
    },
    include: {
      category: true,
      doctor: {
        include: {
          user: {
            select: {
              id: true,
              phone: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

const findOperationLogs = ({ where, skip, take }) =>
  prisma.adminOperationLog.findMany({
    where,
    skip,
    take,
    include: {
      admin: {
        include: {
          user: {
            select: {
              id: true,
              phone: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

const countOperationLogs = (where) =>
  prisma.adminOperationLog.count({ where });

const findUsers = ({ where, skip, take }) =>
  prisma.user.findMany({
    where,
    skip,
    take,
    select: userListSelect,
    orderBy: { createdAt: 'desc' },
  });

const countUsers = (where) =>
  prisma.user.count({ where });

const findUserById = (id) =>
  prisma.user.findUnique({
    where: { id },
    select: userListSelect,
  });

const updateUser = (id, data) =>
  prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      phone: true,
      email: true,
      avatarUrl: true,
      type: true,
      isActive: true,
      createdAt: true,
    },
  });

const getDashboardMetrics = async () => {
  const recentThreshold = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    totalDoctors,
    totalStudents,
    totalDelivery,
    totalCustomers,
    totalBooks,
    totalProducts,
    totalOrders,
    totalWholesaleOrders,
    pendingDoctors,
    pendingBooks,
    rejectedBooks,
    totalColleges,
    totalDepartments,
    totalReviews,
    totalBookCategories,
    totalProductCategories,
    totalMaterials,
    totalCarts,
    totalCartItems,
    totalSliders,
    totalPrintOptions,
    totalProductOrders,
    totalContentOrders,
    totalPrintOrders,
    ordersCreated,
    ordersPaid,
    ordersProcessing,
    ordersShipped,
    ordersDelivered,
    ordersCancelled,
    totalRevenue,
    totalProductRevenue,
    totalContentRevenue,
    totalWholesaleRevenue,
    recentOrders,
    recentBooks,
    recentProducts,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.doctor.count(),
    prisma.student.count(),
    prisma.delivery.count(),
    prisma.customer.count(),
    prisma.book.count({ where: { approvalStatus: APPROVAL_STATUS.APPROVED } }),
    prisma.product.count(),
    prisma.order.count(),
    prisma.wholesaleOrder.count(),
    prisma.doctor.count({ where: { approvalStatus: APPROVAL_STATUS.PENDING } }),
    prisma.book.count({ where: { approvalStatus: APPROVAL_STATUS.PENDING } }),
    prisma.book.count({ where: { approvalStatus: APPROVAL_STATUS.REJECTED } }),
    prisma.college.count(),
    prisma.department.count(),
    prisma.review.count(),
    prisma.bookCategory.count(),
    prisma.productCategory.count(),
    prisma.material.count(),
    prisma.cart.count(),
    prisma.cartItem.count(),
    prisma.slider.count(),
    prisma.printOption.count(),
    prisma.order.count({ where: { orderType: 'PRODUCT' } }),
    prisma.order.count({ where: { orderType: 'CONTENT' } }),
    prisma.order.count({ where: { orderType: 'PRINT' } }),
    prisma.order.count({ where: { status: 'CREATED' } }),
    prisma.order.count({ where: { status: 'PAID' } }),
    prisma.order.count({ where: { status: 'PROCESSING' } }),
    prisma.order.count({ where: { status: 'SHIPPED' } }),
    prisma.order.count({ where: { status: 'DELIVERED' } }),
    prisma.order.count({ where: { status: 'CANCELLED' } }),
    prisma.order.aggregate({
      where: {
        status: {
          in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'],
        },
      },
      _sum: {
        total: true,
      },
    }),
    prisma.order.aggregate({
      where: {
        status: {
          in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'],
        },
        orderType: 'PRODUCT',
      },
      _sum: {
        total: true,
      },
    }),
    prisma.order.aggregate({
      where: {
        status: {
          in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'],
        },
        orderType: 'CONTENT',
      },
      _sum: {
        total: true,
      },
    }),
    prisma.wholesaleOrder.aggregate({
      where: {
        status: {
          in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'],
        },
      },
      _sum: {
        total: true,
      },
    }),
    prisma.order.count({
      where: {
        createdAt: {
          gte: recentThreshold,
        },
      },
    }),
    prisma.book.count({
      where: {
        createdAt: {
          gte: recentThreshold,
        },
      },
    }),
    prisma.product.count({
      where: {
        createdAt: {
          gte: recentThreshold,
        },
      },
    }),
  ]);

  return {
    totalUsers,
    totalDoctors,
    totalStudents,
    totalDelivery,
    totalCustomers,
    totalBooks,
    totalProducts,
    totalOrders,
    totalWholesaleOrders,
    pendingDoctors,
    pendingBooks,
    rejectedBooks,
    totalColleges,
    totalDepartments,
    totalReviews,
    totalBookCategories,
    totalProductCategories,
    totalMaterials,
    totalCarts,
    totalCartItems,
    totalSliders,
    totalPrintOptions,
    totalProductOrders,
    totalContentOrders,
    totalPrintOrders,
    ordersCreated,
    ordersPaid,
    ordersProcessing,
    ordersShipped,
    ordersDelivered,
    ordersCancelled,
    totalRevenue,
    totalProductRevenue,
    totalContentRevenue,
    totalWholesaleRevenue,
    recentOrders,
    recentBooks,
    recentProducts,
  };
};

const findReviews = ({ where, skip, take }) =>
  prisma.review.findMany({
    where,
    skip,
    take,
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
  });

const countReviews = (where) =>
  prisma.review.count({ where });

const findRecentOrders = ({ where, skip, take }) =>
  prisma.order.findMany({
    where,
    skip,
    take,
    include: {
      user: {
        select: {
          id: true,
          phone: true,
          email: true,
          student: { select: { name: true } },
          doctor: { select: { name: true } },
          customer: { select: { contactPerson: true, entityName: true } },
        },
      },
      items: true,
    },
    orderBy: { createdAt: 'desc' },
  });

const countRecentOrders = (where) =>
  prisma.order.count({ where });

module.exports = {
  createAdminOperationLog,
  findDoctorByIdWithUser,
  updateDoctorApproval,
  findBookById,
  updateBookApproval,
  updateBookPricingApprovalStatuses,
  findPendingDoctors,
  findPendingBooks,
  findOperationLogs,
  countOperationLogs,
  findUsers,
  countUsers,
  findUserById,
  updateUser,
  getDashboardMetrics,
  findReviews,
  countReviews,
  findRecentOrders,
  countRecentOrders,
};
