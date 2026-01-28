/**
 * Socket.io Initialization
 */

const { Server } = require('socket.io');
const deliveryHandler = require('./delivery.handler');

const initSocket = (server, corsOrigin) => {
  const io = new Server(server, {
    cors: {
      origin: corsOrigin,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`🔌 New client connected: ${socket.id}`);

    // Register handlers
    deliveryHandler(io, socket);

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

module.exports = initSocket;
