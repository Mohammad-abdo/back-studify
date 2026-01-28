/**
 * Delivery Socket Handler
 * Handles real-time tracking of delivery personnel
 */

const prisma = require('../config/database');

module.exports = (io, socket) => {
  /**
   * Update delivery location
   * @param {Object} data - { deliveryId, latitude, longitude, address, orderId (optional) }
   */
  socket.on('update_location', async (data) => {
    try {
      const { deliveryId, latitude, longitude, address, orderId } = data;

      if (!deliveryId || latitude === undefined || longitude === undefined) {
        return;
      }

      // 1. Save location to database (optional, for history)
      await prisma.deliveryLocation.create({
        data: {
          deliveryId,
          latitude,
          longitude,
          address: address || null,
        },
      });

      // 2. Broadcast to everyone tracking this specific order
      if (orderId) {
        io.to(`order_${orderId}`).emit('location_updated', {
          deliveryId,
          latitude,
          longitude,
          address,
          timestamp: new Date(),
        });
      }

      // 3. Broadcast to admins or anyone tracking all deliveries
      io.to('admin_room').emit('delivery_moved', {
        deliveryId,
        latitude,
        longitude,
        address,
        timestamp: new Date(),
      });

      console.log(`📍 Location updated for delivery ${deliveryId}: ${latitude}, ${longitude}`);
    } catch (error) {
      console.error('❌ Error updating location via socket:', error);
    }
  });

  /**
   * Join an order tracking room
   * @param {Object} data - { orderId }
   */
  socket.on('track_order', (data) => {
    const { orderId } = data;
    if (orderId) {
      socket.join(`order_${orderId}`);
      console.log(`👤 Client joined tracking room for order: ${orderId}`);
    }
  });

  /**
   * Join admin room for overview
   */
  socket.on('join_admin_tracking', () => {
    socket.join('admin_room');
    console.log('👑 Admin joined global tracking room');
  });

  /**
   * Leave an order tracking room
   */
  socket.on('untrack_order', (data) => {
    const { orderId } = data;
    if (orderId) {
      socket.leave(`order_${orderId}`);
      console.log(`👤 Client left tracking room for order: ${orderId}`);
    }
  });
};
