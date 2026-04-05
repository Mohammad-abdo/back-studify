const deliveryRepository = require('../repositories/deliveryRepository');
const { buildPagination, getPaginationParams } = require('../utils/response');
const { NotFoundError } = require('../utils/errors');
const { ORDER_STATUS } = require('../utils/constants');
const { calculateDistanceKm } = require('../utils/helpers');
const osrmService = require('./osrm.service');

const mapAssignmentCustomer = (assignment) => {
  const order = assignment.order || {};
  const user = order.user || {};
  const customerName =
    user.student?.name ||
    user.doctor?.name ||
    user.customer?.contactPerson ||
    user.customer?.entityName ||
    user.phone ||
    null;

  return {
    ...assignment,
    customerName,
    deliveryAddress: order.address || null,
    latitude: order.latitude ?? null,
    longitude: order.longitude ?? null,
  };
};

const getProfile = async ({ userId }) => {
  const delivery = await deliveryRepository.findDeliveryProfileByUserId(userId);

  if (!delivery) {
    throw new NotFoundError('Delivery profile not found');
  }

  return delivery;
};

const updateProfile = async ({ userId, name, vehicleType, vehiclePlateNumber }) => {
  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (vehicleType !== undefined) updateData.vehicleType = vehicleType;
  if (vehiclePlateNumber !== undefined) updateData.vehiclePlateNumber = vehiclePlateNumber;

  return deliveryRepository.updateDeliveryByUserId(userId, updateData);
};

const updateStatus = async ({ userId, status }) =>
  deliveryRepository.updateDeliveryByUserId(userId, { status }, {
    user: {
      select: {
        id: true,
        phone: true,
      },
    },
    wallet: true,
  });

const getAssignments = async ({ userId, page, limit, status }) => {
  const delivery = await deliveryRepository.findDeliveryByUserId(userId);

  if (!delivery) {
    throw new NotFoundError('Delivery profile not found');
  }

  const paginationParams = getPaginationParams(page, limit);
  const where = {
    deliveryId: delivery.id,
    ...(status && { status }),
  };

  const [assignments, total] = await Promise.all([
    deliveryRepository.findAssignments({
      where,
      skip: paginationParams.skip,
      take: paginationParams.limit,
    }),
    deliveryRepository.countAssignments(where),
  ]);

  return {
    data: assignments.map(mapAssignmentCustomer),
    pagination: buildPagination(paginationParams.page, paginationParams.limit, total),
  };
};

const updateLocation = async ({ userId, latitude, longitude, address, io }) => {
  const delivery = await deliveryRepository.findDeliveryByUserId(userId);

  if (!delivery) {
    throw new NotFoundError('Delivery profile not found');
  }

  const location = await deliveryRepository.createDeliveryLocation({
    deliveryId: delivery.id,
    latitude,
    longitude,
    address: address || null,
  });

  if (io) {
    io.to('admin_room').emit('delivery_moved', {
      deliveryId: delivery.id,
      latitude,
      longitude,
      address,
      timestamp: location.createdAt,
    });

    const activeAssignment = await deliveryRepository.findActiveAssignmentByDeliveryId(delivery.id);
    if (activeAssignment) {
      io.to(`order_${activeAssignment.orderId}`).emit('location_updated', {
        deliveryId: delivery.id,
        latitude,
        longitude,
        address,
        timestamp: location.createdAt,
      });
    }
  }

  return location;
};

const getWallet = async ({ userId }) => {
  const delivery = await deliveryRepository.findDeliveryWithWalletByUserId(userId);

  if (!delivery) {
    throw new NotFoundError('Delivery profile not found');
  }

  if (!delivery.wallet) {
    return deliveryRepository.createDeliveryWallet(delivery.id);
  }

  return delivery.wallet;
};

const markPickedUp = async ({ userId, orderId }) => {
  const delivery = await deliveryRepository.findDeliveryByUserId(userId);

  if (!delivery) {
    throw new NotFoundError('Delivery profile not found');
  }

  const assignment = await deliveryRepository.findAssignmentByOrderAndDeliveryId({
    orderId,
    deliveryId: delivery.id,
  });

  if (!assignment) {
    throw new NotFoundError('Assignment not found');
  }

  const updatedAssignment = await deliveryRepository.updateAssignmentWithOrder(assignment.id, {
    status: ORDER_STATUS.PROCESSING,
    pickedUpAt: new Date(),
  });

  await deliveryRepository.updateOrderStatus(orderId, ORDER_STATUS.PROCESSING);

  return updatedAssignment;
};

const markDelivered = async ({ userId, orderId }) => {
  const delivery = await deliveryRepository.findDeliveryByUserId(userId);

  if (!delivery) {
    throw new NotFoundError('Delivery profile not found');
  }

  const assignment = await deliveryRepository.findAssignmentByOrderAndDeliveryId({
    orderId,
    deliveryId: delivery.id,
  });

  if (!assignment) {
    throw new NotFoundError('Assignment not found');
  }

  const updatedAssignment = await deliveryRepository.updateAssignmentWithOrder(assignment.id, {
    status: ORDER_STATUS.DELIVERED,
    deliveredAt: new Date(),
  });

  await deliveryRepository.updateOrderStatus(orderId, ORDER_STATUS.DELIVERED);

  return updatedAssignment;
};

