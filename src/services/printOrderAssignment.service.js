/**
 * Print Order Assignment Service
 * Assigns print orders to nearest print center by distance
 */

const prisma = require('../config/database');
const { calculateDistanceKm } = require('../utils/helpers');
const { NotFoundError } = require('../utils/errors');

// Default fallback (e.g. Cairo) when order has no coordinates
const DEFAULT_LAT = 30.0444;
const DEFAULT_LON = 31.2357;

/**
 * Check if order contains print items (CONTENT/PRINT type or PRINT_OPTION items)
 */
function orderHasPrintItems(order) {
  if (order.orderType === 'PRINT' || order.orderType === 'CONTENT') {
    return true;
  }
  if (order.items && order.items.some((i) => i.referenceType === 'PRINT_OPTION')) {
    return true;
  }
  return false;
}

/**
 * Assign order to nearest active print center by distance
 * Called when order status becomes PAID and order has print items
 */
async function assignOrderToNearestPrintCenter(orderId, io = null) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) {
    throw new NotFoundError('Order not found');
  }

  if (!orderHasPrintItems(order)) {
    return null; // No print assignment needed
  }

  // Already assigned?
  const existing = await prisma.printOrderAssignment.findUnique({
    where: { orderId },
  });
  if (existing) {
    return existing;
  }

  const orderLat = order.latitude ?? DEFAULT_LAT;
  const orderLon = order.longitude ?? DEFAULT_LON;

  const centers = await prisma.printCenter.findMany({
    where: {
      isActive: true,
      latitude: { not: null },
      longitude: { not: null },
    },
    include: {
      user: {
        select: { id: true, phone: true },
      },
    },
  });

  if (centers.length === 0) {
    // No centers with coordinates - pick any active center
    const anyCenter = await prisma.printCenter.findFirst({
      where: { isActive: true },
    });
    if (!anyCenter) {
      return null;
    }
    const assignment = await prisma.printOrderAssignment.create({
      data: {
        orderId: order.id,
        printCenterId: anyCenter.id,
        status: 'PENDING',
      },
      include: {
        order: { include: { items: true, user: { select: { id: true, phone: true } } } },
        printCenter: { include: { user: { select: { id: true } } } },
      },
    });
    if (io) {
      io.to(`print_center_${anyCenter.id}`).emit('print_order_assigned', assignment);
    }
    return assignment;
  }

  const withDistance = centers.map((c) => ({
    ...c,
    distance: calculateDistanceKm(orderLat, orderLon, c.latitude, c.longitude),
  }));
  withDistance.sort((a, b) => a.distance - b.distance);
  const nearest = withDistance[0];

  const assignment = await prisma.printOrderAssignment.create({
    data: {
      orderId: order.id,
      printCenterId: nearest.id,
      status: 'PENDING',
    },
    include: {
      order: { include: { items: true, user: { select: { id: true, phone: true } } } },
      printCenter: { include: { user: { select: { id: true } } } },
    },
  });

  if (io) {
    io.to(`print_center_${nearest.id}`).emit('print_order_assigned', assignment);
  }

  return assignment;
}

module.exports = {
  assignOrderToNearestPrintCenter,
  orderHasPrintItems,
};