const getActiveOrder = async ({ userId }) => {
  const delivery = await deliveryRepository.findDeliveryByUserId(userId);

  if (!delivery) {
    throw new NotFoundError('Delivery profile not found');
  }

  const assignment = await deliveryRepository.findActiveAssignmentWithOrderByDeliveryId(delivery.id);

  if (!assignment) {
    throw new NotFoundError('No active order');
  }

  return mapAssignmentCustomer(assignment);
};

const postPolylines = async ({ userId, latitude, longitude, points }) => {
  const delivery = await deliveryRepository.findDeliveryByUserId(userId);

  if (!delivery) {
    throw new NotFoundError('Delivery profile not found');
  }

  let currentLat;
  let currentLng;
  let destLat;
  let destLng;
  let orderAddress;

  if (Array.isArray(points) && points.length >= 2) {
    const first = points[0];
    const last = points[points.length - 1];
    currentLat = Number(first.lat);
    currentLng = Number(first.lng);
    destLat = Number(last.lat);
    destLng = Number(last.lng);
    orderAddress = null;
  } else if (latitude != null && longitude != null) {
    currentLat = Number(latitude);
    currentLng = Number(longitude);
    const activeAssignment = await deliveryRepository.findActiveAssignmentWithOrderByDeliveryId(delivery.id);

    if (!activeAssignment?.order) {
      throw new NotFoundError('No active order');
    }

    destLat = activeAssignment.order.latitude;
    destLng = activeAssignment.order.longitude;
    orderAddress = activeAssignment.order.address || null;
  } else {
    throw new NotFoundError('Send latitude & longitude or points array');
  }

  if (destLat == null || destLng == null || currentLat == null || currentLng == null) {
    throw new NotFoundError('Missing coordinates');
  }

  const pointsForOsrm = Array.isArray(points) && points.length >= 2
    ? points.map((point) => ({ lat: Number(point.lat), lng: Number(point.lng) }))
    : [{ lat: currentLat, lng: currentLng }, { lat: destLat, lng: destLng }];

  const osrmResult = await osrmService.getRouteDistanceAndDuration(pointsForOsrm);

  let distanceMeters = null;
  let distanceKm = null;
  let estimatedMinutes = null;
  let estimatedTimeSeconds = null;
  let eta = null;

  if (osrmResult) {
    distanceMeters = osrmResult.distanceMeters;
    distanceKm = Math.round((osrmResult.distanceMeters / 1000) * 1000) / 1000;
    estimatedTimeSeconds = osrmResult.durationSeconds;
    estimatedMinutes = Math.max(1, Math.round(osrmResult.durationSeconds / 60));
    eta = new Date(Date.now() + osrmResult.durationSeconds * 1000).toISOString();
  } else {
    distanceKm = Math.round(calculateDistanceKm(currentLat, currentLng, destLat, destLng) * 1000) / 1000;
    distanceMeters = Math.round(distanceKm * 1000);
    estimatedMinutes = Math.max(1, Math.round(distanceKm * 3));
    estimatedTimeSeconds = estimatedMinutes * 60;
  }

  const polylines = Array.isArray(points) && points.length >= 2
    ? points.map((point) => ({ lat: Number(point.lat), lng: Number(point.lng) }))
    : [
        { lat: currentLat, lng: currentLng },
        { lat: destLat, lng: destLng },
      ];

  return {
    orderDestination: {
      lat: destLat,
      lng: destLng,
      latitude: destLat,
      longitude: destLng,
      address: orderAddress ?? null,
    },
    currentLocation: {
      lat: currentLat,
      lng: currentLng,
      latitude: currentLat,
      longitude: currentLng,
    },
    distanceKm,
    distanceMeters,
    estimatedMinutes,
    estimatedTimeMinutes: estimatedMinutes,
    estimatedTimeSeconds,
    eta,
    source: osrmResult ? 'openstreetmap' : 'haversine',
    polylines,
  };
};

const getShippingHistory = async ({ userId, page, limit, status }) => {
  const delivery = await deliveryRepository.findDeliveryByUserId(userId);

  if (!delivery) {
    throw new NotFoundError('Delivery profile not found');
  }

  const paginationParams = getPaginationParams(page, limit);
  const where = {
    deliveryId: delivery.id,
    status: status || 'DELIVERED',
  };

  const [assignments, total] = await Promise.all([
    deliveryRepository.findShippingHistoryAssignments({
      where,
      skip: paginationParams.skip,
      take: paginationParams.limit,
    }),
    deliveryRepository.countShippingHistoryAssignments(where),
  ]);

  return {
    data: assignments.map(mapAssignmentCustomer),
    pagination: buildPagination(paginationParams.page, paginationParams.limit, total),
  };
};

module.exports = {
  getProfile,
  updateProfile,
  updateStatus,
  getAssignments,
  updateLocation,
  getWallet,
  markPickedUp,
  markDelivered,
  getActiveOrder,
  postPolylines,
  getShippingHistory,
};
